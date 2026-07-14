# NEXTSTEP3.md — Retire LemonSqueezy (Keep the Code, Stop Using It)

Builds on top of `NEXTSTEP.md` (super admin + base KHQR billing tables) and
`NEXTSTEP2.md` (proof-upload + grace period flow). This pass is small: it
turns off LemonSqueezy as the active billing path without deleting anything.
Nothing here is a rollback-proof one-way door — every LemonSqueezy file,
table column, and function stays in place, just dormant.

No new files in `qrserve-khqr/` for this pass — this is three small actions
against the existing project, described below.

---

## Why keep the code instead of deleting it

- `restaurants.lemonsqueezy_customer_id` / `lemonsqueezy_subscription_id`
  columns, and the `create-checkout-session` / `create-portal-session` /
  `lemonsqueezy-webhook` edge functions, are harmless sitting unused.
- Keeping them means flipping back (or running both side-by-side for a
  specific restaurant later) is a config change, not a rebuild.
- Deleting now would also mean re-writing this if the KHQR flow ever needs a
  fallback for a restaurant whose Bakong payment fails for some reason.

---

## Step 1 — One-time data fix: force every restaurant onto manual billing

```sql
update public.restaurants set billing_type = 'manual';
```

This makes sure nothing in the app is still branching on
`billing_type = 'lemonsqueezy'` for any existing restaurant. New restaurants
should already default to `'manual'` per the schema's
`DEFAULT 'manual'::text` on that column — confirm that default is still in
place and hasn't been overridden anywhere in the signup/onboarding flow.

---

## Step 2 — Hide the LemonSqueezy UI, don't remove it

In the restaurant-side `Settings.vue` billing tab, find wherever it calls
`create-checkout-session` / `create-portal-session` (the "Upgrade" / "Manage
Billing" buttons that redirect to LemonSqueezy checkout/portal URLs).

Wrap that section behind a flag instead of deleting the markup or the
function calls:

```vue
<template>
  <!-- LemonSqueezy checkout/portal UI — disabled, kept for potential rollback -->
  <div v-if="LEMONSQUEEZY_ENABLED">
    <!-- existing upgrade/manage billing buttons -->
  </div>

  <!-- KHQR billing UI takes over this spot -->
  <SubscriptionInvoiceHistory v-else />
</template>

<script setup>
const LEMONSQUEEZY_ENABLED = false // flip back to true to re-enable LemonSqueezy checkout
</script>
```

`SubscriptionInvoiceHistory` here is whatever read-only view of the
restaurant's own `subscription_invoices` you built per NEXTSTEP2.md Step 3.6 —
if that doesn't exist yet as a named component, this is a good time to
extract it into one so this toggle is a clean swap.

---

## Step 3 — Disable the webhook trigger (outside the codebase)

This is the actual "stop" switch — everything above just hides UI and
normalizes data, but the webhook is what would otherwise keep LemonSqueezy's
subscription lifecycle events flowing into the database.

1. Log into the LemonSqueezy dashboard.
2. Go to the webhook settings for this store/product.
3. Remove or disable the webhook URL pointing at the deployed
   `lemonsqueezy-webhook` edge function.

The function itself stays deployed, unmodified — it simply never receives
another request once the webhook URL is gone. No code change, no redeploy.

---

## Step 4 — Sanity check

1. Confirm `select distinct billing_type from restaurants;` returns only
   `manual`.
2. Confirm the Settings billing tab no longer shows the LemonSqueezy
   checkout/portal buttons for any restaurant, and instead shows their KHQR
   invoice history / the `SubscriptionGateModal` when blocked.
3. Confirm no outstanding LemonSqueezy subscriptions are left "live" on their
   end that would keep charging a restaurant's card — this is a LemonSqueezy
   dashboard check, not a code check, and worth doing once per existing paying
   restaurant before flipping the switch.
4. Confirm `create-checkout-session`, `create-portal-session`, and
   `lemonsqueezy-webhook` are all still present under
   `supabase/functions/` — this pass should not have removed any files.

---

## Rollback (if ever needed)

1. Re-add the webhook URL in the LemonSqueezy dashboard.
2. Flip `LEMONSQUEEZY_ENABLED` back to `true` in `Settings.vue`.
3. Decide per-restaurant whether `billing_type` should go back to
   `'lemonsqueezy'` (only for restaurants actually resuming that path — don't
   blanket-flip every restaurant back, since most will already be on KHQR
   invoices with their own payment history by then).

## Not in scope for this pass

- Deleting any LemonSqueezy code, columns, or functions.
- Migrating existing LemonSqueezy subscription history into
  `subscription_invoices` — those stay as historical records under the old
  columns; only new billing cycles go through KHQR.
