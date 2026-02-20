// supabase/functions/stripe-webhook/index.ts
//
// Receives Stripe webhook events and updates the restaurants table accordingly.
//
// Required env vars:
//   STRIPE_SECRET_KEY             — your Stripe secret key
//   STRIPE_WEBHOOK_SECRET         — your Stripe webhook signing secret (whsec_...)
//   SUPABASE_URL                  — automatically available
//   SUPABASE_SERVICE_ROLE_KEY     — automatically available
//
// ── Setup in Stripe Dashboard ────────────────────────────────────────────────
// 1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
// 2. Endpoint URL: https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
// 3. Select these events to listen for:
//      checkout.session.completed
//      customer.subscription.updated
//      customer.subscription.deleted
//      invoice.payment_failed
// 4. Copy the signing secret (whsec_...) → add as STRIPE_WEBHOOK_SECRET in Supabase secrets
//
// ── Plan values written to restaurants.plan ──────────────────────────────────
//   'pro'      — Pro subscription active
//   'starter'  — Starter subscription active
//   'expired'  — Subscription cancelled or payment failed
//   'trial'    — Default (unchanged by this webhook)

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

// ── Helpers ───────────────────────────────────────────────────────────────────

// Resolve the plan name from a Stripe Price ID
function planFromPriceId(priceId: string): 'starter' | 'pro' | null {
  if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) return 'pro'
  if (priceId === Deno.env.get('STRIPE_PRICE_STARTER')) return 'starter'
  return null
}

// Update the restaurants row by restaurant_id
async function updateRestaurant(restaurantId: string, fields: Record<string, unknown>) {
  const { error } = await supabase.from('restaurants').update(fields).eq('id', restaurantId)

  if (error) {
    console.error(`Failed to update restaurant ${restaurantId}:`, error)
    throw error
  }
  console.log(`Updated restaurant ${restaurantId}:`, fields)
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })
  }

  // Read raw body for signature verification
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`Received Stripe event: ${event.type}`)

  try {
    switch (event.type) {
      // ── Checkout completed → activate subscription ──────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // We only care about subscription checkouts
        if (session.mode !== 'subscription') break

        const restaurantId = session.metadata?.restaurant_id
        if (!restaurantId) {
          console.error('checkout.session.completed: no restaurant_id in metadata')
          break
        }

        // Retrieve the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price?.id
        const plan = priceId ? planFromPriceId(priceId) : null

        await updateRestaurant(restaurantId, {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: plan ?? 'pro', // fallback to 'pro' if Price ID not matched
        })

        break
      }

      // ── Subscription updated (e.g. plan change, renewal) ────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const restaurantId = subscription.metadata?.restaurant_id
        if (!restaurantId) {
          console.error('customer.subscription.updated: no restaurant_id in metadata')
          break
        }

        const priceId = subscription.items.data[0]?.price?.id
        const plan = priceId ? planFromPriceId(priceId) : null

        // Only update plan if subscription is still active
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await updateRestaurant(restaurantId, {
            plan: plan ?? 'pro',
            stripe_subscription_id: subscription.id,
          })
        }

        break
      }

      // ── Subscription cancelled ───────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const restaurantId = subscription.metadata?.restaurant_id
        if (!restaurantId) {
          console.error('customer.subscription.deleted: no restaurant_id in metadata')
          break
        }

        // Mark as expired — the router guard and TrialWallView handle the UI
        await updateRestaurant(restaurantId, {
          plan: 'expired',
          stripe_subscription_id: null,
        })

        break
      }

      // ── Payment failed ────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Look up the restaurant by stripe_customer_id
        const customerId = invoice.customer as string
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (error || !restaurant) {
          console.error('invoice.payment_failed: restaurant not found for customer', customerId)
          break
        }

        // Mark as expired — Stripe will retry the payment; you can also send an email here
        await updateRestaurant(restaurant.id, {
          plan: 'expired',
        })

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err)
    // Return 500 so Stripe retries the webhook
    return new Response('Webhook handler error', { status: 500 })
  }

  // Always return 200 to acknowledge receipt
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
