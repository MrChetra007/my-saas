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

    const { restaurant_id, plan_id, period_start, period_end } = await req.json()
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

    // ── Get plan pricing ───────────────────────────────────────────────
    const cfg = settings?.app_config || {}
    let monthlyFee: number

    if (plan_id === 'pro' && cfg.pro_price_manual) {
      monthlyFee = Number(cfg.pro_price_manual)
    } else if (plan_id === 'starter' && cfg.starter_price_manual) {
      monthlyFee = Number(cfg.starter_price_manual)
    } else {
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
      monthlyFee = Number(plan.monthly_fee)
    }

    const totalAmount = Math.round(monthlyFee * 100) / 100

    // ── Dedup: return existing open invoice if it already has a KHQR.dev payment ──
    // This avoids hitting the 1 req/s rate limit on every modal re-mount.
    const { data: existing } = await serviceClient
      .from('subscription_invoices')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0 && existing[0].khqrdev_md5) {
      const inv = existing[0]
      return new Response(
        JSON.stringify({
          invoice: inv,
          md5: inv.khqrdev_md5,
          checkout_url: inv.khqrdev_checkout_url,
          qr_image_url: `https://api.khqr.dev/v1/generate_khqr_image/${inv.khqrdev_md5}`,
          deduped: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // If a stale invoice exists with no KHQR.dev payment, expire it
    if (existing && existing.length > 0 && !existing[0].khqrdev_md5) {
      await serviceClient
        .from('subscription_invoices')
        .update({ status: 'expired' })
        .eq('id', existing[0].id)
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
