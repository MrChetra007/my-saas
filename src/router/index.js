import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

// ── Role Home Helper ─────────────────────────────────
export function roleHome(role) {
  switch (role) {
    case 'kitchen':
      return '/kitchen'
    case 'cashier':
      return '/cashier'
    case 'waiter':
      return '/waiter'
    default:
      return '/app/dashboard' // admin
  }
}

const routes = [
  // ── Public ──────────────────────────────────────
  { path: '/', component: () => import('@/views/public/LandingView.vue'), meta: { public: true } },
  {
    path: '/terms',
    component: () => import('@/views/public/Terms.vue'),
    meta: { public: true },
  },
  {
    path: '/privacy',
    component: () => import('@/views/public/Privacypolicy.vue'),
    meta: { public: true },
  },
  //for customers to place orders without logging in
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
  }, // ← add this

  // ── Onboarding (admin only) ──────────────────────
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

  // ── Admin (everything stays the same) ───────────
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
      { path: 'new-order', component: () => import('@/views/waiter/WaiterNewOrderView.vue') },
      { path: 'tables', component: () => import('@/views/waiter/WaiterTablesView.vue') },
      { path: 'orders', component: () => import('@/views/waiter/WaiterOrdersView.vue') },
    ],
  },

  // ── Fallback ─────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

function isTrialExpired(plan, trialEndsAt) {
  if (['pro', 'starter', 'pro'].includes(plan)) return false
  if (plan === 'expired') return true
  if (!trialEndsAt) return true
  return new Date(trialEndsAt) < new Date() // to > for testing, change to < for production
}

router.beforeEach(async (to) => {
  // If a Supabase ?code= lands on the wrong route, forward it to reset-password
  if (to.query.code && to.path !== '/reset-password') {
    return { path: '/reset-password', query: { code: to.query.code } }
  }

  if (to.meta.public) return true

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return '/login'

  const authStore = useAuthStore()
  if (!authStore.profile) await authStore.fetchProfile()
  if (!authStore.profile) return to.name !== 'onboarding' ? '/onboarding' : true

  const role = authStore.profile.role

  // Block wrong roles from wrong paths
  if (to.meta.roles && !to.meta.roles.includes(role)) return roleHome(role)

  // Onboarding + trial checks only apply to admin
  if (role === 'admin') {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('onboarding_completed, plan, trial_ends_at')
      .eq('id', authStore.profile.restaurant_id)
      .single()

    const onboarded = restaurant?.onboarding_completed === true
    if (!onboarded && to.name !== 'onboarding') return '/onboarding'
    if (onboarded && to.name === 'onboarding') return '/app/dashboard'

    const skipTrialCheck = to.name === 'trial-expired' || to.path === '/app/settings'
    if (!skipTrialCheck && to.path.startsWith('/app')) {
      if (isTrialExpired(restaurant?.plan, restaurant?.trial_ends_at)) return '/trial-expired'
    }
    if (to.name === 'trial-expired') {
      if (!isTrialExpired(restaurant?.plan, restaurant?.trial_ends_at)) return '/app/dashboard'
    }
  }

  return true
})

export default router
