// supabase/functions/create-portal-session/index.ts
//
// Creates a Stripe Customer Portal session and returns the URL.
// Called from SettingsView.vue when a subscribed owner clicks "Manage Billing".
//
// Required env vars:
//   STRIPE_SECRET_KEY             — your Stripe secret key
//   SUPABASE_URL                  — automatically available
//   SUPABASE_SERVICE_ROLE_KEY     — automatically available

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('LEMONSQUEEZY_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { restaurantId, returnUrl } = await req.json()

    if (!restaurantId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurantId, returnUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch the restaurant's Stripe customer ID
    const { data: restaurant, error: dbError } = await supabase
      .from('restaurants')
      .select('stripe_customer_id')
      .eq('id', restaurantId)
      .single()

    if (dbError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!restaurant.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found for this restaurant. Subscribe first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create the portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: restaurant.stripe_customer_id,
      return_url: returnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-portal-session error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
