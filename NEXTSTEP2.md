# NEXTSTEP2.md — KHQR Proof-Upload + Grace Period Flow (QRserve)

Builds on top of `NEXTSTEP.md` (already done — super admin role, base KHQR
billing tables, manual invoice generation). This pass adds: restaurant
self-service invoice + proof upload, an automatic 2-day grace period, and a
super admin approve/reject review queue.

Files for this task live in `qrserve-khqr/`:
```
qrserve-khqr/
├── sql/
│   └── 003_khqr_proof_flow.sql          (run this — adds to what 002 already created)
├── functions/
│   ├── generate-khqr-invoice/index.ts   (UPDATED — now self-service for restaurant admins too)
│   ├── submit-payment-proof/index.ts    (NEW — restaurant uploads proof -> grace starts)
│   ├── approve-invoice/index.ts         (NEW — replaces mark-invoice-paid)
│   └── reject-invoice/index.ts          (NEW — rejects -> grace revoked)
└── vue-snippets/
    ├── useBillingStatus.js              (NEW — active / grace / blocked)
    ├── SubscriptionGateModal.vue         (NEW — restaurant-side QR popup + upload)
    ├── PendingApprovalsPanel.vue         (NEW — super-admin review queue)
    ├── RestaurantInvoicePanel.vue        (from NEXTSTEP.md — "Mark as Paid" button now calls approve-invoice)
    └── router-guard-changes.js           (NEW — how the guard needs to change)
```

Note: `mark-invoice-paid` from the first pass is superseded by
`approve-invoice` — remove/undeploy it if it's live, and update anything
still calling it (including `RestaurantInvoicePanel.vue`, already updated here).

---

## The flow, end to end

1. Restaurant's `plan_expires_at` passes. The router guard does **not**
   hard-redirect for this case anymore (see `router-guard-changes.js`) — the
   app loads normally, but `SubscriptionGateModal.vue` (mounted once in
   `AppLayout.vue`) detects `status === 'blocked'` and shows an undismissable
   overlay.
2. The modal calls `generate-khqr-invoice` for the restaurant's own ID
   (self-service now allowed for a restaurant's own admin — server still
   computes the amount from actual order data, so they can't influence the
   total), renders the KHQR as an image, and shows a file input.
3. Restaurant admin uploads a screenshot → client uploads directly to the
   `payment-proofs` storage bucket (their own restaurant's folder, RLS-enforced)
   → calls `submit-payment-proof` with the resulting path.
4. `submit-payment-proof` flips the invoice to `pending_review` and sets
   `restaurants.grace_period_ends_at = now() + 2 days`. The modal picks this up
   (`status` becomes `'grace'`) and stops blocking — normal app access resumes.
5. Super admin opens `PendingApprovalsPanel.vue`, sees the restaurant name,
   amount, and the uploaded proof image (via a signed URL), and either:
   - **Approves** → `approve-invoice` sets `plan_expires_at` to
     `period_end + 30 days`, invoice → `paid`, clears `grace_period_ends_at`.
   - **Rejects** (with a reason) → `reject-invoice` sets invoice → `rejected`,
     clears `grace_period_ends_at` immediately (blocked again). The modal
     shows the rejection reason and lets them upload a new proof against the
     same invoice (status `rejected` is accepted by `submit-payment-proof`).

`plan_expires_at` only ever reflects a **confirmed** paid period.
`grace_period_ends_at` is the *temporary, unconfirmed* allowance. Access =
`now() < plan_expires_at OR now() < grace_period_ends_at`.

---

## Step 1 — SQL migration

```bash
psql < sql/003_khqr_proof_flow.sql
```

Adds:
- `subscription_invoices.status` now allows `pending_review` and `rejected`
  in addition to `pending` / `paid` / `void`.
- `subscription_invoices.proof_url`, `submitted_at`, `rejected_reason`, `rejected_at`.
- `restaurants.grace_period_ends_at`.
- A narrow RLS policy letting a restaurant admin move their own invoice from
  `pending`/`rejected` → `pending_review` (defense-in-depth; the edge function
  does this with the service role, so this mostly matters if the client ever
  updates the table directly).

**Manual step not covered by SQL:** create the storage bucket itself —
```bash
supabase storage create payment-proofs --no-public
```
then the RLS policies in `003_khqr_proof_flow.sql` (on `storage.objects`) apply
to it automatically.

---

## Step 2 — Deploy edge functions

```bash
supabase functions deploy generate-khqr-invoice   # redeploy — updated for self-service
supabase functions deploy submit-payment-proof
supabase functions deploy approve-invoice
supabase functions deploy reject-invoice
```

If `mark-invoice-paid` is still deployed from the first pass, you can leave it
or remove it — nothing calls it anymore.

**Note on `generate-khqr-invoice`:** it now dedupes — if a restaurant already
has an open invoice (`pending` or `pending_review`), it returns that one
instead of creating a duplicate. Matters both for the self-service modal
(re-mounts shouldn't spam new invoices) and manual super-admin generation.

---

## Step 3 — Frontend wiring

1. **`AppLayout.vue`** — mount `SubscriptionGateModal.vue` once, globally:
   ```vue
   <template>
     <div class="app-layout">
       <SubscriptionGateModal />
       <!-- existing sidebar/topbar/RouterView -->
     </div>
   </template>
   ```
   It renders nothing unless billing status is `'blocked'`, so it's safe to
   always mount it — no per-route wiring needed. It reads `auth.restaurant`
   from the auth store, so make sure that store's restaurant fetch includes
   `plan_expires_at` and `grace_period_ends_at` (add the columns if the
   `select()` isn't already `select('*')`).

2. **Auth store** — needs a `refreshRestaurant()` method (or equivalent) that
   re-fetches the restaurant row after proof submission, so the modal's
   computed `status` flips from `'blocked'` to `'grace'` without a full reload.
   `SubscriptionGateModal.vue` calls `auth.refreshRestaurant?.()` — wire that
   name up to whatever the store actually calls this, or add it if missing.

3. **Router guard** (`src/router/index.js`) — see `router-guard-changes.js` for
   the exact before/after. Short version: keep the trial-expiry hard redirect
   as-is; **remove** the subscription-expiry hard redirect and let the modal
   handle it instead.

4. **Super Admin Subscriptions view** — add `PendingApprovalsPanel.vue` as the
   primary review surface (shows the proof image before approving — much
   better than a blind "Mark as Paid" button). `RestaurantInvoicePanel.vue`
   still works for manually generating/approving an invoice per restaurant,
   just note its approve button now requires `pending_review` status.

5. **Grace banner (optional but recommended):** somewhere non-blocking in
   `AppLayout.vue` (e.g. a top banner), show a small notice when
   `computeBillingStatus() === 'grace'`: "Payment under review — access until
   `{grace_period_ends_at}`." Not built yet as a component; straightforward to
   add using the same `useBillingStatus.js` composable.

6. Restaurant-side `Settings.vue` billing tab: still worth keeping a read-only
   view of their own `subscription_invoices` history (RLS already allows
   `SELECT` on their own rows) so they can see past payments and current
   status without needing the modal.

---

## Step 4 — Test the full loop

1. Force `plan_expires_at` into the past for a test restaurant:
   `update restaurants set plan_expires_at = now() - interval '1 day' where id = '...'`.
2. Reload the app → modal should appear, blocking, with a generated KHQR.
3. Upload any test image as proof → submit → modal should show the
   "pending_review" notice and then close (grace active), app usable again.
4. Confirm `restaurants.grace_period_ends_at` is ~2 days out.
5. As super admin, open `PendingApprovalsPanel.vue` → see the restaurant, the
   proof image → **Approve** → confirm `plan_expires_at` jumps to
   `period_end + 30 days`, `grace_period_ends_at` cleared, invoice `paid`.
6. Repeat but **Reject** this time with a reason → confirm
   `grace_period_ends_at` clears immediately (app re-blocks on next guard
   check/reload), invoice status `rejected`, and re-uploading a new proof
   against the same invoice works (moves back to `pending_review`).

---

## Open questions to confirm with Seth before/while building

- **Grace length**: hardcoded to 2 days in `submit-payment-proof/index.ts`
  (`GRACE_DAYS = 2`) — confirm calendar days vs business days (currently
  calendar).
- **Resubmission limit**: currently unlimited — a restaurant can keep
  submitting new proofs against a rejected invoice indefinitely. Consider
  capping attempts or requiring a fresh invoice after N rejections.
- **What happens right when grace expires** with no admin action: currently
  falls back to `'blocked'` automatically since `computeBillingStatus()`
  re-evaluates on every check — no extra code needed, but confirm this silent
  re-block is desired vs. a warning beforehand.
- **`order_volume` calculation** (still unresolved from the first pass): does
  `discount_amount` reduce billable volume? Do rejected/cancelled-after-accepted
  orders count? Adjust the query in `generate-khqr-invoice/index.ts`.

## Not in scope for this pass

- Automated Bakong payment verification via `checkTransactionByMD5` (still
  fully manual proof review).
- Push/email notification to super admin when a new proof lands in the queue.
- Recurring/scheduled invoice generation ahead of expiry (currently only
  generated on-demand, either by the blocking modal or manually).
