// khqr-webhook — receives KHQR.dev webhook events and auto-confirms subscription payments.
// Deploy with: supabase functions deploy khqr-webhook --no-verify-jwt
//
// KHQR.dev webhook security:
//   X-RBK-Signature = hex HMAC-SHA256 of raw body, using the store's Webhook Secret
//   X-RBK-Delivery  = unix timestamp in MILLISECONDS (reject if > 5 min old)
//
// On payment.success:
//   1. Verify HMAC (constant-time, raw body)
//   2. Enforce 5-min replay window
//   3. Find the invoice by khqrdev_md5
//   4. Idempotency: skip if already paid (never downgrade)
//   5. Mark invoice paid + bump restaurant.plan_expires_at (+30 days from period_end)
//   6. Clear grace_period_ends_at (confirmed payment supersedes grace)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// No JWT verification — KHQR.dev doesn't send a Supabase JWT.
// Authentication is entirely via HMAC-SHA256 signature check below.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // ── 1. Read raw body (must happen BEFORE any JSON parse for HMAC to work) ─
  const rawBody = await req.arrayBuffer()
  const bodyBytes = new Uint8Array(rawBody)

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 2. Load webhook secret from platform_settings ─────────────────────────
  const { data: settings, error: settingsError } = await serviceClient
    .from('platform_settings')
    .select('khqrdev_webhook_secret')
    .eq('id', true)
    .single()

  if (settingsError || !settings?.khqrdev_webhook_secret) {
    console.error('Webhook secret not configured')
    // Return 200 so KHQR.dev doesn't retry — this is a platform config problem
    return new Response(JSON.stringify({ ok: false, reason: 'webhook_secret_not_configured' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secret = settings.khqrdev_webhook_secret

  // ── 3. Replay-window check (X-RBK-Delivery is unix ms) ───────────────────
  const deliveryHeader = req.headers.get('x-rbk-delivery')
  const delivery = Number(deliveryHeader)
  if (!Number.isFinite(delivery) || Math.abs(Date.now() - delivery) > 300_000) {
    console.warn('Stale or missing X-RBK-Delivery header:', deliveryHeader)
    return new Response(JSON.stringify({ ok: false, reason: 'expired_timestamp' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 4. HMAC-SHA256 verification (constant-time compare) ──────────────────
  const signatureHeader = (req.headers.get('x-rbk-signature') ?? '').toLowerCase()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', keyMaterial, bodyBytes)
  const expectedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time compare via timingSafeEqual equivalent
  const sigBytes = new TextEncoder().encode(signatureHeader)
  const expBytes = new TextEncoder().encode(expectedHex)

  if (sigBytes.length !== expBytes.length) {
    console.warn('Signature length mismatch')
    return new Response(JSON.stringify({ ok: false, reason: 'invalid_signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // XOR all bytes — result must be 0 for match (constant-time)
  let diff = 0
  for (let i = 0; i < sigBytes.length; i++) {
    diff |= sigBytes[i] ^ expBytes[i]
  }
  if (diff !== 0) {
    console.warn('Signature mismatch')
    return new Response(JSON.stringify({ ok: false, reason: 'invalid_signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 5. Parse payload (only after signature verified) ─────────────────────
  let payload: { event: string; timestamp: number; data: { md5?: string; tran_id?: string; paid_at?: string } }
  try {
    payload = JSON.parse(new TextDecoder().decode(bodyBytes))
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { event, data } = payload
  const deliveryId = String(delivery)

  // ── 6. Only act on payment.success ───────────────────────────────────────
  if (event !== 'payment.success') {
    // payment.scanned and payment.expired are informational only — return 200
    console.log('Ignoring event:', event)
    return new Response(JSON.stringify({ ok: true, result: 'ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { md5 } = data
  if (!md5) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing_md5' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 7. Find invoice by khqrdev_md5 ────────────────────────────────────────
  const { data: invoice, error: invError } = await serviceClient
    .from('subscription_invoices')
    .select('id, restaurant_id, plan_id, period_end, status')
    .eq('khqrdev_md5', md5)
    .single()

  if (invError || !invoice) {
    // Unknown md5 — could be a test payment or a different environment. Return 200 (idempotent).
    console.warn('Invoice not found for md5:', md5)
    return new Response(JSON.stringify({ ok: true, result: 'unknown_invoice' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 8. Idempotency: never downgrade a paid invoice ───────────────────────
  if (invoice.status === 'paid') {
    console.log('Invoice already paid, ignoring duplicate webhook:', invoice.id)
    return new Response(JSON.stringify({ ok: true, result: 'duplicate' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 9. Mark invoice paid ──────────────────────────────────────────────────
  const paidAt = data.paid_at ? new Date(data.paid_at).toISOString() : new Date().toISOString()

  const { error: invoiceUpdateError } = await serviceClient
    .from('subscription_invoices')
    .update({
      status: 'paid',
      paid_at: paidAt,
      khqrdev_tran_id: data.tran_id || invoice.id,
    })
    .eq('id', invoice.id)

  if (invoiceUpdateError) {
    console.error('Failed to update invoice:', invoiceUpdateError)
    // Return 500 so KHQR.dev retries the webhook
    return new Response(JSON.stringify({ ok: false, reason: 'db_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 10. Bump restaurant plan + expiry (+30 days from period_end) ──────────
  // period_end is a date string (YYYY-MM-DD); add 30 days for the next cycle
  const periodEnd = new Date(invoice.period_end)
  const newExpiry = new Date(periodEnd)
  newExpiry.setDate(newExpiry.getDate() + 30)

  const { error: restaurantUpdateError } = await serviceClient
    .from('restaurants')
    .update({
      plan: invoice.plan_id,
      plan_expires_at: newExpiry.toISOString(),
      grace_period_ends_at: null, // confirmed payment clears any grace period
    })
    .eq('id', invoice.restaurant_id)

  if (restaurantUpdateError) {
    console.error('Failed to update restaurant plan:', restaurantUpdateError)
    // Return 500 so KHQR.dev retries — the invoice is already marked paid which is fine,
    // a retry will hit the idempotency check above and skip the duplicate invoice update.
    return new Response(JSON.stringify({ ok: false, reason: 'restaurant_update_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(
    `Payment confirmed: invoice ${invoice.id}, restaurant ${invoice.restaurant_id}, ` +
    `plan ${invoice.plan_id}, expires ${newExpiry.toISOString()}`,
  )

  return new Response(
    JSON.stringify({
      ok: true,
      result: 'paid',
      invoice_id: invoice.id,
      restaurant_id: invoice.restaurant_id,
      plan: invoice.plan_id,
      plan_expires_at: newExpiry.toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
})
