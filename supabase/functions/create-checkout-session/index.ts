import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LEMONSQUEEZY_API_KEY = Deno.env.get('LEMONSQUEEZY_API_KEY')!
const LEMONSQUEEZY_STORE_ID = Deno.env.get('LEMONSQUEEZY_STORE_ID')!

// Your Lemon Squeezy Variant IDs (one per plan)
// Find these in your LS dashboard: Products > Your Product > Variants
const VARIANT_IDS: Record<string, string> = {
  starter: Deno.env.get('LS_VARIANT_STARTER')!,
  pro: Deno.env.get('LS_VARIANT_PRO')!,
}

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
    // --- Authenticate the calling user via Supabase ---
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Get the restaurant for this user ---
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, lemonsqueezy_customer_id')
      .eq('id', profile.restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Parse the requested plan from request body ---
    const { plan } = await req.json()
    if (!plan || !VARIANT_IDS[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan. Use 'starter' or 'pro'." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const variantId = VARIANT_IDS[plan]
    const appUrl = Deno.env.get('APP_URL') ?? 'https://nonemploying-towery-chang.ngrok-free.dev'

    // --- Build the Lemon Squeezy checkout payload ---
    // Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
    const checkoutPayload: Record<string, unknown> = {
      data: {
        type: 'checkouts',
        attributes: {
          // Pre-fill the customer's email so they don't have to type it
          checkout_data: {
            email: user.email,
            custom: {
              // CRITICAL: pass restaurant_id so the webhook knows who to update
              restaurant_id: restaurant.id,
              plan: plan,
            },
          },
          product_options: {
            // Redirect back to your app after successful payment
            redirect_url: `${appUrl}/app/settings?upgraded=true`,
          },
          checkout_options: {
            // Skip the "Thank you" page — redirect immediately
            button_color: '#f97316', // Tailwind orange-500 — change to your brand color
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: variantId },
          },
        },
      },
    }

    // If this restaurant already has a Lemon Squeezy customer ID, attach it
    // so the new subscription links to the same customer record
    // if (restaurant.lemonsqueezy_customer_id) {
    //   ;(checkoutPayload.data as Record<string, unknown>).attributes = {
    //     ...((checkoutPayload.data as Record<string, unknown>).attributes as object),
    //     checkout_data: {
    //       ...((
    //         (checkoutPayload.data as Record<string, unknown>).attributes as Record<string, unknown>
    //       ).checkout_data as object),
    //       // Pass existing customer ID to avoid duplicate customer records in LS
    //       custom: {
    //         restaurant_id: restaurant.id,
    //         plan: plan,
    //         existing_customer_id: restaurant.lemonsqueezy_customer_id,
    //       },
    //     },
    //   }
    // }

    // --- Create the checkout via Lemon Squeezy API ---
    const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify(checkoutPayload),
    })

    if (!lsResponse.ok) {
      const lsError = await lsResponse.text()
      console.error('Lemon Squeezy API error:', lsError)
      return new Response(JSON.stringify({ error: 'Failed to create checkout' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lsData = await lsResponse.json()

    // The checkout URL is what you redirect the user to
    const checkoutUrl = lsData.data.attributes.url

    return new Response(JSON.stringify({ url: checkoutUrl }), {
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
