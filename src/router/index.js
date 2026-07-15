import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function roleHome(role) {
  switch (role) {
    case 'kitchen':
      return '/kitchen'
    case 'cashier':
      return '/cashier'
    case 'waiter':
      return '/waiter'
    default:
      return '/app/dashboard'
  }
}

const routes = [
  // ── Public ──────────────────────────────────────
  { path: '/', component: () => import('@/views/public/LandingView.vue'), meta: { public: true } },
  { path: '/terms', component: () => import('@/views/public/Terms.vue'), meta: { public: true } },
  {
    path: '/privacy',
    component: () => import('@/views/public/Privacypolicy.vue'),
    meta: { public: true },
  },
  { path: '/refund', component: () => import('@/views/public/Refund.vue'), meta: { public: true } },
  {
    path: '/order/:slug/:tableId',
    component: () => import('@/views/public/OrderView.vue'),
    meta: { public: true },
  },

  // ── Auth ────────────────────────────────────────
  { path: '/login', component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
  {
    path: '/signup',
    component: () => import('@/views/auth/SignupView.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { public: true },
  },

  // ── Onboarding ──────────────────────────────────
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/onboarding/OnboardingView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },

  // ── Trial Wall ──────────────────────────────────
  {
    path: '/trial-expired',
    name: 'trial-expired',
    component: () => import('@/views/public/TrialWallView.vue'),
    meta: { requiresAuth: true },
  },

  // ── Admin ───────────────────────────────────────
  {
    path: '/app',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    redirect: '/app/dashboard',
    children: [
      { path: 'dashboard', component: () => import('@/views/app/DashboardView.vue') },
      { path: 'menu', component: () => import('@/views/app/MenuView.vue') },
      { path: 'tables', component: () => import('@/views/app/TablesView.vue') },
      { path: 'orders', component: () => import('@/views/app/OrdersView.vue') },
      { path: 'kitchen', component: () => import('@/views/app/KitchenView.vue') },
      {
        path: 'order-history',
        name: 'OrderHistory',
        component: () => import('@/views/app/OrderHistoryView.vue'),
      },
      { path: 'staff', component: () => import('@/views/app/StaffView.vue') },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/app/AnalyticsView.vue'),
      },
      {
        path: 'promotions',
        name: 'Promotions',
        component: () => import('@/views/app/PromotionsView.vue'),
      },
      { path: 'settings', component: () => import('@/views/app/SettingsView.vue') },
    ],
  },

  // ── Super Admin ──────────────────────────────────
  {
    path: '/super-admin',
    component: () => import('@/layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, superAdminOnly: true },
    redirect: '/super-admin/dashboard',
    children: [
      { path: 'dashboard', component: () => import('@/views/super-admin/SuperAdminDashboard.vue') },
      {
        path: 'restaurants',
        component: () => import('@/views/super-admin/SuperAdminRestaurants.vue'),
      },
      { path: 'users', component: () => import('@/views/super-admin/SuperAdminUsers.vue') },
      {
        path: 'subscriptions',
        component: () => import('@/views/super-admin/SuperAdminSubscriptions.vue'),
      },
      { path: 'settings', component: () => import('@/views/super-admin/SuperAdminSettings.vue') },
    ],
  },

  // ── Kitchen ──────────────────────────────────────
  {
    path: '/kitchen',
    component: () => import('@/layouts/KitchenLayout.vue'),
    meta: { requiresAuth: true, roles: ['kitchen'] },
    redirect: '/kitchen/orders',
    children: [
      { path: 'orders', component: () => import('@/views/kitchen/KitchenOrdersView.vue') },
    ],
  },

  // ── Cashier ──────────────────────────────────────
  {
    path: '/cashier',
    component: () => import('@/layouts/CashierLayout.vue'),
    meta: { requiresAuth: true, roles: ['cashier'] },
    redirect: '/cashier/orders',
    children: [
      { path: 'orders', component: () => import('@/views/cashier/CashierOrdersView.vue') },
      { path: 'history', component: () => import('@/views/cashier/CashierHistoryView.vue') },
    ],
  },

  // ── Waiter ───────────────────────────────────────
  {
    path: '/waiter',
    component: () => import('@/layouts/WaiterLayout.vue'),
    meta: { requiresAuth: true, roles: ['waiter'] },
    redirect: '/waiter/new-order',
    children: [
      { path: 'new-order', component: () => import('@/views/waiter/WaiterNewOrderView.vue') },
      { path: 'tables', component: () => import('@/views/waiter/WaiterTablesView.vue') },
      { path: 'orders', component: () => import('@/views/waiter/WaiterOrdersView.vue') },
    ],
  },

  // ── Fallback ─────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

// ---------------------------------------------------------------------------
// isTrialExpired — supports both billing types
//
// LemonSqueezy: webhook keeps `plan` field updated → trust it directly
// Manual:       only redirects for trial expiry; plan expiry is handled by
//               SubscriptionGateModal (grace period flow)
// Trial:        falls back to trial_ends_at for both types on signup
// ---------------------------------------------------------------------------
function isTrialExpired(plan, trialEndsAt, billingType, planExpiresAt, gracePeriodEndsAt) {
  // ── LemonSqueezy: webhook manages everything ──────
  if (billingType === 'lemonsqueezy') {
    if (['pro', 'starter'].includes(plan)) return false
    if (plan === 'expired') return true
  }

  // ── Manual: grace period keeps access alive ────────
  if (billingType === 'manual') {
    if (plan === 'expired') {
      if (gracePeriodEndsAt && new Date(gracePeriodEndsAt) > new Date()) return false
      return true
    }
    if (['pro', 'starter'].includes(plan)) return false
  }

  // ── Trial fallback (new signups, both billing types) ──
  if (!trialEndsAt) return true
  return new Date(trialEndsAt) < new Date()
}

router.beforeEach(async (to) => {
  // Forward Supabase ?code= to reset-password
  if (to.query.code && to.path !== '/reset-password') {
    return { path: '/reset-password', query: { code: to.query.code } }
  }

  if (to.meta.public) return true

  const authStore = useAuthStore()

  // ── Use in-memory session if already loaded ─────────
  if (!authStore.user) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return '/login'
    authStore.user = session.user
  }

  if (!authStore.profile) await authStore.fetchProfile()
  if (!authStore.profile) return to.name !== 'onboarding' ? '/onboarding' : true

  // ── Super Admin: bypass everything ──────────────
  if (authStore.isSuperAdmin) {
    if (!to.path.startsWith('/super-admin')) return '/super-admin/dashboard'
    return true
  }

  // ── Block super-admin routes from normal users ───
  if (to.meta.superAdminOnly) return '/login'

  const role = authStore.profile.role

  // Block wrong roles from wrong paths
  if (to.meta.roles && !to.meta.roles.includes(role)) return roleHome(role)

  // ── Onboarding + trial checks (admin only) ───────
  if (role === 'admin') {
    const restaurant = authStore._restaurant

    // Onboarding gate
    const onboarded = restaurant?.onboarding_completed === true
    if (!onboarded && to.name !== 'onboarding') return '/onboarding'
    if (onboarded && to.name === 'onboarding') return '/app/dashboard'

    // Trial / subscription gate
    const skipTrialCheck = to.name === 'trial-expired' || to.path === '/app/settings'
    if (!skipTrialCheck && to.path.startsWith('/app')) {
      if (
        isTrialExpired(
          restaurant?.plan,
          restaurant?.trial_ends_at,
          restaurant?.billing_type,
          restaurant?.plan_expires_at,
          restaurant?.grace_period_ends_at,
        )
      )
        return '/trial-expired'
    }

    if (to.name === 'trial-expired') {
      if (
        !isTrialExpired(
          restaurant?.plan,
          restaurant?.trial_ends_at,
          restaurant?.billing_type,
          restaurant?.plan_expires_at,
          restaurant?.grace_period_ends_at,
        )
      )
        return '/app/dashboard'
    }
  }

  return true
})

export default router
