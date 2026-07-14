# NEXT STEPS — KHQR Billing + Super Admin (QRserve)

Context for whichever AI/dev picks this up: this is the **QRserve** restaurant SaaS
(Vue 3 + Pinia + Supabase, dual layout admin/waiter/cashier/kitchen/super-admin).
Full architecture is in the project's existing README/schema — read that first if
available. This doc only covers the **new work**: replacing LemonSqueezy billing
with a Bakong KHQR-based manual billing flow, run entirely by the super admin.

Ready-made files for this task live in `qrserve-khqr/`:
```
qrserve-khqr/
├── sql/002_khqr_billing.sql
├── functions/generate-khqr-invoice/index.ts
├── functions/mark-invoice-paid/index.ts
└── vue-snippets/
    ├── PlatformSettingsCard.vue
    └── RestaurantInvoicePanel.vue
```

---

## Goal

1. Owner (Seth) becomes a **super admin** with access to `/super-admin/*` — manages
   all restaurants across tenants.
2. Payment method switches from LemonSqueezy back to **KHQR (Bakong)**.
3. Pricing:
   - **Starter**: $10/month + 2% of order volume
   - **Pro**: $20/month + 1% of order volume
4. Billing stays **manual** (no live payment gateway/webhook) — super admin
   generates a KHQR invoice, the restaurant owner scans and pays via any
   Cambodian banking app, super admin confirms and the system bumps the
   restaurant's plan + expiry.

---

## Step 1 — Apply the SQL migration

Run `qrserve-khqr/sql/002_khqr_billing.sql` against the Supabase project.

Adds:
- `platform_settings` — single row, holds **your** Bakong account ID (not the
  restaurant's) — this is who gets paid.
- `plans` — pricing config (`starter`: 10 / 2%, `pro`: 20 / 1%). Seeded already.
- `subscription_invoices` — one row per billing cycle per restaurant, with the
  generated KHQR string/MD5 and payment status.
- RLS: `is_super_admin` gets full access to all three; restaurant admins can
  only read their own restaurant's invoices; `plans` is readable by anyone
  authenticated (so the app can show plan limits/pricing in-app).

No changes to `restaurants.billing_type` — everything stays `'manual'`.
`lemonsqueezy_customer_id` / `lemonsqueezy_subscription_id` columns are left in
place but unused going forward (safe to ignore, no need to drop them).

**Verify after running:**
```sql
select * from plans;                 -- should show starter (10, 2%) and pro (20, 1%)
select * from platform_settings;     -- single row, bakong_account_id is NULL initially
```

---

## Step 2 — Deploy the edge functions

```bash
supabase functions deploy generate-khqr-invoice
supabase functions deploy mark-invoice-paid
```

Both functions:
- Verify the caller's JWT and check `users.is_super_admin` before doing anything
  (403 otherwise).
- `generate-khqr-invoice` computes `order_volume` **server-side** from the
  `orders` table for the given period — never trust a client-submitted amount
  for something that becomes a payment QR.
- `mark-invoice-paid` bumps `restaurants.plan` + `plan_expires_at` (+30 days
  from `period_end`) and flips the invoice to `paid`, atomically-ish (two
  sequential updates, acceptable for this low-volume manual flow).

**Dependency check:** both import `bakong-khqr` via `npm:bakong-khqr@1` and
`@supabase/supabase-js` via `npm:@supabase/supabase-js@2`. Confirm Supabase
Edge Functions (Deno) can resolve these — if the project pins exact versions
elsewhere, match that.

**Open question to resolve during implementation:** `generate-khqr-invoice`
currently sums `orders.total_amount` where `status != 'rejected'`. Confirm with
Seth whether:
- `discount_amount` should reduce the billable volume, and
- orders cancelled/rejected *after* being accepted should count.
Adjust the query in `functions/generate-khqr-invoice/index.ts` accordingly —
it's a single `.eq/.neq` chain, easy to change.

---

## Step 3 — Frontend

1. Install `qrcode` if not already present: `npm install qrcode`
2. Copy `vue-snippets/PlatformSettingsCard.vue` into
   `src/views/super-admin/Settings.vue` (or as a sub-component rendered there).
   This is where Seth pastes his own Bakong ID once (e.g. `seth@aclb`).
3. Copy `vue-snippets/RestaurantInvoicePanel.vue` into
   `src/views/super-admin/Subscriptions.vue`, rendered per restaurant row/detail
   view. Props: `restaurant` object with `{ id, name, plan }`.
4. Both snippets call the edge functions via `fetch` with the current session's
   access token — adjust the `VITE_SUPABASE_URL` env var reference if the
   project's `.env` naming differs.
5. Remove/hide any LemonSqueezy checkout UI (`create-checkout-session`,
   `create-portal-session` calls) from `src/views/app/Settings.vue` — replace
   with a simple "Contact admin to renew" message or a read-only view of the
   restaurant's own `subscription_invoices` (RLS already allows this).
6. Leave the LemonSqueezy edge functions (`create-checkout-session`,
   `create-portal-session`, `lemonsqueezy-webhook`) deployed but unused — no
   need to delete them yet, just stop calling them from the UI.

---

## Step 4 — Promote Seth to super admin

**Manual step, done directly in the Supabase dashboard/SQL editor — not
automated, by Seth's own choice:**

```sql
update public.users
set role = 'super_admin', is_super_admin = true
where email = '<seth's account email>';
```

No app code changes needed here — the router guard
(`src/router/index.js` → `router.beforeEach`) already isolates `/super-admin/*`
by role, per the existing architecture doc.

---

## Step 5 — Sanity test end-to-end

1. Log in as super admin → Settings → save a real or test Bakong ID.
2. Go to Subscriptions → pick a restaurant with `plan = 'starter'` or `'pro'` →
   pick a period → Generate Invoice.
3. Confirm: base fee + tx fee math is correct, KHQR image renders, and scanning
   it with a Bakong-compatible app shows the right amount/merchant name.
4. Click "Mark as Paid" → confirm `restaurants.plan_expires_at` updated
   (+30 days from `period_end`) and the invoice status flipped to `paid`.
5. Log in as that restaurant's admin → confirm they can see their own invoice
   history (read-only) but cannot see other restaurants' invoices or write to
   `platform_settings` / `plans`.

---

## Not in scope for this pass (flag if asked, don't build unprompted)

- Automated payment confirmation via the Bakong Open API (`checkTransactionByMD5`)
  — currently 100% manual confirmation by super admin. `khqr_md5` is already
  stored on the invoice so this can be added later without a schema change.
- Recurring/automatic invoice generation (e.g. a cron edge function) — invoices
  are generated on-demand by the super admin for now.
- KHR currency support beyond the `platform_settings.currency` toggle — untested,
  default is USD.
