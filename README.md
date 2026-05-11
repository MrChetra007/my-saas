# Restaurant SaaS

A multi-tenant restaurant management platform built with **Vue 3**, **Pinia**, **Vue Router**, **Tailwind CSS v4**, and **Supabase**.

## Features

- **Menu Management** — Categories, items with prices, images, and availability toggles
- **Order Management** — Create, track, and fulfill orders with real-time status updates
- **Table Management** — Manage tables with QR code generation for customer self-ordering
- **Promotions Engine** — Percentage and fixed discounts, auto-apply or code-based
- **Staff Management** — Role-based access control (admin, waiter, cashier, kitchen)
- **Multi-Language** — English and Khmer (vue-i18n)
- **Analytics** — Dashboard with Chart.js insights
- **Billing & Subscriptions** — LemonSqueezy integration with trial, starter, and pro plans

## User Roles

| Role        | Area                | Capabilities                              |
|-------------|---------------------|-------------------------------------------|
| Admin       | `/app/*`            | Full restaurant management                |
| Waiter      | `/waiter/*`         | Create orders, manage tables              |
| Cashier     | `/cashier/*`        | Process payments, view order history      |
| Kitchen     | `/kitchen/*`        | View incoming orders and update status    |
| Super Admin | `/super-admin/*`    | Manage all restaurants, users, plans      |

## Tech Stack

- **Frontend**: Vue 3 (Composition API), Pinia, Vue Router 5, Tailwind CSS v4
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Payments**: LemonSqueezy (checkout, webhooks, subscription management)
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint + Oxlint
- **Formatting**: Prettier

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
