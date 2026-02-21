import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const LEMONSQUEEZY_WEBHOOK_SECRET = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET')!

// ---------------------------------------------------------------------------
// Helper: Verify the webhook signature using HMAC-SHA256
// Lemon Squeezy signs the raw body and sends the sig in X-Signature header
// ---------------------------------------------------------------------------
async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LEMONSQUEEZY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computedHex === signature
}

// ---------------------------------------------------------------------------
// Helper: Map Lemon Squeezy plan name to your internal plan value
// Adjust these strings to match your actual LS product/variant names
// ---------------------------------------------------------------------------
function mapPlanName(variantName: string): 'starter' | 'pro' | null {
  const name = variantName.toLowerCase()
  if (name.includes('starter')) return 'starter'
  if (name.includes('pro')) return 'pro'
  return null
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // --- Read raw body (must be raw for signature verification) ---
  const rawBody = await req.text()
  const signature = req.headers.get('X-Signature') ?? ''

  // --- Verify signature ---
  const isValid = await verifySignature(rawBody, signature)
  if (!isValid) {
    console.error('Invalid webhook signature')
    return new Response('Unauthorized', { status: 401 })
  }

  // --- Parse the event ---
  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Bad Request: invalid JSON', { status: 400 })
  }

  const eventName = event.meta?.['event_name'] as string
  const customData = (event.meta as Record<string, unknown>)?.['custom_data'] as Record<
    string,
    string
  > | null

  console.log('Received LS event:', eventName)

  // CRITICAL: restaurant_id was passed in checkout custom data
  // Without it we can't update the right row
  const restaurantId = customData?.['restaurant_id']
  if (
    !restaurantId &&
    ['order_created', 'subscription_cancelled', 'subscription_payment_failed'].includes(eventName)
  ) {
    console.error('Missing restaurant_id in custom_data for event:', eventName)
    // Return 200 so LS doesn't keep retrying — this would only happen for non-RestaurantOS checkouts
    return new Response('OK', { status: 200 })
  }

  // --- Supabase client with service role (bypasses RLS so we can update any restaurant) ---
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ---------------------------------------------------------------------------
  // EVENT: order_created
  // Fires when a customer completes checkout and payment succeeds.
  // Equivalent to Stripe's checkout.session.completed
  // ---------------------------------------------------------------------------
  if (eventName === 'order_created') {
    const orderData = (event.data as Record<string, unknown>)?.['attributes'] as Record<
      string,
      unknown
    >
    const firstOrderItem = (orderData?.['first_order_item'] ?? {}) as Record<string, unknown>

    const lsCustomerId = String(orderData?.['customer_id'] ?? '')
    const lsSubscriptionId = String(orderData?.['subscription_id'] ?? '')
    const variantName = String(firstOrderItem?.['variant_name'] ?? '')
    const customerPortalUrl = String(orderData?.['urls']?.['customer_portal'] ?? '') || null

    const plan = mapPlanName(variantName)
    if (!plan) {
      console.error('Could not map variant name to plan:', variantName)
      return new Response('OK', { status: 200 })
    }

    const { error } = await supabase
      .from('restaurants')
      .update({
        plan,
        lemonsqueezy_customer_id: lsCustomerId,
        lemonsqueezy_subscription_id: lsSubscriptionId,
        customer_portal_url: customerPortalUrl,
      })
      .eq('id', restaurantId)

    if (error) {
      console.error('DB update error on order_created:', error)
      return new Response('Internal Server Error', { status: 500 })
    }

    console.log(`Restaurant ${restaurantId} upgraded to ${plan}`)
  }

  // ---------------------------------------------------------------------------
  // EVENT: subscription_updated
  // Fires when a subscription changes (upgrade, downgrade, renewal).
  // Use this to keep the plan column in sync if you support plan switching.
  // ---------------------------------------------------------------------------
  else if (eventName === 'subscription_updated') {
    const subData = (event.data as Record<string, unknown>)?.['attributes'] as Record<
      string,
      unknown
    >
    const status = String(subData?.['status'] ?? '')

    // status can be: active, paused, past_due, unpaid, cancelled, expired
    if (status === 'active') {
      const variantName = String(subData?.['variant_name'] ?? '')
      const plan = mapPlanName(variantName)

      if (plan) {
        const { error } = await supabase.from('restaurants').update({ plan }).eq('id', restaurantId)

        if (error) console.error('DB update error on subscription_updated:', error)
        else console.log(`Restaurant ${restaurantId} plan synced to ${plan}`)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT: subscription_cancelled
  // Fires when a subscription is cancelled (either immediately or at period end).
  // Equivalent to Stripe's customer.subscription.deleted
  // ---------------------------------------------------------------------------
  else if (eventName === 'subscription_cancelled') {
    const { error } = await supabase
      .from('restaurants')
      .update({
        plan: 'expired',
        lemonsqueezy_subscription_id: null,
      })
      .eq('id', restaurantId)

    if (error) {
      console.error('DB update error on subscription_cancelled:', error)
      return new Response('Internal Server Error', { status: 500 })
    }

    console.log(`Restaurant ${restaurantId} subscription cancelled → plan set to expired`)
  }

  // ---------------------------------------------------------------------------
  // EVENT: subscription_payment_failed
  // Fires when a recurring payment fails (card declined, expired, etc.)
  // Equivalent to Stripe's invoice.payment_failed
  // ---------------------------------------------------------------------------
  else if (eventName === 'subscription_payment_failed') {
    // You can set to "expired" immediately or wait for LS to retry.
    // Best practice: leave plan as-is on first failure, let LS retry.
    // Only mark expired if the subscription itself is cancelled (handled above).
    // But we do log it so you can monitor/alert.
    console.warn(`Payment failed for restaurant ${restaurantId}. LS will retry automatically.`)

    // Optional: update a payment_status column if you have one
    // await supabase.from("restaurants").update({ payment_status: "past_due" }).eq("id", restaurantId);
  }

  // ---------------------------------------------------------------------------
  // All other events — acknowledge and ignore
  // ---------------------------------------------------------------------------
  else {
    console.log('Unhandled event type:', eventName, '— ignoring')
  }

  // Always return 200 so Lemon Squeezy doesn't retry
  return new Response('OK', { status: 200 })
})
