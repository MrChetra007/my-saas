import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// KHQR.dev rate limit: 1 req/s for generate_qr (exceeding locks for 3s, spamming locks 60s)
// We reuse an existing unexpired invoice's khqrdev_md5 instead of creating a new QR each time.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Authenticate caller
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: caller, error: callerError } = await serviceClient
      .from('users')
      .select('role, restaurant_id, is_super_admin')
      .eq('id', user.id)
      .single()

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { restaurant_id, plan_id, period_start, period_end, force_new } = await req.json()
    if (!restaurant_id || !plan_id || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only allow restaurant's own admin or a super admin
    const isSuperAdmin = caller.is_super_admin === true
    const isOwnRestaurant = caller.restaurant_id === restaurant_id
    if (!isSuperAdmin && !isOwnRestaurant) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Load platform settings (KHQR.dev token + pricing) ─────────────
    const { data: settings, error: settingsError } = await serviceClient
      .from('platform_settings')
      .select('khqrdev_token, merchant_name, merchant_city, currency, app_config')
      .eq('id', true)
      .single()

    if (settingsError || !settings?.khqrdev_token) {
      return new Response(JSON.stringify({ error: 'KHQR.dev token not configured in platform settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Get plan pricing: single source of truth from public.plans ─────
    const { data: plan, error: planError } = await serviceClient
      .from('plans')
      .select('monthly_fee')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let monthlyFee = Number(plan.monthly_fee)

    // Optional: Sandbox / test mode override only if explicitly enabled
    const cfg = settings?.app_config || {}
    if (cfg.sandbox_mode === true && cfg.sandbox_amount) {
      monthlyFee = Number(cfg.sandbox_amount)
    }

    // Ensure strict dot formatting with 2 decimals (e.g. 25.00)
    const totalAmount = parseFloat(monthlyFee.toFixed(2))

    // ── Check existing open invoice ────────────────────────────────────
    const { data: existing } = await serviceClient
      .from('subscription_invoices')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const inv = existing[0]
      const elapsedMs = Date.now() - new Date(inv.created_at).getTime()
      // KHQR.dev QR codes expire after 10 minutes (600 seconds)
      const isExpired = elapsedMs >= 9.5 * 60 * 1000
      const amountMismatch = Math.abs(Number(inv.total_amount) - totalAmount) > 0.001
      const planMismatch = inv.plan_id !== plan_id

      if (force_new || isExpired || amountMismatch || planMismatch) {
        // Expire outdated/mismatched invoice so we generate a fresh, accurate QR
        await serviceClient
          .from('subscription_invoices')
          .update({ status: 'expired' })
          .eq('id', inv.id)
      } else if (inv.khqrdev_md5) {
        const remainingSeconds = Math.max(10, Math.floor((10 * 60 * 1000 - elapsedMs) / 1000))
        return new Response(
          JSON.stringify({
            invoice: inv,
            md5: inv.khqrdev_md5,
            checkout_url: inv.khqrdev_checkout_url,
            qr_image_url: `https://api.khqr.dev/v1/generate_khqr_image/${inv.khqrdev_md5}`,
            remaining_seconds: remainingSeconds,
            amount: totalAmount,
            deduped: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // ── Call KHQR.dev generate_qr ──────────────────────────────────────
    const qrRes = await fetch('https://api.khqr.dev/v1/generate_qr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.khqrdev_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: totalAmount }),
      signal: AbortSignal.timeout(8000),
    })

    if (qrRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited by KHQR.dev. Please wait a moment and try again.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!qrRes.ok) {
      const errBody = await qrRes.text().catch(() => 'unknown error')
      return new Response(JSON.stringify({ error: `KHQR.dev error: ${errBody}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const qrJson = await qrRes.json()
    const { md5, tran_id, checkout_url } = (qrJson.data || qrJson) as {
      md5: string
      tran_id: string
      checkout_url: string
    }

    if (!md5) {
      return new Response(JSON.stringify({ error: 'KHQR.dev did not return a valid md5' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Create invoice row ─────────────────────────────────────────────
    const { data: invoice, error: invoiceError } = await serviceClient
      .from('subscription_invoices')
      .insert({
        restaurant_id,
        plan_id,
        period_start,
        period_end,
        order_volume: 0,
        base_fee: monthlyFee,
        transaction_fee_amount: 0,
        total_amount: totalAmount,
        currency: settings.currency || 'USD',
        khqr_string: null,       // Bakong library field — unused in KHQR.dev flow
        khqr_md5: null,          // Bakong library field — unused in KHQR.dev flow
        khqrdev_md5: md5,
        khqrdev_tran_id: tran_id,
        khqrdev_checkout_url: checkout_url,
        status: 'pending',
      })
      .select()
      .single()

    if (invoiceError) {
      return new Response(JSON.stringify({ error: invoiceError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        invoice,
        md5,
        checkout_url,
        // The QR image URL from KHQR.dev — no token needed, public endpoint
        qr_image_url: `https://api.khqr.dev/v1/generate_khqr_image/${md5}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
