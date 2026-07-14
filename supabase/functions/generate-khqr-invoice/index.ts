import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: caller, error: callerError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (callerError || !caller?.is_super_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { restaurant_id, plan_id, period_start, period_end } = await req.json()
    if (!restaurant_id || !plan_id || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('monthly_fee, transaction_fee_percent')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: orderData } = await supabase
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

    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('bakong_account_id, merchant_name, merchant_city, currency')
      .eq('id', true)
      .single()

    if (settingsError) {
      return new Response(JSON.stringify({ error: 'Platform settings not found' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let khqrString = null
    let khqrMd5 = null

    if (settings.bakong_account_id) {
      try {
        const { KHQR } = await import('npm:bakong-khqr@1')
        const khqr = new KHQR()
        const result = khqr.generateMerchant({
          accountID: settings.bakong_account_id,
          merchantName: settings.merchant_name || 'QRserve',
          merchantCity: settings.merchant_city || 'Phnom Penh',
          amount: totalAmount.toFixed(2),
          currency: settings.currency || 'USD',
          storeLabel: restaurant_id,
          terminalLabel: plan_id,
        })
        khqrString = result?.qr || null
        khqrMd5 = result?.md5 || null
      } catch (err) {
        console.error('KHQR generation failed:', err)
      }
    }

    const invoiceAmount = Math.round(totalAmount * 100) / 100

    const { data: invoice, error: invoiceError } = await supabase
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
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ invoice }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
