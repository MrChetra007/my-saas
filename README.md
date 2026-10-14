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
- **Flat + transaction-fee pricing** — low fixed cost tied to order volume.

---

## Features

### Guest ordering (public, no account)

- Scan QR → menu, cart and checkout in the browser
- Live order status tracking (received → preparing → ready) with sound
- Auto time-window discounts and promo codes
- Special instructions and beverage customisations

### Admin panel (`/app/*`)

- **Dashboard** — KPI cards, live orders, top items, revenue trend
- **Menu** — categories, items, images, availability / sold-out toggle
- **Tables** — add/rename tables, QR generation, single + bulk print, QR card designer
- **Orders** — live management by status, sound alerts, receipt download (PNG/PDF)
- **Kitchen** — accept / reject (with reason) / mark ready, elapsed timers
- **Order History** — searchable and filterable past orders
- **Staff** — team members with roles, enforced against plan limits
- **Analytics** _(Pro)_ — revenue, order volume, top items, peak hours
- **Promotions** _(Pro)_ — percentage or fixed discounts, auto or code-based
- **Settings** — profile, logo, slug, currency/timezone, subscription & billing

### Staff apps

| Area    | Route        | Capabilities              |
| ------- | ------------ | ------------------------- |
| Waiter  | `/waiter/*`  | New order, tables, orders |
| Cashier | `/cashier/*` | Orders, order history     |
| Kitchen | `/kitchen/*` | Kitchen display board     |

### Super Admin (`/super-admin/*`)

- Platform dashboard with **Total MRR**, subscription breakdown and expiring-soon list
- Restaurants — view, manage billing, impersonate
- Users — deactivate, password reset
- Subscriptions — edit plan & expiry, mark expired
- Settings — pricing config, app config, invoice generation, pending payment approvals

---

## User Roles

| Role        | Area             | Capabilities                           |
| ----------- | ---------------- | -------------------------------------- |
| Admin       | `/app/*`         | Full restaurant management             |
| Waiter      | `/waiter/*`      | Create orders, manage tables           |
| Cashier     | `/cashier/*`     | Process payments, view order history   |
| Kitchen     | `/kitchen/*`     | View incoming orders, update status    |
| Super Admin | `/super-admin/*` | Manage all restaurants, users, billing |

---

## Pricing & Plans

Subscription pricing lives in the database (`public.plans` and `platform_settings.app_config`) and
is configurable from **Super Admin → Settings** without a redeploy. The seeded defaults are:

| Plan    | Monthly base | Transaction fee       | Tables    | Staff | Notes                       |
| ------- | ------------ | --------------------- | --------- | ----- | --------------------------- |
| Trial   | Free         | —                     | 15        | 3     | 14 days                     |
| Starter | $10 / mo     | 2.00% of order volume | 15        | 3     |                             |
| Pro     | $20 / mo     | 1.00% of order volume | Unlimited | 10    | Analytics + Promotions, KDS |

> Billing is a **flat base fee + a percentage of the restaurant's order volume** for the period.
> Amounts are always computed server-side when generating the invoice.

## Billing Architecture

Three flows exist; **KHQR.dev is the primary/local flow**, manual proof is the fallback, and
LemonSqueezy is legacy.

1. **KHQR.dev (primary)** — `khqr-payment` creates the QR + invoice, `khqr-webhook` verifies the
   HMAC-SHA256 signature and activates the subscription. QR expires in 10 minutes; the client polls
   invoice status.
2. **Manual proof** — `generate-khqr-invoice`, `submit-payment-proof`, `approve-invoice`,
   `reject-invoice`, `mark-invoice-paid`. Super Admin reviews payment screenshots.
3. **LemonSqueezy (legacy)** — `create-checkout-session`, `create-portal-session`,
   `lemonsqueezy-webhook`. Retained for compatibility, not the primary flow.

---

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Pinia, Vue Router 5, Tailwind CSS v4
- **Backend:** Supabase — Auth, Postgres, Realtime, Storage, Edge Functions
- **Payments:** Bakong KHQR via KHQR.dev (primary), manual proof flow, LemonSqueezy (legacy)
- **UI utilities:** Chart.js, `qrcode`
- **i18n:** vue-i18n — English + Khmer
- **PWA:** `vite-plugin-pwa` (installable, offline-capable)
- **Tooling:** Vite, Vitest + Vue Test Utils, ESLint + Oxlint, Prettier

## Project Structure

```
src/
  views/
    public/        Landing, order flow, legal
    auth/          Login, signup, password reset, onboarding
    app/           Admin panel (dashboard, menu, tables, orders, ...)
    waiter/        Waiter app
    cashier/       Cashier app
    kitchen/       Kitchen display
    super-admin/   Platform console
  layouts/         AppLayout, KitchenLayout, CashierLayout, WaiterLayout, SuperAdminLayout
  components/      Shared UI (QrCardModal, modals, panels, ...)
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
