<template>
  <div class="cashier-layout">
    <!-- Sidebar (desktop) -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🍽️</span>
        <span class="brand-name">{{ restaurantName }}</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/cashier/orders" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">🧾</span> Orders
        </RouterLink>
        <RouterLink to="/cashier/history" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">📋</span> History
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name">{{ authStore.profile?.full_name }}</span>
          <span class="user-role">Cashier</span>
        </div>
        <button class="btn-signout" @click="signOut">Sign out</button>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-wrapper">
      <!-- Mobile top bar -->
      <header class="mobile-header">
        <span class="mobile-brand">🍽️ {{ restaurantName }}</span>
        <button class="btn-signout-mobile" @click="signOut">Sign out</button>
      </header>

      <main class="cashier-main">
        <RouterView />
      </main>

      <!-- Bottom tab bar (mobile) -->
      <nav class="bottom-nav">
        <RouterLink
          to="/cashier/orders"
          class="bottom-nav-item"
          active-class="bottom-nav-item--active"
        >
          <span class="bottom-nav-icon">🧾</span>
          <span class="bottom-nav-label">Orders</span>
        </RouterLink>
        <RouterLink
          to="/cashier/history"
          class="bottom-nav-item"
          active-class="bottom-nav-item--active"
        >
          <span class="bottom-nav-icon">📋</span>
          <span class="bottom-nav-label">History</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const restaurantName = ref('')

onMounted(async () => {
  const { data } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', authStore.profile?.restaurant_id)
    .single()
  if (data) restaurantName.value = data.name
})

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.cashier-layout {
  display: flex;
  height: 100vh;
  font-family: 'DM Sans', sans-serif;
}

/* ── Sidebar (desktop only) ── */
.sidebar {
  width: 220px;
  background: #1f2937;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #374151;
}
.brand-icon {
  font-size: 1.25rem;
}
.brand-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #f9fafb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border-radius: 9px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition:
    background 0.15s,
    color 0.15s;
}
.nav-item:hover {
  background: #374151;
  color: #f9fafb;
}
.nav-item--active {
  background: #374151;
  color: #f9fafb;
}
.nav-icon {
  font-size: 1rem;
}
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #374151;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #f9fafb;
}
.user-role {
  font-size: 0.72rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.btn-signout {
  background: #374151;
  border: none;
  color: #9ca3af;
  padding: 0.45rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  text-align: center;
}
.btn-signout:hover {
  background: #4b5563;
  color: #f9fafb;
}

/* ── Main wrapper ── */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Mobile top bar (hidden on desktop) ── */
.mobile-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  background: #1f2937;
  border-bottom: 1px solid #374151;
  flex-shrink: 0;
}
.mobile-brand {
  font-size: 0.92rem;
  font-weight: 700;
  color: #f9fafb;
}
.btn-signout-mobile {
  background: #374151;
  border: none;
  color: #9ca3af;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-signout-mobile:hover {
  background: #4b5563;
  color: #f9fafb;
}

/* ── Content ── */
.cashier-main {
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
}

/* ── Bottom tab bar (hidden on desktop) ── */
.bottom-nav {
  display: none;
  justify-content: space-around;
  align-items: center;
  background: #1f2937;
  border-top: 1px solid #374151;
  padding: 0.5rem 0;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.4rem 1.5rem;
  border-radius: 10px;
  text-decoration: none;
  color: #6b7280;
  transition: color 0.15s;
}
.bottom-nav-item--active {
  color: #f9fafb;
}
.bottom-nav-icon {
  font-size: 1.3rem;
}
.bottom-nav-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .sidebar {
    display: none;
  }
  .mobile-header {
    display: flex;
  }
  .bottom-nav {
    display: flex;
  }

  /* Give the main content bottom padding so it doesn't hide behind the tab bar */
  .cashier-main {
    padding-bottom: 4rem;
  }
}
</style>
