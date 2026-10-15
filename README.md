# QRserve

**Your restaurant, fully digital. SCAN · ORDER · DONE.**

QRserve is a multi-tenant, Cambodia-first restaurant management platform. Guests scan a QR code
placed on the table — no app, no account — to browse the menu and place an order. Orders flow in
real time to a kitchen display and cashier, while owners get dashboards, QR-card design, promotions
and analytics.

Built with **Vue 3**, **Pinia**, **Vue Router**, **Tailwind CSS v4** and **Supabase**.

---

## The Problem

Small and mid-size restaurants in Southeast Asia run on paper menus, shouted orders and lost
tickets. Digitising means expensive hardware, app installs for customers, and POS contracts that
don't fit a 10-table shop.

## The Solution

A browser-based, bilingual (English / Khmer) platform where:

- **Guests** scan a table QR and order from their own phone — no download required.
- **Kitchen** sees orders on a live screen with audio alerts and status timers.
- **Waiters / cashiers** get dedicated, role-locked apps for tables, orders and payments.
- **Owners** manage the menu, tables, staff, promotions and analytics in one admin panel.
- **Payments** are settled natively through **Bakong KHQR** (ABA, ACLEDA, Sathapana).

## Target Market

- Independent **dine-in restaurants and cafés** with roughly 5–30 tables, starting in Phnom Penh.
- Coffee / bubble-tea shops (beverage customisation: temperature, size, sugar level, ice).
- **Primary region:** Cambodia — full Khmer localisation and Bakong KHQR billing.
- **Currency:** USD by default, KHR supported (configurable per restaurant).

## Why QRserve

- **Khmer-localised** end to end (guest ordering, kitchen, admin).
- **No app for guests** — works in any mobile browser and as an installable PWA.
- **Bakong KHQR native billing** — low barrier for local merchants.
- **QR card designer** — multiple templates, bilingual header/footer, bulk print 9 cards per A4 sheet.
- **Real-time kitchen display** with audio and connection status.
- **Flat monthly pricing** — low, predictable fixed cost.

---

## Roles at a Glance

| Role            | Area             | Home route              | Purpose                                                   |
| --------------- | ---------------- | ----------------------- | --------------------------------------------------------- |
| Guest           | public           | `/order/:slug/:tableId` | No account needed — browse the menu and place an order.   |
| Admin (Owner)   | `/app/*`         | `/app/dashboard`        | Full restaurant management.                               |
| Waiter          | `/waiter/*`      | `/waiter/new-order`     | Create orders, manage tables, track live orders.          |
| Cashier         | `/cashier/*`     | `/cashier/orders`       | Process payments and review completed orders.             |
| Kitchen         | `/kitchen/*`     | `/kitchen/orders`       | Live kitchen display board; advance order status.         |
| Super Admin     | `/super-admin/*` | `/super-admin/dashboard`| Manage every restaurant, user, subscription and billing.  |

Route access is role-locked: the router redirects any user to their role home, and admins are further
gated by onboarding and trial/subscription state (see [Billing & Plans](#billing--plans)).

---

## 1. Guest Ordering (public, no account)

**Where:** `/` (landing) · `/order/:slug/:tableId` (ordering) · `/terms` · `/privacy` · `/refund`

### Landing page

- Marketing sections: hero, how-it-works, QR-ordering, kitchen-display and analytics features, FAQ,
  and an "About & contact" form (EmailJS).
- **Live pricing** pulled from `platform_settings.app_config`.
- **EN / KH language switcher**, installable-PWA prompt, animated feature counters.

### Browsing & ordering

- Scan-table QR opens the menu for the restaurant `:slug` / table `:tableId`, validated as active.
- Menu grouped by **categories** with an "All" tab; sold-out items are shown but non-interactive.
- **Item detail** with photo, description, price, quantity stepper and special instructions.
- **Beverage customisation options** — **temperature** (hot / iced), **size**
  (small / regular / large), **sugar level** (0 / 25 / 50 / 75 / 100%) and **ice**
  (none / less / normal). Selections are composed into the line note (they do not change price).
- Cart line merging on identical item + note; per-order notes at checkout.
- **Auto time-window discounts** with a live countdown badge/banner, plus **promo-code entry**
  validated server-side via the `validate_promotion` RPC.

### Order status tracking

- After placing an order the guest sees a **live status stepper**: received → preparing → ready,
  with rejected handling.
- Status updates arrive over **Supabase Realtime** and trigger **Web Audio chimes** (accepted /
  ready / rejected) plus toasts.
- Menu **availability changes** stream in real time — a sold-out item is removed from the cart.

### Currency & PWA

- Per-restaurant currency (USD, KHR and others) with sensible symbols.
- Installable PWA (manifest + service worker); Supabase calls are network-only, so ordering needs a
  connection.

> Payment is **not** collected in the guest flow — staff settle payment (see Cashier).

---

## 2. Admin Panel (`/app/*`)

The owner's control centre. Sidebar: **Overview** (Dashboard, Analytics), **Operations** (Orders,
Order History, Kitchen), **Setup** (Menu, Tables, Staff, Promotions) and **Account** (Settings).

### Dashboard

- KPI cards: **Today's Orders**, **Revenue** (paid orders today), **Active Tables**, **Avg Prep Time**.
- **Live orders** feed (pending + cooking) and **top 5 items today** by quantity.
- Quick actions to Menu, Tables and Kitchen. Live clock and realtime refresh.

### Menu

- **Categories**: create, rename, delete.
- **Items**: create, edit, delete with **photo upload**, name, description, price, category and an
  **Available / Sold Out** toggle (quick toggle from the grid).
- Per-category **search** by name or description; sold-out overlay on the grid.
- Images stored in the `menu-images` bucket (2 MB client cap).

### Tables & QR

- **Add / rename / delete** tables and toggle each table **active / inactive** (whether it accepts
  QR orders). Plan-based table limit with upgrade prompt.
- **QR generation** for the public URL `/order/{slug}/{tableId}`; enlarge, **download PNG**, and
  switch to card design.
- **Bulk print** — 3×3 grid of **9 QR cards per A4 portrait page**.
- **QR card designer** (`QrCardModal`): multiple image **templates**, **bilingual header**
  (English / ខ្មែរ), editable **headline**, **table label** and **footer** text, with a live canvas
  preview and download.

### Orders

- Realtime order list with **status tabs** (All / Pending / Cooking / Ready / Paid) and counts.
- **Sound alerts** for newly-ready orders (Web Audio "cash register" chime) and toast notifications.
- **New order** modal (select table + build a cart) for admin/waiter.
- **Receipt modal** with **Download PNG** (canvas) and **Download PDF** (print-to-PDF); confirming
  payment marks the order paid.
- Status actions: **Mark as Paid**; waiters can **Cancel** a pending order.

### Kitchen (admin view)

- Tabs for **Pending / Cooking / Done** with elapsed timers that turn red and pulse after **15 min**.
- **Accept** (→ cooking), **Reject** (→ rejected, with reason chips + custom text) and **Mark Ready**.
- New-order audio **ding**, highlight glow, and realtime updates.

### Order History

- Lists **paid and rejected** orders with collapsible detail rows.
- Filters: **table name**, **item name**, **date range** (date picker) and **status** (all / paid /
  rejected).

### Staff _(plan-limited)_

- **Team members** list with role badges and active status; seat counter against the plan limit.
- **Add staff** with role (kitchen / cashier / waiter), password strength meter and created
  credentials display; **edit**, **activate/deactivate**, and **remove**.
- Accounts are provisioned through the `create-staff-user` / `delete-staff-user` edge functions.

### Analytics _(Pro)_

- Range selector **7 / 30 / 90 days**.
- KPIs: Total Revenue, Total Orders, Paid Orders, Avg Order Value.
- **Charts** (Chart.js): revenue over time (line), orders by status (doughnut), daily order volume
  (bar), **peak hours** (bar), plus a **top selling items** list.

### Promotions _(Pro)_

- **Percentage** or **fixed** discounts, either **code-based** or **auto** (time-window) promotions.
- Start/end time, **usage limit** with progress, active toggle, copy-code and code generator.

### Settings

- **Restaurant profile**: name, address, **logo upload**, and **URL slug** (with a slug-change
  confirmation that warns about QR reprints).
- **Regional**: language (EN / KH), **currency** (8 common + custom), **timezone**.
- **Subscription & billing**: current plan card, trial countdown, invoice history, upgrade guidance.
- **Install app** (PWA) section and explicit **Save / Discard** with dirty-state tracking.

---

## 3. Waiter App (`/waiter/*`)

Role-locked, mobile-first layout (sidebar on desktop, bottom tab bar on mobile) with a live active
order-count badge.

### New Order (`/waiter/new-order`)

- **Select a table** (inactive tables disabled), then browse menu categories and items.
- Quantity steppers, per-item **special instructions** (max 120 chars) and a floating cart.
- **Auto promotion** banner plus **promo-code** entry (validated via RPC).
- Submit creates the `orders` row (status `pending`) and its `order_items`, and increments the
  promotion's usage.

### Tables (`/waiter/tables`)

- View all tables with live **status**: **Available** or **Occupied** (occupied = the table has at
  least one active order in `pending`, `cooking` or `ready`), plus available/occupied counts.
- **Toggle active/inactive** per table (whether the table accepts QR ordering).

### My Orders (`/waiter/orders`)

- Today's live orders (excluding paid/rejected) with status badge and **progress bar**
  (pending → cooking → ready → delivered), realtime updates and **notification chimes** (mute toggle
  persisted). Waiters can mark an order **Delivered** once served.
- Read-only status tracking except the Delivered action.
- **Connection status**: if the browser or realtime channel drops, a red **"Offline — showing last
  known orders"** banner appears until the connection is restored.

---

## 4. Cashier App (`/cashier/*`)

Role-locked layout with a live pending-order badge.

### Orders (`/cashier/orders`)

- Lists **ready** orders, **grouped by table** (multiple orders on one table merge into one card).
- **Today's revenue** card.
- **Receipt modal** with **Download PNG** and **Download PDF** (print). **Confirm Paid** marks every
  order in the group paid.
- Newly-ready orders trigger a **cash-register sound** and toast.
- **Connection status**: if the browser or realtime channel drops, a red **"Offline — showing last
  known orders"** banner appears until the connection is restored.

### History (`/cashier/history`)

- Today's **paid** orders with item detail, plus a **summary card** (orders, items sold, total
  revenue). Read-only.

---

## 5. Kitchen Display (`/kitchen/*`)

A single always-on board (`/kitchen/orders`) with the restaurant name and a live timezone clock.

- **Tabs**: Pending / Cooking / Done, with urgent pulsing count on Pending.
- **Ticket cards**: table, order number (last 4), elapsed timer, item quantities and notes. Timers
  **turn red and pulse after 15 minutes**.
- **Actions**: Pending → **Accept** (cooking) or **Reject** (rejected); Cooking → **Mark Ready**;
  Ready shows "Ready for pickup".
- **New-order ping** (Web Audio) with mute toggle, force-focus on Pending, and realtime inserts.
- **Connection status**: if the browser or realtime channel drops, a red **"Offline — showing last
  known orders"** banner appears until the connection is restored.

---

## 6. Super Admin Console (`/super-admin/*`)

Platform-wide administration for QRserve staff.

### Dashboard (`/super-admin/dashboard`)

- KPIs: **Total Restaurants**, **Total Users**, **Active Subscriptions**, **Total MRR**.
- **Subscription breakdown** (Manual / Trial / Expired) as proportion bars.
- **Expiring soon** list (manual subscriptions within 14 days) and **recently upgraded** restaurants.

### Restaurants (`/super-admin/restaurants`)

- Search by name/slug with **plan** and **billing** filters.
- **View details** (owner email, plan, billing, LS ids, currency, timezone, dates).
- **Manage billing**: change plan, billing type and expiry (with +30d / +90d / +1y quick-sets).
- **Impersonate** — opens the restaurant's public ordering page in a new tab for a preview.

### Users (`/super-admin/users`)

- Search by name/email; filter by **role** and **restaurant**.
- **View details**, **deactivate/reactivate**, and **send password-reset** email.

### Subscriptions (`/super-admin/subscriptions`)

- Filters: search, plan, billing type and derived **status** (active / trial / expiring / expired).
- **Edit plan & expiry**, **mark expired**, and per-restaurant **invoice panel** (generate invoice,
  list invoices, view proof, mark paid).
- **Pending payment approvals** queue with proof preview (lightbox), **Approve** and **Reject**
  (with reason).

### Settings (`/super-admin/settings`)

- Super-admin **profile** and **password**.
- **Pricing config**: flat monthly fees for Starter ($15) and Pro ($25).
- **App settings**: trial days and expiry-warning days.
- **Platform / KHQR card**: Bakong merchant config (account id, merchant name/city), KHQR.dev
  webhook URL (copy), and **support contacts** (phone / Facebook / Telegram) shown to merchants.

---

## Billing & Plans

Two billing flows exist; **KHQR.dev is the primary/local flow** and manual proof is the fallback.

1. **KHQR.dev (primary)** — `khqr-payment` creates the QR + invoice; `khqr-webhook` verifies the
   HMAC-SHA256 signature and activates the subscription. QR expires in 10 minutes; the client polls
   invoice status. Used by the trial wall, the Pro upgrade picker and the subscription gate modal.
2. **Manual proof** — `generate-khqr-invoice`, `submit-payment-proof`, `approve-invoice`,
   `reject-invoice`, `mark-invoice-paid`. Super Admin reviews payment screenshots; a 2-day grace
   period starts on submission.

### Pricing

Subscription pricing lives in the database (`public.plans` and `platform_settings.app_config`) and
is configurable from **Super Admin → Settings** without a redeploy. The seeded defaults are flat
monthly fees — no transaction fees:

| Plan    | Monthly fee | Tables    | Staff | Notes                       |
| ------- | ----------- | --------- | ----- | --------------------------- |
| Trial   | Free        | 15        | 3     | 14 days                     |
| Starter | $15 / mo    | 15        | 3     |                             |
| Pro     | $25 / mo    | Unlimited | 10    | Analytics + Promotions, KDS |

> Billing is a **flat monthly fee**. Amounts are always computed server-side when generating the
> invoice.

Plan limits are enforced in-app: **tables** (Trial/Starter 15, Pro unlimited) and **staff seats**
(Trial/Starter 3, Pro 10). **Analytics** and **Promotions** are Pro features.

---

## Authentication & Onboarding

- **Login** — email + password with show/hide toggle, forgot-password flow, and role-based redirect
  on success.
- **Signup** — full name, restaurant name (with live slug preview), email and password (strength
  meter). Creates the restaurant + admin profile via the `create_restaurant_and_profile` RPC and
  starts a **14-day trial**.
- **Password reset** — Supabase recovery link handled at `/reset-password` (the router forwards any
  `?code=` to this route).
- **Onboarding** (3 steps, admin only): restaurant profile (logo, name, address, currency,
  timezone) → first category + menu item (with photo) → first table + downloadable QR. Completing it
  sets `onboarding_completed`.
- **Gating** — admins are redirected to onboarding until it's complete, and to the trial wall when
  their trial/subscription has expired (except `/app/settings`).

---

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Pinia, Vue Router 5, Tailwind CSS v4
- **Backend:** Supabase — Auth, Postgres, Realtime, Storage, Edge Functions
- **Payments:** Bakong KHQR via KHQR.dev (primary), manual proof flow
- **UI utilities:** Chart.js, `qrcode`
- **i18n:** vue-i18n — English + Khmer
- **PWA:** `vite-plugin-pwa` (installable, offline-capable)
- **Tooling:** Vite, Vitest + Vue Test Utils, ESLint + Oxlint, Prettier

## Project Structure

```
src/
  views/
    public/        Landing, order flow, legal
    auth/          Login, signup, password reset
    onboarding/    First-run setup wizard
    app/           Admin panel (dashboard, menu, tables, orders, ...)
    waiter/        Waiter app
    cashier/       Cashier app
    kitchen/       Kitchen display
    super-admin/   Platform console
  layouts/         AppLayout, KitchenLayout, CashierLayout, WaiterLayout, SuperAdminLayout
  components/      Shared UI (QrCardModal, ProPlanPicker, SubscriptionGateModal, ...)
  stores/          Pinia stores (auth, ...)
  lib/             Supabase client, QR card renderer, helpers
  i18n/            Locale files (en.json, kh.json)
supabase/functions/  Edge functions (billing, payments, staff)
*.sql                Database schema and migrations
```

---

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests

```sh
npm run test:unit
```

### Lint & Format

```sh
npm run lint
npm run format
```
