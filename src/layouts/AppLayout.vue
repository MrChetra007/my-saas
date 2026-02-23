<template>
  <div class="app-shell">
    <!-- ── Sidebar ─────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-mark">
          <img
            v-if="restaurantLogoUrl"
            :src="restaurantLogoUrl"
            alt="Restaurant Logo"
            style="width: 28px; height: 28px; border-radius: 6px; object-fit: cover"
          />
          <svg v-else width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="5" y="5" width="4" height="4" rx="0.5" fill="white" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="23" y="5" width="4" height="4" rx="0.5" fill="white" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="5" y="23" width="4" height="4" rx="0.5" fill="white" />
            <line
              x1="22"
              y1="21"
              x2="22"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="26"
              y1="21"
              x2="26"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="30"
              y1="21"
              x2="30"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M22 21 Q22 25 26 27 Q30 25 30 21"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <span class="logo-text" v-show="!sidebarCollapsed">{{ restaurantName }}</span>
      </div>

      <!-- Restaurant badge -->
      <div class="restaurant-badge" v-show="!sidebarCollapsed">
        <div class="badge-info">
          <span class="badge-plan text-center">{{ planLabel }}</span>
        </div>
      </div>
      <div class="restaurant-badge-mini" v-show="sidebarCollapsed">
        <div class="badge-avatar">{{ restaurantInitial }}</div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label" v-show="!sidebarCollapsed">Overview</div>

        <RouterLink to="/app/dashboard" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><LayoutDashboard :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Dashboard</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Dashboard</span>
        </RouterLink>

        <div
          class="nav-item"
          :class="canAccessAnalytics ? 'nav-unlocked' : 'nav-pro'"
          @click="canAccessAnalytics ? $router.push('/app/analytics') : openProPicker('Analytics')"
        >
          <span class="nav-icon"><Activity :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Analytics</span>
          <Crown
            v-if="!canAccessAnalytics"
            :size="12"
            class="pro-icon"
            v-show="!sidebarCollapsed"
          />
          <span class="nav-tooltip" v-show="sidebarCollapsed">
            {{ canAccessAnalytics ? 'Analytics' : 'Pro Feature' }}
          </span>
        </div>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Operations</div>

        <RouterLink to="/app/orders" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><ClipboardList :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Orders</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Orders</span>
          <span class="nav-badge" v-if="pendingCount > 0" v-show="!sidebarCollapsed">{{
            pendingCount
          }}</span>
          <span class="nav-badge-dot" v-if="pendingCount > 0" v-show="sidebarCollapsed" />
        </RouterLink>

        <RouterLink to="/app/order-history" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><History :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Order History</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Order History</span>
        </RouterLink>

        <RouterLink to="/app/kitchen" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><ChefHat :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Kitchen</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Kitchen</span>
          <!-- cooking count badge — same pattern as Orders -->
          <span
            class="nav-badge nav-badge--cooking"
            v-if="cookingCount > 0"
            v-show="!sidebarCollapsed"
            >{{ cookingCount }}</span
          >
          <span
            class="nav-badge-dot nav-badge-dot--cooking"
            v-if="cookingCount > 0"
            v-show="sidebarCollapsed"
          />
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Setup</div>

        <RouterLink to="/app/menu" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><UtensilsCrossed :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Menu</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Menu</span>
        </RouterLink>

        <RouterLink to="/app/tables" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><Table2 :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Tables & QR</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Tables</span>
        </RouterLink>

        <RouterLink to="/app/staff" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><Users :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Staff</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Staff</span>
        </RouterLink>

        <div
          class="nav-item"
          :class="canAccessPromotions ? 'nav-unlocked' : 'nav-pro'"
          @click="
            canAccessPromotions ? $router.push('/app/promotions') : openProPicker('Promotions')
          "
        >
          <span class="nav-icon"><Tag :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Promotions</span>
          <Crown
            v-if="!canAccessPromotions"
            :size="12"
            class="pro-icon"
            v-show="!sidebarCollapsed"
          />
          <span class="nav-tooltip" v-show="sidebarCollapsed">
            {{ canAccessPromotions ? 'Promotions' : 'Pro Feature' }}
          </span>
        </div>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Account</div>

        <RouterLink to="/app/settings" class="nav-item" active-class="nav-active">
          <span class="nav-icon"><Settings :size="16" /></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Settings</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Settings</span>
        </RouterLink>
      </nav>

      <!-- Collapse toggle -->
      <button
        class="collapse-btn"
        @click="sidebarCollapsed = !sidebarCollapsed"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft v-if="!sidebarCollapsed" :size="14" />
        <ChevronRight v-else :size="14" />
      </button>

      <!-- Sign out -->
      <button class="signout-btn" @click="signOut">
        <LogOut :size="15" />
        <span v-show="!sidebarCollapsed">Sign out</span>
      </button>
    </aside>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" v-if="mobileOpen" @click="mobileOpen = false" />

    <!-- ── Pro Plan Picker Modal ───────────────────── -->
    <ProPlanPicker v-model="showProPicker" :featureName="lockedFeatureName" />

    <!-- ── Main area ───────────────────────────── -->
    <div class="main-area" :class="{ expanded: sidebarCollapsed }">
      <!-- Topbar -->
      <header class="topbar">
        <button class="mobile-menu-btn" @click="mobileOpen = !mobileOpen" aria-label="Open menu">
          <Menu :size="18" />
        </button>
        <div class="topbar-title">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="topbar-right">
          <button class="pending-pill" v-if="pendingCount > 0" @click="$router.push('/app/orders')">
            <span class="pill-dot" />
            {{ pendingCount }} pending
          </button>
          <div class="user-avatar" :title="userName">{{ userInitial }}</div>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import ProPlanPicker from '@/components/Proplanpicker.vue'

import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  History,
  ChefHat,
  UtensilsCrossed,
  Table2,
  Users,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  Menu,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const mobileOpen = ref(false)
const pendingCount = ref(0)
const cookingCount = ref(0) // ← NEW
const restaurantName = ref('')
const restaurantPlan = ref('trial')
const restaurantLogoUrl = ref('')

const showProPicker = ref(false)
const lockedFeatureName = ref('')

function openProPicker(featureName) {
  lockedFeatureName.value = featureName
  showProPicker.value = true
}

const canAccessAnalytics = computed(() =>
  ['trial', 'pro', 'enterprise'].includes(restaurantPlan.value),
)
const canAccessPromotions = computed(() =>
  ['trial', 'pro', 'enterprise'].includes(restaurantPlan.value),
)

const pageTitles = {
  '/app/dashboard': 'Dashboard',
  '/app/orders': 'Orders',
  '/app/kitchen': 'Kitchen View',
  '/app/menu': 'Menu Management',
  '/app/tables': 'Tables & QR Codes',
  '/app/order-history': 'Order History',
  '/app/analytics': 'Analytics',
  '/app/staff': 'Staff',
  '/app/settings': 'Settings',
  '/app/promotions': 'Promotions',
}

const currentPageTitle = computed(() => pageTitles[route.path] || 'Qrder')
const userName = computed(() => authStore.profile?.full_name || 'User')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const restaurantInitial = computed(() => restaurantName.value.charAt(0).toUpperCase() || 'R')
const planLabel = computed(() => {
  const map = { trial: '14-day Trial', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }
  return map[restaurantPlan.value] || 'Trial'
})

async function loadRestaurant() {
  if (!authStore.profile?.restaurant_id) return
  const { data } = await supabase
    .from('restaurants')
    .select('name, plan, logo_url')
    .eq('id', authStore.profile.restaurant_id)
    .single()
  if (data) {
    restaurantName.value = data.name
    restaurantPlan.value = data.plan
    restaurantLogoUrl.value = data.logo_url || ''
  }
}

function getStartOfDayISO(timezone) {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(`${todayStr}T00:00:00`).toISOString()
}

let ordersChannel = null

async function loadCounts() {
  if (!authStore.profile?.restaurant_id) return
  const timezone = authStore.restaurantTimezone || 'UTC'
  const startOfDay = getStartOfDayISO(timezone)
  const restaurantId = authStore.profile.restaurant_id

  // Run both queries in parallel
  const [{ count: pending }, { count: cooking }] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay)
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay)
      .eq('status', 'cooking'),
  ])

  pendingCount.value = pending || 0
  cookingCount.value = cooking || 0
}

function subscribeToOrders() {
  if (!authStore.profile?.restaurant_id) return
  ordersChannel = supabase
    .channel('layout-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${authStore.profile.restaurant_id}`,
      },
      () => loadCounts(), // refresh both counts on any order change
    )
    .subscribe()
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}

onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  await loadRestaurant()
  await loadCounts()
  subscribeToOrders()
})

onUnmounted(() => {
  if (ordersChannel) supabase.removeChannel(ordersChannel)
})
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-base);
  font-family: var(--font-body);
}

.sidebar {
  width: 228px;
  min-width: 228px;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 50;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}
.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-glow);
}
.logo-text {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  color: var(--color-text-primary);
  white-space: nowrap;
  letter-spacing: -0.4px;
}

.restaurant-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 10px 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}
.restaurant-badge-mini {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  margin: 10px 8px;
  flex-shrink: 0;
}
.badge-avatar {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: var(--color-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-body);
}
.badge-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}
.badge-plan {
  font-size: 10px;
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-family: var(--font-body);
}

.sidebar-nav {
  flex: 1;
  padding: 4px 8px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-faint);
  padding: 14px 10px 5px;
  white-space: nowrap;
  font-family: var(--font-body);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  transition:
    background 0.12s,
    color 0.12s;
  position: relative;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
}
.nav-item.nav-active {
  background: var(--color-accent-muted);
  color: var(--color-accent-hover);
}
.nav-item.nav-active .nav-icon {
  color: var(--color-accent);
}

.nav-item.nav-pro {
  cursor: pointer;
}
.nav-item.nav-pro:hover {
  background: rgba(200, 115, 58, 0.08);
  color: var(--color-accent);
}

.pro-icon {
  margin-left: auto;
  color: var(--color-accent);
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(200, 115, 58, 0.45));
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: inherit;
}
.nav-label {
  flex: 1;
}

/* Orders badge — orange (pending/urgent) */
.nav-badge {
  background: var(--color-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  min-width: 18px;
  text-align: center;
  font-family: var(--font-body);
  line-height: 1.4;
}

/* Kitchen badge — yellow (cooking/in-progress) */
.nav-badge--cooking {
  background: #ca8a04; /* amber-600 — distinct from pending orange */
  color: #fff;
}

.nav-badge-dot {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  position: absolute;
  top: 7px;
  right: 7px;
}

/* Cooking dot — offset slightly so both can show when collapsed */
.nav-badge-dot--cooking {
  background: #ca8a04;
  top: 7px;
  right: 7px;
}

.nav-tooltip {
  display: none;
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body);
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  border: 1px solid var(--color-border-medium);
  box-shadow: var(--shadow-card);
  z-index: 100;
  pointer-events: none;
}
.sidebar.collapsed .nav-item:hover .nav-tooltip {
  display: block;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 8px;
  padding: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  flex-shrink: 0;
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
}

.signout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 8px 14px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-faint);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  white-space: nowrap;
  text-align: left;
  flex-shrink: 0;
}
.signout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.topbar {
  height: 56px;
  min-height: 56px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition:
    background 0.12s,
    color 0.12s;
}
.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.topbar-title {
  flex: 1;
  min-width: 0;
}
.page-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--color-accent-hover);
  cursor: pointer;
  transition: background 0.15s;
  animation: pulse-border 2.5s ease infinite;
}
.pending-pill:hover {
  background: var(--color-accent-border);
}

.pill-dot {
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: var(--animate-pulse-dot);
  flex-shrink: 0;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(200, 115, 58, 0);
  }
  50% {
    box-shadow: var(--shadow-glow);
  }
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-body);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.12s;
}
.user-avatar:hover {
  border-color: var(--color-accent-border);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: var(--color-bg-base);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium) transparent;
}
.page-content::-webkit-scrollbar {
  width: 5px;
}
.page-content::-webkit-scrollbar-track {
  background: transparent;
}
.page-content::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 3px;
}

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 40;
  backdrop-filter: blur(2px);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    width: 228px !important;
    min-width: 228px !important;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .mobile-overlay {
    display: block;
  }
  .mobile-menu-btn {
    display: flex;
  }
  .collapse-btn {
    display: none;
  }
  .main-area {
    width: 100%;
  }
  .page-content {
    padding: 20px 16px;
  }
  .pending-pill span:not(.pill-dot) {
    display: none;
  }
  .pending-pill {
    padding: 6px 8px;
  }
}
</style>
