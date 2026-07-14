//try run directly from supabase
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { BakongKHQR, IndividualInfo, khqrData } from 'npm:bakong-khqr@1.0.20'
import QRCode from 'npm:qrcode-svg@1.1.0'

let corsOrigin: string | null = null

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': corsOrigin || Deno.env.get('SITE_URL') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

async function getPlanPrices(
  supabase: ReturnType<typeof createClient>,
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('system_config')
    .select('key, value')
    .in('key', ['starter_price', 'pro_price'])
  const map: Record<string, string> = {}
  if (data) for (const row of data) map[row.key] = row.value
  return {
    starter: parseFloat(map.starter_price || '9'),
    pro: parseFloat(map.pro_price || '20'),
  }
}

async function getCaller(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<{ userId: string | null }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { userId: null }

  if (authHeader === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return { userId: null }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { userId: null }
  return { userId: user.id }
}

serve(async (req) => {
  corsOrigin = req.headers.get('Origin') || corsOrigin

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders() })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const caller = await getCaller(req, supabase)

  try {
    const body = await req.json()
    const { action } = body || {}

    if (!action || !['generate', 'verify'].includes(action)) {
      return jsonResponse({ error: 'action must be "generate" or "verify"' }, 400)
    }

    if (action === 'generate') return await handleGenerate(body, caller)
    return await handleVerify(body, caller, supabase)
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

// ── Generate ─────────────────────────────────────────────────────────────────

async function handleGenerate(body: Record<string, unknown>, caller: { userId: string | null }) {
  const supabaseC = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { plan, merchant_id, invoice_id } = body as {
    plan?: string
    merchant_id: string
    amount?: number
    invoice_id?: string
  }

  if (!merchant_id) {
    return jsonResponse({ error: 'merchant_id is required' }, 400)
  }

  if (caller.userId) {
    if (invoice_id) {
      const { data: invoice } = await supabaseC
        .from('invoices')
        .select('store_id, stores(owner_id)')
        .eq('id', invoice_id)
        .maybeSingle()
      if (invoice && invoice.stores?.owner_id !== caller.userId) {
        return jsonResponse({ error: 'Unauthorized' }, 403)
      }
    } else if (caller.userId !== merchant_id) {
      return jsonResponse({ error: 'Unauthorized' }, 403)
    }
  }

  const isInvoicePayment = !!invoice_id
  if (!isInvoicePayment && (!plan || !['starter', 'pro'].includes(plan))) {
    return jsonResponse({ error: 'plan must be "starter" or "pro"' }, 400)
  }

  // Compute payment amount server-side — never trust client-supplied amount
  let paymentAmount: number
  if (isInvoicePayment) {
    const { data: invoice } = await supabaseC
      .from('invoices')
      .select('total_due')
      .eq('id', invoice_id)
      .maybeSingle()
    if (!invoice) {
      return jsonResponse({ error: 'Invoice not found' }, 404)
    }
    paymentAmount = invoice.total_due
  } else {
    const prices = await getPlanPrices(supabaseC)
    paymentAmount = prices[plan!]
  }
  if (!paymentAmount || paymentAmount <= 0) {
    return jsonResponse({ error: 'Invalid payment amount' }, 400)
  }

  const bakongAccount = Deno.env.get('BAKONG_MERCHANT_ID')
  if (!bakongAccount) {
    return jsonResponse({ error: 'BAKONG_MERCHANT_ID not configured' }, 500)
  }

  const timestamp = Date.now()
  const transaction_label = `KH${isInvoicePayment ? 'INV' : 'SUB'}-${merchant_id}-${timestamp}`
  // bill number: max 20 chars, taken from the end of the label
  const billNumber = transaction_label.slice(-20)

  // expirationTimestamp is REQUIRED by bakong-khqr@1.0.20 for any dynamic
  // KHQR (non-zero amount) — the SDK throws EXPIRATION_TIMESTAMP_REQUIRED
  // if it's missing. Per the KHQR spec it must be in MILLISECONDS (same
  // units as Date.now()), not UNIX seconds.
  const expirationTimestamp = timestamp + 10 * 60 * 1000 // 10 minutes from now, in ms

  const optionalData = {
    currency: khqrData.currency.usd,
    amount: paymentAmount,
    billNumber,
    storeLabel: 'OnlinePhsar',
    expirationTimestamp,
    merchantCategoryCode: '5999',
  }

  const individualInfo = new IndividualInfo(
    bakongAccount, // e.g. sochetra_seth@bkrt
    'OnlinePhsar', // merchant name
    'Battambang', // merchant city
    optionalData,
  )

  const khqr = new BakongKHQR()
  const response = khqr.generateIndividual(individualInfo)

  if (response.status.code !== 0) {
    console.error('KHQR generation failed:', response.status)
    return jsonResponse({ error: response.status.message }, 500)
  }

  // bakong-khqr@1.0.20 builds tag 99 (creation + expiration timestamps) and
  // the CRC correctly itself — no manual TLV patching or md5 recomputation
  // needed. Verified against the real package output: decode() shows clean
  // creationTimestamp/expirationTimestamp fields and verify() returns
  // isValid: true.
  const { qr: qrString, md5 } = response.data as { qr: string; md5: string }

  const qr = new QRCode({
    content: qrString,
    padding: 2,
    width: 320,
    height: 320,
    color: '#000000',
    background: '#ffffff',
    ecl: 'M',
  })
  const svgString = qr.svg()
  const qrImage = `data:image/svg+xml;base64,${btoa(svgString)}`

  const expiresAt = new Date(expirationTimestamp).toISOString()

  return jsonResponse({
    qr_string: qrString,
    qr_image: qrImage,
    transaction_id: md5,
    expires_at: expiresAt,
  })
}

// ── Verify ────────────────────────────────────────────────────────────────────

async function handleVerify(
  body: Record<string, unknown>,
  caller: { userId: string | null },
  supabase: ReturnType<typeof createClient>,
) {
  const { transaction_id, merchant_id, plan, invoice_id } = body as {
    transaction_id: string
    merchant_id: string
    plan?: string
    invoice_id?: string
  }

  if (!transaction_id || !merchant_id) {
    return jsonResponse({ error: 'transaction_id and merchant_id are required' }, 400)
  }

  if (caller.userId) {
    if (invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('store_id, stores(owner_id)')
        .eq('id', invoice_id)
        .maybeSingle()
      if (invoice && invoice.stores?.owner_id !== caller.userId) {
        return jsonResponse({ error: 'Unauthorized' }, 403)
      }
    } else if (caller.userId !== merchant_id) {
      return jsonResponse({ error: 'Unauthorized' }, 403)
    }
  }

  // Idempotency check — skip if already paid
  if (invoice_id) {
    const { data: existing } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', invoice_id)
      .maybeSingle()
    if (existing?.status === 'paid') {
      return jsonResponse({ status: 'PAID' })
    }
  } else if (plan) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', merchant_id)
      .maybeSingle()
    if (existing?.plan === plan) {
      return jsonResponse({ status: 'PAID' })
    }
  }

  const relayToken = Deno.env.get('BAKONG_RELAY_TOKEN')

  if (!relayToken) {
    return jsonResponse({ error: 'BAKONG_RELAY_TOKEN not configured' }, 500)
  }

  try {
    const relayRes = await fetch('https://api.bakongrelay.com/v1/check_transaction_by_md5', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${relayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ md5: transaction_id }),
    })

    if (relayRes.ok) {
      const relayData = await relayRes.json()
      console.log('[verify] relay response:', JSON.stringify(relayData))

      if (relayData?.responseCode === 0) {
        await applyPayment(transaction_id, merchant_id, plan, invoice_id)
        return jsonResponse({ status: 'PAID' })
      }

      return jsonResponse({ status: 'UNPAID' })
    }

    console.error('[verify] relay http error:', relayRes.status, await relayRes.text())
    return jsonResponse({ status: 'UNPAID', note: 'Relay request failed' })
  } catch (err) {
    console.error('[verify] relay exception:', err)
    return jsonResponse({ status: 'UNPAID', note: 'Relay exception' })
  }
}
// ── Apply payment to DB ───────────────────────────────────────────────────────

async function applyPayment(
  transaction_id: string,
  merchant_id: string,
  plan?: string,
  invoice_id?: string,
) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (invoice_id) {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        khqr_ref: transaction_id,
      })
      .eq('id', invoice_id)

    if (error) {
      console.error('Failed to update invoice:', error)
      throw new Error('Payment verified but failed to update invoice')
    }
  } else {
    if (!plan) throw new Error('plan is required for account upgrade')

    const { error } = await supabase
      .from('profiles')
      .update({ plan, trial_ends_at: null })
      .eq('id', merchant_id)

    if (error) {
      console.error('Failed to update profile:', error)
      throw new Error('Payment verified but failed to upgrade account')
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
  })
}
