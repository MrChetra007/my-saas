<template>
  <div class="app-shell">
    <!-- ── Sidebar ─────────────────────────────── -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileOpen }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-mark">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <span class="logo-text" v-show="!sidebarCollapsed">RestaurantOS</span>
      </div>

      <!-- Restaurant badge -->
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
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Dashboard</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Dashboard</span>
        </RouterLink>

        <RouterLink to="/app/analytics" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Analytics</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Analytics</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Operations</div>

        <RouterLink to="/app/orders" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Orders</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Orders</span>
          <span class="nav-badge" v-if="pendingCount > 0" v-show="!sidebarCollapsed">{{
            pendingCount
          }}</span>
          <span class="nav-badge-dot" v-if="pendingCount > 0" v-show="sidebarCollapsed" />
        </RouterLink>

        <RouterLink to="/app/order-history" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Order History</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Order History</span>
        </RouterLink>

        <RouterLink to="/app/kitchen" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1H8V6a4 4 0 0 1 4-4z" />
              <rect x="4" y="7" width="16" height="2" rx="1" />
              <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
              <line x1="9" y1="13" x2="9" y2="17" />
              <line x1="12" y1="13" x2="12" y2="17" />
              <line x1="15" y1="13" x2="15" y2="17" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Kitchen</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Kitchen</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Setup</div>

        <RouterLink to="/app/menu" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M3 6h18M3 12h18M3 18h12" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Menu</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Menu</span>
        </RouterLink>

        <RouterLink to="/app/tables" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <rect x="3" y="10" width="18" height="4" rx="1" />
              <line x1="6" y1="14" x2="6" y2="20" />
              <line x1="18" y1="14" x2="18" y2="20" />
              <line x1="12" y1="3" x2="12" y2="10" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Tables & QR</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Tables</span>
        </RouterLink>

        <RouterLink to="/app/staff" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Staff</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Staff</span>
        </RouterLink>

        <RouterLink to="/app/promotions" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
              />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" /></svg
          ></span>
          <span class="nav-label" v-show="!sidebarCollapsed">Promotions</span>
          <span class="nav-tooltip" v-show="sidebarCollapsed">Promotions</span>
        </RouterLink>

        <div class="nav-section-label" v-show="!sidebarCollapsed">Account</div>

        <RouterLink to="/app/settings" class="nav-item" active-class="nav-active">
          <span class="nav-icon"
            ><svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              /></svg
          ></span>
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
        <svg
          v-if="!sidebarCollapsed"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <svg
          v-else
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <!-- Sign out -->
      <button class="signout-btn" @click="signOut">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span v-show="!sidebarCollapsed">Sign out</span>
      </button>
    </aside>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" v-if="mobileOpen" @click="mobileOpen = false" />

    <!-- ── Main area ───────────────────────────── -->
    <div class="main-area" :class="{ expanded: sidebarCollapsed }">
      <!-- Topbar -->
      <header class="topbar">
        <button class="mobile-menu-btn" @click="mobileOpen = !mobileOpen" aria-label="Open menu">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div class="topbar-title">
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>

        <div class="topbar-right">
          <!-- Pending orders pill -->
          <button class="pending-pill" v-if="pendingCount > 0" @click="$router.push('/app/orders')">
            <span class="pill-dot" />
            {{ pendingCount }} pending
          </button>

          <!-- Notifications (placeholder) -->
          <button class="icon-btn" aria-label="Notifications">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <!-- User avatar -->
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

const currentPageTitle = computed(() => pageTitles[route.path] || 'RestaurantOS')
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
    .select('name, plan')
    .eq('id', authStore.profile.restaurant_id)
    .single()
  if (data) {
    restaurantName.value = data.name
    restaurantPlan.value = data.plan
  }
}

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

/* ── Shell ── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-deep, #111);
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

/* ── Sidebar ── */
.sidebar {
  width: 228px;
  min-width: 228px;
  background: var(--bg-panel, #161616);
  border-right: 1px solid var(--border, rgba(255, 255, 255, 0.07));
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

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.07));
  flex-shrink: 0;
}
.logo-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent-20, rgba(200, 115, 58, 0.2));
  border: 1px solid var(--accent-30, rgba(200, 115, 58, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #c8733a);
  flex-shrink: 0;
}
.logo-text {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
  white-space: nowrap;
  letter-spacing: -0.3px;
}

/* Restaurant badge */
.restaurant-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 10px 8px;
  background: var(--bg-card, #1e1e1e);
  border-radius: var(--radius, 10px);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.07));
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
  border-radius: var(--radius-sm, 6px);
  background: var(--accent, #c8733a);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}
.badge-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}
.badge-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #f0ece5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}
.badge-plan {
  font-size: 10px;
  color: var(--accent, #c8733a);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

/* Nav */
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
  color: var(--text-subtle, #555);
  padding: 14px 10px 5px;
  white-space: nowrap;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  text-decoration: none;
  color: var(--text-muted, #666);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  transition:
    background 0.12s,
    color 0.12s;
  position: relative;
  white-space: nowrap;
  cursor: pointer;
}
.nav-item:hover {
  background: var(--bg-hover, #252525);
  color: var(--text-secondary, #888);
}
.nav-item.nav-active {
  background: var(--accent-10, rgba(200, 115, 58, 0.1));
  color: var(--accent-400, #db8a60);
}
.nav-item.nav-active .nav-icon {
  color: var(--accent, #c8733a);
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

/* Pending badge */
.nav-badge {
  background: var(--accent, #c8733a);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full, 9999px);
  min-width: 18px;
  text-align: center;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  line-height: 1.4;
}
.nav-badge-dot {
  width: 6px;
  height: 6px;
  background: var(--accent, #c8733a);
  border-radius: 50%;
  position: absolute;
  top: 7px;
  right: 7px;
}

/* Tooltip when collapsed */
.nav-tooltip {
  display: none;
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-card, #1e1e1e);
  color: var(--text-primary, #f0ece5);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  padding: 5px 10px;
  border-radius: var(--radius-sm, 6px);
  white-space: nowrap;
  border: 1px solid var(--border-strong, #2a2a2a);
  box-shadow: var(--shadow-card, 0 10px 30px rgba(0, 0, 0, 0.35));
  z-index: 100;
  pointer-events: none;
}
.sidebar.collapsed .nav-item:hover .nav-tooltip {
  display: block;
}

/* Collapse toggle */
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 8px;
  padding: 8px;
  background: var(--bg-card, #1e1e1e);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-sm, 6px);
  color: var(--text-muted, #666);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  flex-shrink: 0;
}
.collapse-btn:hover {
  background: var(--bg-hover, #252525);
  color: var(--text-secondary, #888);
}

/* Sign out */
.signout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 8px 14px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm, 6px);
  color: var(--text-subtle, #555);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body, 'DM Sans', sans-serif);
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
  color: var(--danger, #ef4444);
}

/* ── Main area ── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Topbar ── */
.topbar {
  height: 56px;
  min-height: 56px;
  background: var(--bg-panel, #161616);
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.07));
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
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm, 6px);
  transition:
    background 0.12s,
    color 0.12s;
}
.mobile-menu-btn:hover {
  background: var(--bg-hover, #252525);
  color: var(--text-primary, #f0ece5);
}

.topbar-title {
  flex: 1;
  min-width: 0;
}
.page-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
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

/* Pending pill */
.pending-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--accent-10, rgba(200, 115, 58, 0.1));
  border: 1px solid var(--accent-30, rgba(200, 115, 58, 0.3));
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--accent-400, #db8a60);
  cursor: pointer;
  transition: background 0.15s;
  animation: pulse-border 2.5s ease infinite;
}
.pending-pill:hover {
  background: var(--accent-20, rgba(200, 115, 58, 0.2));
}

.pill-dot {
  width: 6px;
  height: 6px;
  background: var(--accent, #c8733a);
  border-radius: 50%;
  animation: pulse-dot 1.5s ease infinite;
  flex-shrink: 0;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.75);
  }
}
@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(200, 115, 58, 0);
  }
  50% {
    box-shadow: var(--shadow-glow, 0 0 20px rgba(200, 115, 58, 0.3));
  }
}

/* Icon button (notifications, etc.) */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: none;
  border: 1px solid var(--border-strong, #2a2a2a);
  border-radius: var(--radius-sm, 6px);
  color: var(--text-muted, #666);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s,
    border-color 0.12s;
}
.icon-btn:hover {
  background: var(--bg-hover, #252525);
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--text-secondary, #888);
}

/* User avatar */
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full, 9999px);
  background: var(--bg-card, #1e1e1e);
  border: 1px solid var(--border-strong, #2a2a2a);
  color: var(--text-primary, #f0ece5);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.12s;
}
.user-avatar:hover {
  border-color: var(--accent-30, rgba(200, 115, 58, 0.3));
}

/* ── Page content ── */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: var(--bg-deep, #111);
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong, #2a2a2a) transparent;
}
.page-content::-webkit-scrollbar {
  width: 5px;
}
.page-content::-webkit-scrollbar-track {
  background: transparent;
}
.page-content::-webkit-scrollbar-thumb {
  background: var(--border-strong, #2a2a2a);
  border-radius: 3px;
}

/* Mobile overlay */
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
