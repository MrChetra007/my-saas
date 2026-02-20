// supabase/functions/create-checkout-session/index.ts
//
// Creates a Stripe Checkout session and returns the URL.
// Called from SettingsView.vue and TrialWallView.vue when the owner clicks Upgrade.
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY       — your Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_STARTER    — Stripe Price ID for the Starter plan
//   STRIPE_PRICE_PRO        — Stripe Price ID for the Pro plan
//   SUPABASE_URL            — automatically available in Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY — automatically available in Edge Functions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
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
    const { plan, restaurantId, successUrl, cancelUrl } = await req.json()

    // Validate inputs
    if (!plan || !restaurantId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: plan, restaurantId, successUrl, cancelUrl',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!['starter', 'pro'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Invalid plan. Must be "starter" or "pro".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve Stripe Price ID from env
    const priceId =
      plan === 'pro' ? Deno.env.get('STRIPE_PRICE_PRO') : Deno.env.get('STRIPE_PRICE_STARTER')

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Stripe Price ID not configured for plan: ${plan}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch restaurant to get existing stripe_customer_id (if any)
    const { data: restaurant, error: dbError } = await supabase
      .from('restaurants')
      .select('stripe_customer_id, name')
      .eq('id', restaurantId)
      .single()

    if (dbError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build Stripe Checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Pass restaurantId in metadata so the webhook can update the DB
      metadata: { restaurant_id: restaurantId },
      subscription_data: {
        metadata: { restaurant_id: restaurantId },
      },
      // If owner already has a Stripe customer, reuse it
      ...(restaurant.stripe_customer_id
        ? { customer: restaurant.stripe_customer_id }
        : { customer_creation: 'always' }),
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
