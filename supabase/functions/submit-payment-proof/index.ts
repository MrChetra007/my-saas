import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRACE_DAYS = 2

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

    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: caller, error: callerError } = await serviceClient
      .from('users')
      .select('role, restaurant_id, is_super_admin')
      .eq('id', user.id)
      .single()

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { invoice_id, proof_url } = await req.json()
    if (!invoice_id || !proof_url) {
      return new Response(JSON.stringify({ error: 'Missing invoice_id or proof_url' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('subscription_invoices')
      .select('id, restaurant_id, status')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isOwnRestaurant = caller.restaurant_id === invoice.restaurant_id
    const isSuperAdmin = caller.is_super_admin === true
    if (!isOwnRestaurant && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — not your invoice' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['pending', 'rejected'].includes(invoice.status)) {
      return new Response(JSON.stringify({ error: `Invoice status "${invoice.status}" does not accept proof` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()
    const graceEnd = new Date()
    graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS)

    const { error: updateInvoiceError } = await serviceClient
      .from('subscription_invoices')
      .update({
        status: 'pending_review',
        proof_url,
        submitted_at: now,
        rejected_reason: null,
        rejected_at: null,
      })
      .eq('id', invoice.id)

    if (updateInvoiceError) {
      return new Response(JSON.stringify({ error: updateInvoiceError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: restaurantError } = await serviceClient
      .from('restaurants')
      .update({
        grace_period_ends_at: graceEnd.toISOString(),
        updated_at: now,
      })
      .eq('id', invoice.restaurant_id)

    if (restaurantError) {
      return new Response(JSON.stringify({ error: restaurantError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      grace_period_ends_at: graceEnd.toISOString(),
    }), {
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
