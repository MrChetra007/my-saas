<template>
  <div class="dashboard">
    <!-- ── Header ──────────────────────────────────────── -->
    <div class="dashboard-header">
      <div class="header-left">
        <p class="header-sub">Welcome back to {{ restaurantName || $t('dashboard.welcomeFallback') }}</p>
        <h1 class="header-title">{{ $t('dashboard.title') }}</h1>
      </div>
      <div class="header-right">
        <p class="header-time">{{ currentTime }}</p>
        <p class="header-date">{{ todayFormatted }}</p>
      </div>
    </div>

    <!-- ── Loading ─────────────────────────────────────── -->
    <div v-if="loading" class="skeleton-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card" />
    </div>

    <template v-else>
      <!-- ── Stat Cards ──────────────────────────────────── -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-left">
            <p class="stat-label">{{ $t('dashboard.todaysOrders') }}</p>
            <p class="stat-value">{{ stats.totalOrders }}</p>
          </div>
          <div class="stat-icon stat-icon--blue">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-left">
            <p class="stat-label">{{ $t('dashboard.revenue') }}</p>
            <p class="stat-value">{{ formatCurrency(stats.revenue) }}</p>
          </div>
          <div class="stat-icon stat-icon--green">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-left">
            <p class="stat-label">{{ $t('dashboard.activeTables') }}</p>
            <p class="stat-value">{{ stats.activeTables }}</p>
          </div>
          <div class="stat-icon stat-icon--purple">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-left">
            <p class="stat-label">{{ $t('dashboard.avgPrepTime') }}</p>
            <p class="stat-value">{{ avgPrepTime }} {{ $t('dashboard.min') }}</p>
          </div>
          <div class="stat-icon stat-icon--amber">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      <!-- ── Main Grid ───────────────────────────────────── -->
      <div class="main-grid">
        <!-- Live Orders -->
        <div class="orders-panel">
          <div class="panel-header">
            <h2 class="panel-title">{{ $t('dashboard.liveOrders') }}</h2>
            <router-link to="/app/orders" class="view-all-link">{{ $t('dashboard.viewAll') }}</router-link>
          </div>

          <div v-if="pendingOrders.length === 0" class="empty-state">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="empty-icon"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>{{ $t('dashboard.noPendingOrders') }}</p>
          </div>

          <div v-else class="orders-list">
            <div
              v-for="order in pendingOrders"
              :key="order.id"
              class="order-card"
              :class="{ expanded: expandedOrder === order.id }"
              @click="toggleOrder(order.id)"
            >
              <div class="order-card-main">
                <div class="order-avatar">
                  {{ (order.tables?.name || 'T').charAt(0).toUpperCase() }}
                </div>
                <div class="order-info">
                  <p class="order-table-name">{{ order.tables?.name || $t('dashboard.tableFallback') }}</p>
                  <p class="order-meta">
                    {{ order.order_items?.length || 0 }} item{{
                      (order.order_items?.length || 0) !== 1 ? 's' : ''
                    }}
                    &bull; {{ timeElapsed(order.created_at) }}
                  </p>
                </div>
                <div class="order-actions">
                  <span class="order-total">{{ formatCurrency(order.total_amount) }}</span>
                  <router-link :to="`/app/orders`" class="view-btn" @click.stop>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {{ $t('dashboard.view') }}
                  </router-link>
                </div>
              </div>
              <div class="order-card-items" v-if="expandedOrder === order.id">
                <p class="order-items-text">
                  {{
                    (order.order_items || [])
                      .map((oi) => `${oi.quantity}x ${oi.menu_items?.name || $t('dashboard.itemFallback')}`)
                      .join(', ')
                  }}
                </p>
              </div>
              <!-- Always show items preview when NOT expanded -->
              <div class="order-card-preview" v-else-if="order.order_items?.length">
                <p class="order-items-text">
                  {{
                    (order.order_items || [])
                      .map((oi) => `${oi.quantity}x ${oi.menu_items?.name || $t('dashboard.itemFallback')}`)
                      .join(', ')
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-col">
          <!-- Top Items -->
          <div class="side-panel">
            <div class="panel-header">
              <h2 class="panel-title">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  style="color: var(--accent)"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {{ $t('dashboard.topItemsToday') }}
              </h2>
            </div>

            <div v-if="topItems.length === 0" class="empty-state">
              <p>{{ $t('dashboard.noOrdersToday') }}</p>
            </div>

            <div v-else class="top-items-list">
              <div v-for="(item, idx) in topItems" :key="item.name" class="top-item-row">
                <span class="top-item-rank">{{ idx + 1 }}</span>
                <span class="top-item-name">{{ item.name }}</span>
                <div class="top-item-right">
                  <span class="top-item-qty">{{ item.qty }}</span>
                  <span class="top-item-rev">{{ formatCurrency(item.revenue) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="side-panel">
            <div class="panel-header">
              <h2 class="panel-title">{{ $t('dashboard.quickActions') }}</h2>
            </div>
            <div class="quick-actions-list">
              <router-link to="/app/menu" class="quick-action-row">
                <div class="qa-icon qa-icon--orange">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <div class="qa-info">
                  <p class="qa-title">{{ $t('dashboard.manageMenu') }}</p>
                  <p class="qa-sub">{{ $t('dashboard.manageMenuDesc') }}</p>
                </div>
                <svg
                  class="qa-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </router-link>

              <router-link to="/app/tables" class="quick-action-row">
                <div class="qa-icon qa-icon--blue">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <div class="qa-info">
                  <p class="qa-title">{{ $t('dashboard.viewTables') }}</p>
                  <p class="qa-sub">{{ $t('dashboard.viewTablesDesc') }}</p>
                </div>
                <svg
                  class="qa-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </router-link>

              <router-link to="/app/kitchen" class="quick-action-row">
                <div class="qa-icon qa-icon--green">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 2a4 4 0 0 1 4 4v1H8V6a4 4 0 0 1 4-4z" />
                    <rect x="4" y="7" width="16" height="2" rx="1" />
                    <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
                  </svg>
                </div>
                <div class="qa-info">
                  <p class="qa-title">{{ $t('dashboard.kitchenView') }}</p>
                  <p class="qa-sub">{{ $t('dashboard.kitchenViewDesc') }}</p>
                </div>
                <svg
                  class="qa-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const loading = ref(true)
const expandedOrder = ref(null)
const restaurantName = ref('')
const restaurantPlan = ref('trial')
const currentTime = ref('')

const stats = ref({
  revenue: 0,
  totalOrders: 0,
  paidOrders: 0,
  pendingOrders: 0,
  activeTables: 0,
  totalTables: 0,
  avgOrderValue: 0,
})

const pendingOrders = ref([])
const topItems = ref([])
const avgPrepTime = ref(0)

let realtimeChannel = null
let clockInterval = null

// ── Helpers ──────────────────────────────────────────────────────

const todayFormatted = computed(() => {
  const timezone = authStore.restaurantTimezone || 'UTC'
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  })
})

function updateClock() {
  const timezone = authStore.restaurantTimezone || 'UTC'
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}

function formatCurrency(amount) {
  const currency = authStore.restaurantCurrency || 'USD'
  const num = (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Custom currency stored as "RM MYR" → extract symbol before the space
  const spaceIndex = currency.indexOf(' ')
  if (spaceIndex !== -1) {
    const symbol = currency.slice(0, spaceIndex)
    return `${symbol} ${num}`
  }

  // Known ISO code — use Intl
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
  } catch {
    return `${currency} ${num}`
  }
}

function timeElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}${t('dashboard.timeElapsedSeconds')}`
  if (diff < 3600) return `${Math.floor(diff / 60)}${t('dashboard.timeElapsedMinutes')}`
  return `${Math.floor(diff / 3600)}${t('dashboard.timeElapsedHours')}`
}

function getTodayRange() {
  const timezone = authStore.restaurantTimezone || 'UTC'

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const start = new Date(`${todayStr}T00:00:00`).toISOString()
  const end = new Date(`${todayStr}T23:59:59`).toISOString()
  return { start, end }
}

function toggleOrder(id) {
  expandedOrder.value = expandedOrder.value === id ? null : id
}

// ── Data Fetching ─────────────────────────────────────────────────

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

// async function fetchDashboard() {
//   loading.value = true
//   const restaurantId = authStore.profile?.restaurant_id
//   if (!restaurantId) return

//   const { start, end } = getTodayRange()

//   const { data: orders, error } = await supabase
//     .from('orders')
//     .select(
//       'id, status, created_at, total_amount, order_items(id, quantity, menu_items(name, price)), tables(name)',
//     )
//     .eq('restaurant_id', restaurantId)
//     .gte('created_at', start)
//     .lte('created_at', end)
//     .order('created_at', { ascending: false })

//   if (error) {
//     console.error('Dashboard fetch error:', error)
//     loading.value = false
//     return
//   }

//   const { count: totalTables } = await supabase
//     .from('tables')
//     .select('id', { count: 'exact', head: true })
//     .eq('restaurant_id', restaurantId)

//   const paidOrders = orders.filter((o) => o.status === 'paid')
//   const revenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
//   const pendingList = orders.filter((o) => ['pending', 'cooking'].includes(o.status))
//   const activeTableIds = new Set(pendingList.map((o) => o.tables?.name).filter(Boolean))

//   stats.value = {
//     revenue,
//     totalOrders: orders.length,
//     paidOrders: paidOrders.length,
//     pendingOrders: pendingList.length,
//     activeTables: activeTableIds.size,
//     totalTables: totalTables || 0,
//     avgOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
//   }

//   // Avg prep time (cooking orders, time from created_at to now)
//   if (pendingList.length) {
//     const avgMs =
//       pendingList.reduce((sum, o) => sum + (Date.now() - new Date(o.created_at)), 0) /
//       pendingList.length
//     avgPrepTime.value = Math.round(avgMs / 60000)
//   } else {
//     avgPrepTime.value = 0
//   }

//   pendingOrders.value = pendingList.slice(0, 8)

//   // Top items with revenue
//   const itemMap = {}
//   for (const order of orders) {
//     for (const oi of order.order_items || []) {
//       const name = oi.menu_items?.name || 'Unknown'
//       const price = oi.menu_items?.price || 0
//       if (!itemMap[name]) itemMap[name] = { qty: 0, revenue: 0 }
//       itemMap[name].qty += oi.quantity || 1
//       itemMap[name].revenue += (oi.quantity || 1) * price
//     }
//   }
//   topItems.value = Object.entries(itemMap)
//     .map(([name, data]) => ({ name, ...data }))
//     .sort((a, b) => b.qty - a.qty)
//     .slice(0, 5)

//   loading.value = false
// }

// ── Realtime ──────────────────────────────────────────────────────

async function fetchDashboard() {
  loading.value = true
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  const { start, end } = getTodayRange()

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, status, created_at, total_amount, order_items(id, quantity, menu_items(name, price)), tables(name)',
    )
    .eq('restaurant_id', restaurantId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Dashboard fetch error:', error)
    loading.value = false
    return
  }

  const { count: totalTables } = await supabase
    .from('tables')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)

  const { count: activeTablesCount } = await supabase
    .from('tables')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)

  const paidOrders = orders.filter((o) => o.status === 'paid')
  const revenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingList = orders.filter((o) => ['pending', 'cooking'].includes(o.status))

  stats.value = {
    revenue,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    pendingOrders: pendingList.length,
    activeTables: activeTablesCount || 0,
    totalTables: totalTables || 0,
    avgOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
  }

  // Avg prep time (cooking orders, time from created_at to now)
  if (pendingList.length) {
    const avgMs =
      pendingList.reduce((sum, o) => sum + (Date.now() - new Date(o.created_at)), 0) /
      pendingList.length
    avgPrepTime.value = Math.round(avgMs / 60000)
  } else {
    avgPrepTime.value = 0
  }

  pendingOrders.value = pendingList.slice(0, 8)

  // Top items with revenue
  const itemMap = {}
  for (const order of orders) {
    for (const oi of order.order_items || []) {
      const name = oi.menu_items?.name || t('dashboard.unknownItemFallback')
      const price = oi.menu_items?.price || 0
      if (!itemMap[name]) itemMap[name] = { qty: 0, revenue: 0 }
      itemMap[name].qty += oi.quantity || 1
      itemMap[name].revenue += (oi.quantity || 1) * price
    }
  }
  topItems.value = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  loading.value = false
}

function subscribeRealtime() {
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  realtimeChannel = supabase
    .channel('dashboard-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => fetchDashboard(),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => fetchDashboard(),
    )
    .subscribe()
}

// ── Lifecycle ─────────────────────────────────────────────────────

onMounted(async () => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  if (!authStore.profile) await authStore.fetchProfile()
  await loadRestaurant()
  await fetchDashboard()
  subscribeRealtime()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  if (clockInterval) clearInterval(clockInterval)
})
</script>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────────── */
.dashboard {
  padding: 28px 32px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-primary, #fff);
}

/* ── Header ───────────────────────────────────────────────────────── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}
.header-sub {
  font-size: 13px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  margin-bottom: 4px;
  letter-spacing: 0.01em;
}
.header-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.5px;
  margin: 0;
  line-height: 1.1;
}
.header-right {
  text-align: right;
}
.header-time {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.5px;
  line-height: 1.15;
}
.header-date {
  font-size: 12px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  margin-top: 2px;
}

/* ── Skeleton ─────────────────────────────────────────────────────── */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.skeleton-card {
  height: 92px;
  border-radius: var(--radius-card, 10px);
  background: linear-gradient(90deg, #1e1e1e 25%, #252525 50%, #1e1e1e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── Stat Cards ───────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.stat-card:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
  transform: translateY(-1px);
}
.stat-left {
}
.stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  margin-bottom: 6px;
}
.stat-value {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.5px;
  line-height: 1;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon--blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.stat-icon--green {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}
.stat-icon--purple {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}
.stat-icon--amber {
  background: rgba(234, 179, 8, 0.13);
  color: #facc15;
}

/* ── Main Grid ────────────────────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 16px;
  align-items: start;
}

/* ── Panel base ───────────────────────────────────────────────────── */
.orders-panel,
.side-panel {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  padding: 20px;
}
.right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.view-all-link {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent, #c8733a);
  text-decoration: none;
  transition: opacity 0.15s;
}
.view-all-link:hover {
  opacity: 0.8;
}

/* ── Empty ────────────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 28px 16px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-icon {
  opacity: 0.4;
}

/* ── Orders ───────────────────────────────────────────────────────── */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-card {
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
}
.order-card:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
}
.order-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.order-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent, #c8733a);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.order-info {
  flex: 1;
  min-width: 0;
}
.order-table-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  margin-bottom: 2px;
}
.order-meta {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.order-total {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
}
.view-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  cursor: pointer;
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.view-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary, #fff);
  border-color: var(--color-border-bright, rgba(255, 255, 255, 0.22));
}

.order-card-preview,
.order-card-items {
  padding: 0 16px 12px 64px;
}
.order-items-text {
  font-size: 12px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  line-height: 1.5;
}

/* ── Top Items ────────────────────────────────────────────────────── */
.top-items-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.top-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.05));
}
.top-item-row:last-child {
  border-bottom: none;
}
.top-item-rank {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-faint, rgba(255, 255, 255, 0.2));
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.top-item-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.top-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex-shrink: 0;
}
.top-item-qty {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
}
.top-item-rev {
  font-size: 10px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}

/* ── Quick Actions ────────────────────────────────────────────────── */
.quick-actions-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.quick-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 10px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s;
}
.quick-action-row:hover {
  background: rgba(255, 255, 255, 0.04);
}
.quick-action-row:hover .qa-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.qa-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qa-icon--orange {
  background: rgba(200, 115, 58, 0.18);
  color: var(--color-accent, #c8733a);
}
.qa-icon--blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.qa-icon--green {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}

.qa-info {
  flex: 1;
  min-width: 0;
}
.qa-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  margin-bottom: 2px;
}
.qa-sub {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.qa-arrow {
  color: var(--color-text-muted, rgba(255, 255, 255, 0.3));
  opacity: 0.5;
  transition:
    opacity 0.15s,
    transform 0.15s;
  flex-shrink: 0;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .dashboard {
    padding: 20px 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .header-time {
    font-size: 1.3rem;
  }
  .header-title {
    font-size: 1.5rem;
  }
}
@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
