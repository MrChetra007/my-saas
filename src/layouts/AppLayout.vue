<template>
  <div class="app-shell">
    <!-- ── Sidebar ─────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-icon">🍽️</span>
        <span class="logo-text" v-show="!sidebarCollapsed">RestaurantOS</span>
      </div>

      <!-- Restaurant name badge -->
      <div class="restaurant-badge" v-show="!sidebarCollapsed">
        <div class="badge-avatar">{{ restaurantInitial }}</div>
        <div class="badge-info">
          <span class="badge-name">{{ restaurantName }}</span>
          <span class="badge-plan">{{ planLabel }}</span>
        </div>
      </div>
      <div class="restaurant-badge-mini" v-show="sidebarCollapsed">
        <div class="badge-avatar">{{ restaurantInitial }}</div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label" v-show="!sidebarCollapsed">Overview</div>
        <RouterLink to="/app/dashboard" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.dashboard }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Dashboard</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Dashboard</span>
        </RouterLink>

        <RouterLink to="/app/analytics" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.analytics }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Analytics</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Analytics</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Operations</div>
        <RouterLink to="/app/orders" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.orders }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Orders</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Orders</span>
          <span class="nav-badge" v-if="pendingCount > 0" v-show="!sidebarCollapsed">{{
            pendingCount
          }}</span>
          <span class="nav-badge-dot" v-if="pendingCount > 0" v-show="sidebarCollapsed" />
        </RouterLink>
        <RouterLink to="/app/order-history" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.history }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Order History</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Order History</span>
        </RouterLink>
        <RouterLink to="/app/kitchen" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.kitchen }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Kitchen</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Kitchen</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Setup</div>
        <RouterLink to="/app/menu" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.menu }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Menu</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Menu</span>
        </RouterLink>
        <RouterLink to="/app/tables" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.tables }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Tables & QR</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Tables</span>
        </RouterLink>
        <RouterLink to="/app/staff" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.staff }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Staff</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Staff</span>
        </RouterLink>
        <RouterLink to="/app/promotions" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.promotions }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Promotions</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Promotions</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Account</div>
        <RouterLink to="/app/settings" class="nav-item" active-class="nav-active">
          <span class="nav-icon">{{ icons.settings }}</span>
          <span class="nav-label" v-show="!sidebarCollapsed">Settings</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Settings</span>
        </RouterLink>
      </nav>

      <!-- Collapse toggle -->
      <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        <span>{{ sidebarCollapsed ? '→' : '←' }}</span>
      </button>

      <!-- Sign out -->
      <button class="signout-btn" @click="signOut">
        <span class="nav-icon">⎋</span>
        <span v-show="!sidebarCollapsed">Sign out</span>
      </button>
    </aside>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" v-if="mobileOpen" @click="mobileOpen = false" />

    <!-- ── Main area ───────────────────────────── -->
    <div class="main-area" :class="{ expanded: sidebarCollapsed }">
      <!-- Topbar -->
      <header class="topbar">
        <!-- Mobile menu button -->
        <button class="mobile-menu-btn" @click="mobileOpen = !mobileOpen">☰</button>

        <!-- Page title (slot or route name) -->
        <div class="topbar-title">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>

        <div class="topbar-right">
          <!-- Pending orders indicator -->
          <div class="pending-pill" v-if="pendingCount > 0" @click="$router.push('/app/orders')">
            <span class="pill-dot" />
            {{ pendingCount }} pending
          </div>

          <!-- User avatar -->
          <div class="user-avatar" :title="userName">
            {{ userInitial }}
          </div>
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
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const mobileOpen = ref(false)
const pendingCount = ref(0)
const restaurantName = ref('')
const restaurantPlan = ref('trial')

const icons = {
  dashboard: '▦',
  orders: '🧾',
  kitchen: '👨‍🍳',
  menu: '📋',
  tables: '⬡',
  staff: '👥',
  settings: '⚙',
  history: '📜',
  analytics: '📊',
  promotions: '🏷️',
}

const pageTitles = {
  '/app/dashboard': 'Dashboard',
  '/app/orders': 'Orders',
  '/app/kitchen': 'Kitchen View',
  '/app/menu': 'Menu Management',
  '/app/tables': 'Tables & QR Codes',
  'app/order-history': 'Order History',
  'app/analytics': 'Analytics',
  '/app/staff': 'Staff',
  '/app/settings': 'Settings',
}

const currentPageTitle = computed(() => pageTitles[route.path] || 'RestaurantOS')

const userName = computed(() => authStore.profile?.full_name || 'User')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const restaurantInitial = computed(() => restaurantName.value.charAt(0).toUpperCase() || 'R')
const planLabel = computed(() => {
  const map = { trial: '14-day Trial', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }
  return map[restaurantPlan.value] || 'Trial'
})

// Load restaurant info
async function loadRestaurant() {
  if (!authStore.profile?.restaurant_id) return
  const { data } = await supabase
    .from('restaurants')
    .select('name, plan')
    .eq('id', authStore.profile.restaurant_id)
    .single()
  if (data) {
    restaurantName.value = data.name
    restaurantPlan.value = data.plan
  }
}

// Subscribe to pending orders count
let ordersChannel = null
async function loadPendingCount() {
  if (!authStore.profile?.restaurant_id) return
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', authStore.profile.restaurant_id)
    .eq('status', 'pending')
  pendingCount.value = count || 0
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
      () => loadPendingCount(),
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
  await loadPendingCount()
  subscribeToOrders()
})

onUnmounted(() => {
  if (ordersChannel) supabase.removeChannel(ordersChannel)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Shell ────────────────────────────────────── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f3ef;
  font-family: 'DM Sans', sans-serif;
}

/* ── Sidebar ──────────────────────────────────── */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #1c1917;
  display: flex;
  flex-direction: column;
  padding: 0;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 50;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
  color: #faf8f5;
  white-space: nowrap;
  letter-spacing: -0.3px;
}

/* Restaurant badge */
.restaurant-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin: 12px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.restaurant-badge-mini {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  margin: 12px 10px;
}
.badge-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #c8733a;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.badge-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}
.badge-name {
  font-size: 13px;
  font-weight: 600;
  color: #faf8f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge-plan {
  font-size: 10px;
  color: #c8733a;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 4px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  padding: 14px 8px 4px;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s;
  position: relative;
  white-space: nowrap;
  cursor: pointer;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}
.nav-item.nav-active {
  background: rgba(200, 115, 58, 0.15);
  color: #e8925a;
}
.nav-item.nav-active .nav-icon {
  opacity: 1;
}

.nav-icon {
  font-size: 15px;
  flex-shrink: 0;
  opacity: 0.7;
  width: 20px;
  text-align: center;
}
.nav-label {
  flex: 1;
}

/* Badge for pending count */
.nav-badge {
  background: #c8733a;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}
.nav-badge-dot {
  width: 7px;
  height: 7px;
  background: #c8733a;
  border-radius: 50%;
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Tooltip on collapsed */
.nav-tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 10px;
  background: #1c1917;
  color: #faf8f5;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  pointer-events: none;
}
.sidebar.collapsed .nav-item:hover .nav-tooltip {
  display: block;
}

/* Collapse button */
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Sign out */
.signout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 10px 16px;
  padding: 9px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-align: left;
}
.signout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* ── Main area ────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Topbar ───────────────────────────────────── */
.topbar {
  height: 58px;
  min-height: 58px;
  background: #ffffff;
  border-bottom: 1px solid #ede9e3;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.topbar-title {
  flex: 1;
}
.page-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Pending pill */
.pending-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  color: #c2410c;
  cursor: pointer;
  transition: all 0.15s;
  animation: pulse-border 2s infinite;
}
.pending-pill:hover {
  background: #ffedd5;
}

.pill-dot {
  width: 6px;
  height: 6px;
  background: #c8733a;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(200, 115, 58, 0);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
  }
}

/* User avatar */
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1c1917;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Page content ─────────────────────────────── */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 28px;
  background: #f5f3ef;
}
.page-content::-webkit-scrollbar {
  width: 6px;
}
.page-content::-webkit-scrollbar-track {
  background: transparent;
}
.page-content::-webkit-scrollbar-thumb {
  background: #d6cfc4;
  border-radius: 3px;
}

/* ── Mobile ───────────────────────────────────── */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    width: 240px !important;
    min-width: 240px !important;
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
}
</style>
