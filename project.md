# QRserve — Restaurant Management SaaS

> A multi-tenant restaurant management platform with QR code ordering, kitchen display, staff dashboards, promotions engine, and analytics.
> Built by **Seth Sochetra**.

---

## Tech Stack

| Layer              | Technology                                                         |
| ------------------ | ------------------------------------------------------------------ |
| **Frontend**       | Vue 3 (Composition API, `<script setup>`)                          |
| **Routing**        | Vue Router 5 (`createWebHistory`)                                  |
| **State**          | Pinia 3                                                            |
| **Styling**        | Tailwind CSS v4 (CSS-native `@theme` tokens, dark theme)           |
| **Icons**          | lucide-vue-next (Lucide)                                           |
| **i18n**           | vue-i18n 9 (English & Khmer)                                       |
| **Charts**         | Chart.js 4 (line, bar, doughnut)                                   |
| **QR Codes**       | qrcode (npm)                                                       |
| **Backend**        | Supabase (Auth, Postgres, Realtime, Edge Functions)                |
| **Payments**       | LemonSqueezy (checkout, portal, webhooks)                          |
| **Email**          | EmailJS (landing page contact form)                                |
| **Build**          | Vite 7                                                             |
| **Testing**        | Vitest 4 + jsdom + Vue Test Utils                                  |
| **Lint / Format**  | ESLint 9 + oxlint 1.47 + Prettier 3.8                              |

---

## Directory Structure

```
restaurant-saas/
├── src/
│   ├── main.js                        # App bootstrap (Pinia + Router + i18n)
│   ├── App.vue                        # Root: auth init + <RouterView>
│   ├── assets/
│   │   ├── images/profile.jpg
│   │   └── main.css                   # Tailwind v4 @theme tokens (dark theme)
│   ├── lib/
│   │   └── supabase.js                # Supabase client (PKCE flow)
│   ├── router/
│   │   └── index.js                   # All routes + navigation guard
│   ├── stores/
│   │   ├── auth.js                    # Auth state (user, profile, role, timezone, currency)
│   │   └── restaurant.js              # Placeholder store
│   ├── i18n/
│   │   ├── index.js                   # vue-i18n setup + locale persistence
│   │   └── locales/en.json, kh.json
│   ├── layouts/
│   │   ├── AppLayout.vue              # Admin sidebar + topbar
│   │   ├── AuthLayout.vue             # Auth pages wrapper
│   │   ├── WaiterLayout.vue           # Waiter sidebar + bottom mobile nav
│   │   ├── CashierLayout.vue          # Cashier sidebar + bottom mobile nav
│   │   ├── KitchenLayout.vue          # Minimal header + clock
│   │   ├── SuperAdminLayout.vue       # Light-themed SA sidebar + topbar
│   │   └── PublicLayout.vue           # Empty (unused)
│   ├── components/
│   │   ├── ProPlanPicker.vue          # Pro upgrade modal (feature gate)
│   │   ├── PlanPickerModal.vue        # Plan selection modal
│   │   └── SuccessModal.vue           # Animated success modal
│   └── views/
│       ├── public/                    # Landing, Order, TrialWall, Legal pages
│       ├── auth/                      # Login, Signup, ResetPassword
│       ├── onboarding/                # 3-step onboarding wizard
│       ├── app/                       # Admin: Dashboard, Menu, Tables, Orders,
│       │                               # Kitchen, OrderHistory, Analytics,
│       │                               # Staff, Promotions, Settings
│       ├── super-admin/               # SA: Dashboard, Restaurants, Users,
│       │                               # Subscriptions, Settings
│       ├── waiter/                    # NewOrder, Tables, Orders
│       ├── cashier/                   # Orders, History
│       └── kitchen/                   # KitchenOrders
├── supabase/functions/                # Edge Functions
│   ├── create-checkout-session/       # LemonSqueezy checkout URL
│   ├── create-portal-session/         # LemonSqueezy customer portal
│   ├── create-staff-user/             # Staff invitation
│   ├── delete-staff-user/             # Staff removal
│   └── lemonsqueezy-webhook/          # Subscription lifecycle
├── schema.sql                         # Database schema reference
├── vercel.json                        # SPA rewrites
├── vite.config.js
└── vitest.config.js
```

---

## Routing & Access Control

| Route              | Layout          | Auth             | Roles                |
| ------------------ | --------------- | ---------------- | -------------------- |
| `/`                | —               | Public           | Anyone               |
| `/order/:slug/:tableId` | —          | Public           | Customers            |
| `/login` etc.      | `AuthLayout`    | Public           | Anyone               |
| `/onboarding`      | —               | Auth required    | admin                |
| `/trial-expired`   | —               | Auth required    | admin                |
| `/app/*`           | `AppLayout`     | Auth required    | admin                |
| `/waiter/*`        | `WaiterLayout`  | Auth required    | waiter               |
| `/cashier/*`       | `CashierLayout` | Auth required    | cashier              |
| `/kitchen/*`       | `KitchenLayout` | Auth required    | kitchen              |
| `/super-admin/*`   | `SuperAdminLayout` | Auth required | super_admin          |

**Navigation guard** (`router.beforeEach`) enforces:
1. PKCE auth code forwarding to reset-password
2. Session check → redirect to `/login`
3. Super Admin isolation
4. Role-based path blocking
5. Onboarding completion gate
6. Trial/subscription expiry gate
7. Dual billing (LemonSqueezy webhook-managed OR manual SA-set expiry)

---

## Data Flow

```
User Action (click, submit)
    ↓
Vue Component
    ↓
Pinia Store or direct Supabase query
    ↓
Supabase Client (src/lib/supabase.js)
    ↓
Supabase Backend (Postgres / Auth / Edge Functions)
    ↓
Response → reactive state update → DOM re-render
    ↓
Real-time: Supabase Realtime channels push updates → components react
```

---

## Key Features

### Multi-Tenancy
Every table has `restaurant_id`. All queries are scoped via the authenticated user's profile.

### Authentication Flow
1. **Signup** → `supabase.auth.signUp()` + RPC `create_restaurant_and_profile` → redirect to onboarding
2. **Login** → `signInWithPassword()` → fetch profile → role-based redirect
3. **Session** → PKCE flow, persisted, auto-refreshed
4. **Password reset** → PKCE code exchange → `updateUser({ password })`

### Customer Ordering (`/order/:slug/:tableId`)
- Public menu browsing + cart system
- Real-time item availability via Realtime
- Promotions engine: auto discounts (with countdown) + code-based discounts (RPC-validated)
- Order placement → subscription to real-time status updates + audio chimes

### Admin Panel (`/app/*`)
- **Dashboard**: KPI cards, live orders, top items chart, revenue trend
- **Menu**: Category sidebar + item grid with CRUD, image upload, availability toggle
- **Tables**: QR code generation, download individual/bulk print, plan limits
- **Orders**: Live management with status tabs, real-time updates
- **Kitchen**: Accept/reject/ready actions, elapsed timers, audio alerts
- **Analytics**: Date-range charts (revenue, status breakdown, peak hours, top items)
- **Staff**: CRUD via Edge Functions, role selection, plan limits
- **Promotions**: Auto + code-based, percentage/fixed, usage tracking
- **Settings**: Profile, region, billing (LemonSqueezy / manual), data export, delete

### Real-Time Everywhere
- Supabase Realtime channels for orders, menu availability, order count badges
- Audio chimes for new kitchen orders and customer order tracking
- Connection status indicator in kitchen display

### Feature Gating (Pro Plan)
- Analytics & Promotions locked behind Pro plan with Crown icon + upgrade modal
- Tables: 15 max (Starter) vs unlimited (Pro)
- Staff: 3 max (Starter) vs 10 (Pro)

### Billing (Dual Mode)
- **LemonSqueezy**: Automatic via webhooks (trial → starter/pro → expired)
- **Manual**: Super admin sets plan + expiry directly

### i18n
- English + Khmer with locale persistence in localStorage + user profile

---

## Database Schema (Key Tables)

| Table              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `restaurants`      | Multi-tenant root entity                         |
| `users`            | Linked to `auth.users`, has role + restaurant_id |
| `menu_categories`  | Scoped to restaurant                             |
| `menu_items`       | Scoped to restaurant + category                  |
| `tables`           | Scoped to restaurant, has QR code URL            |
| `orders`           | Linked to restaurant + table + user + promotion  |
| `order_items`      | Linked to order + menu_item                      |
| `promotions`       | Scoped to restaurant, auto or code-based         |

---

## Supabase Edge Functions

| Function                  | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `create-checkout-session` | Generates LemonSqueezy checkout URL           |
| `create-portal-session`   | Generates LemonSqueezy customer portal URL    |
| `create-staff-user`       | Creates staff account + temp password         |
| `delete-staff-user`       | Removes staff user                            |
| `lemonsqueezy-webhook`    | Handles subscription lifecycle events         |

---

## Code Conventions

- **Vue**: Composition API with `<script setup>`, no comments in production code
- **Imports**: Use `@/` alias for `src/`
- **Styling**: Tailwind utility classes, custom tokens in `main.css` via `@theme`
- **State**: Pinia stores for shared state; local state in components
- **i18n**: `$t('key')` in templates, `t()` in `<script setup>`
- **Real-time**: Supabase Realtime channels cleaned up in `onUnmounted`
- **Plan limits**: Enforced at UI level + via RPCs where applicable
