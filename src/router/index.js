import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ── Public ──────────────────────────────
  {
    path: '/',
    component: () => import('@/views/public/LandingView.vue'),
    meta: { public: true },
  },
  {
    path: '/order/:slug/:tableId',
    component: () => import('@/views/public/OrderView.vue'),
    meta: { public: true },
  },

  // ── Auth ────────────────────────────────
  {
    path: '/login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/signup',
    component: () => import('@/views/auth/SignupView.vue'),
    meta: { public: true },
  },

  // ── Onboarding ──────────────────────────
  {
    // path: '/onboarding',
    // component: () => import('@/views/onboarding/OnboardingView.vue'),
    // meta: { requiresAuth: true },
    path: '/onboarding',
    name: 'onboarding', // ← this name is what the guard checks
    component: () => import('@/views/onboarding/OnboardingView.vue'),
    // no meta.public — user must be logged in to onboard
  },

  // ── App (protected) ─────────────────────
  {
    path: '/app',
    redirect: '/app/dashboard',
  },
  {
    path: '/app/dashboard',
    component: () => import('@/views/app/DashboardView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/app/menu',
    component: () => import('@/views/app/MenuView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/app/tables',
    component: () => import('@/views/app/TablesView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/app/orders',
    component: () => import('@/views/app/OrdersView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'cashier', 'waiter'] },
  },
  {
    path: '/app/kitchen',
    component: () => import('@/views/app/KitchenView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'kitchen'] },
  },
  {
    path: '/app/staff',
    component: () => import('@/views/app/StaffView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/app/settings',
    component: () => import('@/views/app/SettingsView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },

  // ── Fallback ─────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Route Guard ──────────────────────────────
router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return '/login'

  // ── Add this block ──────────────────────────
  const authStore = useAuthStore()

  // Make sure profile is loaded
  if (!authStore.profile) {
    await authStore.fetchProfile()
  }

  // New user — no profile yet, send to onboarding
  if (!authStore.profile && to.name !== 'onboarding') {
    return '/onboarding'
  }

  // Already onboarded, don't let them hit onboarding again
  if (authStore.profile && to.name === 'onboarding') {
    return '/app/dashboard'
  }
  // ────────────────────────────────────────────

  return true
})

export default router
