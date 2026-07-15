import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { BakongKHQR, IndividualInfo, khqrData } from 'npm:bakong-khqr@1.0.20'
import QRCode from 'npm:qrcode-svg@1.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()
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

    const isSuperAdmin = caller.is_super_admin === true
    const isOwnRestaurant = caller.restaurant_id === restaurant_id
    if (!isSuperAdmin && !isOwnRestaurant) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Dedup: return existing open invoice ────────────────────────────────
    // IMPORTANT: only treat it as a valid dedup hit if it actually has a QR.
    // Otherwise a previously-broken invoice (e.g. generated before
    // bakong_account_id was configured) gets served forever and KHQR
    // generation never gets retried.
    const { data: existing } = await serviceClient
      .from('subscription_invoices')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0 && existing[0].khqr_string) {
      // qr_image is never stored in the DB (only the raw khqr_string is),
      // so it has to be regenerated here every time we hand back an
      // existing invoice — otherwise the frontend gets khqr_string but no
      // qr_image and the <img> tag breaks again.
      let dedupedQrImage = null
      try {
        const qrCode = new QRCode({
          content: existing[0].khqr_string,
          padding: 2,
          width: 320,
          height: 320,
          color: '#000000',
          background: '#ffffff',
          ecl: 'M',
        })
        dedupedQrImage = `data:image/svg+xml;base64,${btoa(qrCode.svg())}`
      } catch (err) {
        console.error('Failed to re-render QR image for existing invoice:', err)
      }

      return new Response(
        JSON.stringify({
          invoice: { ...existing[0], qr_image: dedupedQrImage },
          deduped: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // If we found a stale invoice with no QR, mark it expired instead of
    // leaving it dangling — we're about to create a fresh one below.
    if (existing && existing.length > 0 && !existing[0].khqr_string) {
      await serviceClient
        .from('subscription_invoices')
        .update({ status: 'expired' })
        .eq('id', existing[0].id)
    }

    const { data: plan, error: planError } = await serviceClient
      .from('plans')
      .select('monthly_fee, transaction_fee_percent')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: orderData } = await serviceClient
      .from('orders')
      .select('total_amount, discount_amount')
      .eq('restaurant_id', restaurant_id)
      .gte('created_at', period_start)
      .lt('created_at', period_end)
      .neq('status', 'rejected')

    const orderVolume = (orderData || []).reduce((sum, o) => {
      const netAmount = Number(o.total_amount) - Number(o.discount_amount || 0)
      return sum + Math.max(0, netAmount)
    }, 0)

    const monthlyFee = Number(plan.monthly_fee)
    const txFeePercent = Number(plan.transaction_fee_percent)
    const transactionFee = (orderVolume * txFeePercent) / 100
    const totalAmount = monthlyFee + transactionFee

    const { data: settings, error: settingsError } = await serviceClient
      .from('platform_settings')
      .select('bakong_account_id, merchant_name, merchant_city, currency')
      .eq('id', true)
      .single()

    if (settingsError) {
      return new Response(JSON.stringify({ error: 'Platform settings not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let khqrString = null
    let khqrMd5 = null
    let qrImage = null
    let khqrError = null

    if (settings.bakong_account_id) {
      try {
        const expirationTimestamp = Date.now() + 10 * 60 * 1000
        const billNumber = `INV-${restaurant_id.slice(0, 8)}-${Date.now()}`.slice(-20)
        const optionalData = {
          currency: khqrData.currency.usd,
          amount: Math.round(totalAmount * 100) / 100,
          billNumber,
          storeLabel: 'QRserve',
          expirationTimestamp,
          merchantCategoryCode: '5999',
        }
        const individualInfo = new IndividualInfo(
          settings.bakong_account_id,
          settings.merchant_name || 'QRserve',
          settings.merchant_city || 'Phnom Penh',
          optionalData,
        )
        const khqr = new BakongKHQR()
        const response = khqr.generateIndividual(individualInfo)
        if (response?.status?.code === 0 && response?.data) {
          const { qr, md5 } = response.data as { qr: string; md5: string }
          khqrString = qr || null
          khqrMd5 = md5 || null

          // Render the KHQR payload string into an actual scannable image.
          // khqr_string alone is just text data — it is NOT displayable
          // as-is. This is the piece the frontend needs to show a QR code.
          if (khqrString) {
            const qrCode = new QRCode({
              content: khqrString,
              padding: 2,
              width: 320,
              height: 320,
              color: '#000000',
              background: '#ffffff',
              ecl: 'M',
            })
            const svgString = qrCode.svg()
            qrImage = `data:image/svg+xml;base64,${btoa(svgString)}`
          }
        } else {
          khqrError = response?.status?.message || 'KHQR generation returned non-zero code'
        }
      } catch (err) {
        console.error('KHQR generation failed:', err)
        khqrError = err.message
      }
    } else {
      // Surface this clearly instead of silently producing a QR-less invoice.
      khqrError = 'bakong_account_id not configured in platform_settings'
    }

    const invoiceAmount = Math.round(totalAmount * 100) / 100

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('subscription_invoices')
      .insert({
        restaurant_id,
        plan_id,
        period_start,
        period_end,
        order_volume: Math.round(orderVolume * 100) / 100,
        base_fee: monthlyFee,
        transaction_fee_amount: Math.round(transactionFee * 100) / 100,
        total_amount: invoiceAmount,
        currency: settings.currency || 'USD',
        khqr_string: khqrString,
        khqr_md5: khqrMd5,
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
      JSON.stringify({ invoice: { ...invoice, qr_image: qrImage }, khqr_error: khqrError }),
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
