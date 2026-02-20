<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <p class="header-date">{{ todayFormatted }}</p>
        <h1 class="header-title">Dashboard</h1>
      </div>
      <div class="header-right">
        <div class="live-badge">
          <span class="live-dot"></span>
          Live
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card"></div>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card stat-card--revenue">
          <div class="stat-icon">💰</div>
          <div class="stat-body">
            <p class="stat-label">Today's Revenue</p>
            <p class="stat-value">{{ formatCurrency(stats.revenue) }}</p>
            <p class="stat-sub">from {{ stats.paidOrders }} paid orders</p>
          </div>
        </div>

        <div class="stat-card stat-card--orders">
          <div class="stat-icon">🧾</div>
          <div class="stat-body">
            <p class="stat-label">Total Orders</p>
            <p class="stat-value">{{ stats.totalOrders }}</p>
            <p class="stat-sub">{{ stats.pendingOrders }} pending right now</p>
          </div>
        </div>

        <div class="stat-card stat-card--tables">
          <div class="stat-icon">🪑</div>
          <div class="stat-body">
            <p class="stat-label">Active Tables</p>
            <p class="stat-value">{{ stats.activeTables }}</p>
            <p class="stat-sub">of {{ stats.totalTables }} total</p>
          </div>
        </div>

        <div class="stat-card stat-card--avg">
          <div class="stat-icon">📊</div>
          <div class="stat-body">
            <p class="stat-label">Avg. Order Value</p>
            <p class="stat-value">{{ formatCurrency(stats.avgOrderValue) }}</p>
            <p class="stat-sub">per paid order today</p>
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="bottom-grid">
        <!-- Live Pending Orders -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Live Pending Orders</h2>
            <router-link to="/app/orders" class="panel-link">View all →</router-link>
          </div>

          <div v-if="pendingOrders.length === 0" class="empty-state">
            <span class="empty-icon">✅</span>
            <p>No pending orders right now</p>
          </div>

          <div v-else class="orders-list">
            <div v-for="order in pendingOrders" :key="order.id" class="order-row">
              <div class="order-row-left">
                <span class="order-table">{{ order.tables?.name || 'Table' }}</span>
                <span class="order-items-count">{{ order.order_items?.length || 0 }} item(s)</span>
              </div>
              <div class="order-row-right">
                <span class="order-elapsed">{{ timeElapsed(order.created_at) }}</span>
                <span class="order-status-badge" :class="`status--${order.status}`">
                  {{ order.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Menu Items -->
        <div class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Top Items Today</h2>
            <router-link to="/app/menu" class="panel-link">Menu →</router-link>
          </div>

          <div v-if="topItems.length === 0" class="empty-state">
            <span class="empty-icon">🍽️</span>
            <p>No orders placed yet today</p>
          </div>

          <div v-else class="top-items-list">
            <div v-for="(item, index) in topItems" :key="item.name" class="top-item-row">
              <div class="top-item-rank">{{ index + 1 }}</div>
              <div class="top-item-info">
                <p class="top-item-name">{{ item.name }}</p>
                <div class="top-item-bar-wrap">
                  <div
                    class="top-item-bar"
                    :style="{ width: `${(item.qty / topItems[0].qty) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="top-item-qty">×{{ item.qty }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-links">
        <router-link to="/app/menu" class="quick-link">
          <span class="ql-icon">🍔</span>
          <span>Menu</span>
        </router-link>
        <router-link to="/app/tables" class="quick-link">
          <span class="ql-icon">🪑</span>
          <span>Tables</span>
        </router-link>
        <router-link to="/app/orders" class="quick-link">
          <span class="ql-icon">🧾</span>
          <span>Orders</span>
        </router-link>
        <router-link to="/app/kitchen" class="quick-link">
          <span class="ql-icon">👨‍🍳</span>
          <span>Kitchen</span>
        </router-link>
        <router-link to="/app/staff" class="quick-link">
          <span class="ql-icon">👥</span>
          <span>Staff</span>
        </router-link>
        <router-link to="/app/settings" class="quick-link">
          <span class="ql-icon">⚙️</span>
          <span>Settings</span>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)

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

let realtimeChannel = null

// ─── Helpers ────────────────────────────────────────────────────────────────

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})

function formatCurrency(amount) {
  const currency = authStore.profile?.restaurants?.currency || 'USD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
}

function timeElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function fetchDashboard() {
  loading.value = true
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  const { start, end } = getTodayRange()

  // Fetch today's orders with items and table info
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, status, created_at, total_amount, order_items(id, quantity, menu_items(name)), tables(name)',
    )
    .eq('restaurant_id', restaurantId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  console.log('Fetched orders:', orders)

  if (error) {
    console.error('Dashboard fetch error:', error)
    loading.value = false
    return
  }

  // Fetch all tables count
  const { count: totalTables, error: TableError } = await supabase
    .from('tables')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)

  if (TableError) {
    console.error('Error fetching tables:', TableError)
    return
  }

  console.log('Total tables:', totalTables)
  // Stats
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const revenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingList = orders.filter((o) => ['pending', 'cooking'].includes(o.status))

  // Active tables (tables with a non-paid order today)
  const activeTableIds = new Set(pendingList.map((o) => o.tables?.name).filter(Boolean))

  stats.value = {
    revenue,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    pendingOrders: pendingList.length,
    activeTables: activeTableIds.size,
    totalTables: totalTables || 0,
    avgOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
  }

  // Live pending orders (show max 6)
  pendingOrders.value = pendingList.slice(0, 6)

  // Top items
  const itemCounts = {}
  for (const order of orders) {
    for (const oi of order.order_items || []) {
      const name = oi.menu_items?.name || 'Unknown'
      itemCounts[name] = (itemCounts[name] || 0) + (oi.quantity || 1)
    }
  }
  topItems.value = Object.entries(itemCounts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  loading.value = false
}

// ─── Realtime ────────────────────────────────────────────────────────────────

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
    .subscribe()
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  await fetchDashboard()
  subscribeRealtime()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* ── Layout ── */
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
}

/* ── Header ── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}
.header-date {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}
.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

/* ── Skeleton ── */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.skeleton-card {
  height: 110px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
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

/* ── Stat Cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  border: 1px solid transparent;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.stat-card--revenue {
  background: #fffbeb;
  border-color: #fde68a;
}
.stat-card--orders {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.stat-card--tables {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.stat-card--avg {
  background: #fdf4ff;
  border-color: #e9d5ff;
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
}
.stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  margin-bottom: 0.2rem;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}
.stat-sub {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-top: 0.15rem;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ── Panel ── */
.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.5rem;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.panel-link {
  font-size: 0.78rem;
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.panel-link:hover {
  color: #111827;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.85rem;
}
.empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* ── Orders List ── */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.9rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}
.order-row-left {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.order-table {
  font-weight: 600;
  font-size: 0.85rem;
  color: #111827;
}
.order-items-count {
  font-size: 0.72rem;
  color: #9ca3af;
}
.order-row-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.order-elapsed {
  font-size: 0.72rem;
  color: #9ca3af;
}
.order-status-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  text-transform: capitalize;
}
.status--pending {
  background: #fef3c7;
  color: #d97706;
}
.status--cooking {
  background: #ffe4e6;
  color: #e11d48;
}
.status--ready {
  background: #d1fae5;
  color: #059669;
}

/* ── Top Items ── */
.top-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.top-item-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.top-item-rank {
  font-size: 0.7rem;
  font-weight: 700;
  color: #d1d5db;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.top-item-info {
  flex: 1;
  min-width: 0;
}
.top-item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.top-item-bar-wrap {
  height: 5px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}
.top-item-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px;
  transition: width 0.6s ease;
}
.top-item-qty {
  font-size: 0.78rem;
  font-weight: 700;
  color: #6b7280;
  flex-shrink: 0;
}

/* ── Quick Links ── */
.quick-links {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.quick-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  transition: all 0.15s ease;
}
.quick-link:hover {
  background: #111827;
  color: #fff;
  border-color: #111827;
  transform: translateY(-1px);
}
.ql-icon {
  font-size: 1rem;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
  .header-title {
    font-size: 1.4rem;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
