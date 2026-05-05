<template>
  <div class="waiter-layout">
    <!-- Sidebar (desktop) -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon-wrap">
          <img v-if="restaurantLogo" :src="restaurantLogo" alt="logo" class="brand-logo-img" />
          <Utensils v-else class="brand-icon" />
        </div>
        <span class="brand-name">{{ restaurantName }}</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          to="/waiter/new-order"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === '/waiter/new-order' }"
        >
          <PlusCircle class="nav-icon" />
          <span class="nav-label">{{ $t('layouts.newOrder') }}</span>
        </RouterLink>
        <RouterLink
          to="/waiter/tables"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === '/waiter/tables' }"
        >
          <LayoutGrid class="nav-icon" />
          <span class="nav-label">{{ $t('layouts.tables') }}</span>
        </RouterLink>
        <RouterLink
          to="/waiter/orders"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path === '/waiter/orders' }"
        >
          <ClipboardList class="nav-icon" />
          <span class="nav-label">{{ $t('layouts.myOrders') }}</span>
          <span v-if="activeOrdersCount > 0" class="nav-badge">{{ activeOrdersCount }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">
            <User class="avatar-icon" />
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.profile?.full_name || $t('layouts.staff') }}</span>
            <span class="user-role">{{ $t('layouts.waiter') }}</span>
          </div>
        </div>
        <button class="btn-signout" @click="signOut">
          <LogOut class="signout-icon" />
          <span>{{ $t('layouts.signOut') }}</span>
        </button>
      </div>
    </aside>

    <!-- Main wrapper -->
    <div class="main-wrapper">
      <!-- Mobile top bar -->
      <header class="mobile-header">
        <div class="mobile-brand">
          <div class="brand-icon-wrap sm">
            <img v-if="restaurantLogo" :src="restaurantLogo" alt="logo" class="brand-logo-img" />
            <Utensils v-else class="brand-icon" />
          </div>
          <span class="brand-text">{{ restaurantName }}</span>
        </div>
        <button class="btn-icon" @click="signOut" title="Sign out">
          <LogOut class="icon" />
        </button>
      </header>

      <main class="waiter-main">
        <RouterView />
      </main>

      <!-- Bottom tab bar (mobile) -->
      <nav class="bottom-nav">
        <RouterLink
          to="/waiter/new-order"
          class="bottom-nav-item"
          :class="{ 'bottom-nav-item--active': $route.path === '/waiter/new-order' }"
        >
          <PlusCircle class="bottom-nav-icon" />
            <span class="bottom-nav-label">{{ $t('layouts.new') }}</span>
        </RouterLink>
        <RouterLink
          to="/waiter/tables"
          class="bottom-nav-item"
          :class="{ 'bottom-nav-item--active': $route.path === '/waiter/tables' }"
        >
          <LayoutGrid class="bottom-nav-icon" />
          <span class="bottom-nav-label">{{ $t('layouts.tables') }}</span>
        </RouterLink>
        <RouterLink
          to="/waiter/orders"
          class="bottom-nav-item"
          :class="{ 'bottom-nav-item--active': $route.path === '/waiter/orders' }"
        >
          <div class="bottom-nav-icon-wrap">
            <ClipboardList class="bottom-nav-icon" />
            <span v-if="activeOrdersCount > 0" class="bottom-badge">{{ activeOrdersCount }}</span>
          </div>
          <span class="bottom-nav-label">{{ $t('layouts.myOrders') }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { Utensils, PlusCircle, LayoutGrid, ClipboardList, User, LogOut } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const restaurantName = ref('')
const activeOrdersCount = ref(0)
const restaurantLogo = ref('')

onMounted(async () => {
  // Fetch restaurant name
  const { data } = await supabase
    .from('restaurants')
    .select('name,logo_url,timezone')
    .eq('id', authStore.profile?.restaurant_id)
    .single()
  if (data) {
    restaurantName.value = data.name
    restaurantLogo.value = data.logo_url || ''
    // timezone is already in authStore from fetchProfile, but just in case:
    if (!authStore.restaurantTimezone && data.timezone) {
      authStore.restaurantTimezone = data.timezone
    }
  }

  // Subscribe to active orders count
  subscribeToOrders()
})

function subscribeToOrders() {
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  supabase
    .channel('waiter-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => fetchActiveOrdersCount(),
    )
    .subscribe()

  fetchActiveOrdersCount()
}

async function fetchActiveOrdersCount() {
  const restaurantId = authStore.profile?.restaurant_id // 👈 define locally
  if (!restaurantId) return

  const timezone = authStore.restaurantTimezone || 'UTC' // 👈 use store, no DB call

  // Get start of today in the restaurant's timezone
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) // gives "YYYY-MM-DD" in their local time

  const startOfDay = new Date(`${todayStr}T00:00:00`)

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .gte('created_at', startOfDay.toISOString()) // 👈 only today
    .in('status', ['pending', 'cooking', 'ready'])

  activeOrdersCount.value = count || 0
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.waiter-layout {
  display: flex;
  height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #111111;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

/* ── Sidebar (desktop only) ── */
.sidebar {
  width: 260px;
  background: #161616;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.brand-icon-wrap {
  width: 40px;
  height: 40px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-icon-wrap.sm {
  width: 32px;
  height: 32px;
}

.brand-icon {
  width: 20px;
  height: 20px;
  color: #c8733a;
}

.brand-icon-wrap.sm .brand-icon {
  width: 16px;
  height: 16px;
}

.brand-name {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}

.nav-item--active {
  background: rgba(200, 115, 58, 0.15);
  color: #c8733a;
  border: 1px solid rgba(200, 115, 58, 0.25);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  width: 20px;
  height: 20px;
  background: #c8733a;
  color: #ffffff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.55);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.btn-signout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.55);
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.btn-signout:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.signout-icon {
  width: 16px;
  height: 16px;
}

/* ── Main wrapper ── */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #111111;
}

/* ── Mobile top bar ── */
.mobile-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #161616;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-text {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.btn-icon {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.icon {
  width: 18px;
  height: 18px;
}

/* ── Content ── */
.waiter-main {
  flex: 1;
  overflow-y: auto;
  background: #111111;
  padding: 24px;
}

/* ── Bottom tab bar (mobile) ── */
.bottom-nav {
  display: none;
  justify-content: space-around;
  align-items: center;
  background: #161616;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 24px;
  border-radius: 12px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.35);
  transition: all 0.2s ease;
  position: relative;
  flex: 1;
}

.bottom-nav-item--active {
  color: #c8733a;
}

.bottom-nav-icon-wrap {
  position: relative;
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
}

.bottom-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #c8733a;
  color: #ffffff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #161616;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .mobile-header {
    display: flex;
  }

  .bottom-nav {
    display: flex;
  }

  .waiter-main {
    padding: 16px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
}

/* Safe area for iPhone notch */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-header {
    padding-top: calc(12px + env(safe-area-inset-top));
  }
}
</style>
