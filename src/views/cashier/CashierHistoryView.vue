<template>
  <div class="history-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Order History</h1>
        <p class="page-subtitle">Today's completed and paid orders</p>
      </div>
      <div class="revenue-card">
        <div class="revenue-icon-wrap">
          <TrendingUp class="revenue-icon" />
        </div>
        <div class="revenue-info">
          <span class="revenue-label">Today's Revenue</span>
          <span class="revenue-value">{{ formatCurrency(todayRevenue) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="orders.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <Receipt class="empty-icon" />
      </div>
      <h3 class="empty-title">No completed orders</h3>
      <p class="empty-subtitle">Paid orders will appear here throughout the day</p>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <!-- Card Header -->
        <div class="order-header">
          <div class="table-info">
            <div class="table-icon-wrap">
              <Armchair class="table-icon" />
            </div>
            <div class="table-details">
              <span class="table-name">{{ order.tables?.name ?? 'Unknown Table' }}</span>
              <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
            </div>
          </div>
          <div class="order-meta">
            <span class="time-badge">
              <Clock class="time-icon" />
              {{ formatTime(order.created_at) }}
            </span>
            <span class="status-badge paid">
              <CheckCircle2 class="status-icon" />
              Paid
            </span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items">
          <div v-for="item in order.order_items" :key="item.id" class="item-row">
            <div class="item-main">
              <span class="item-qty">{{ item.quantity }}×</span>
              <div class="item-details">
                <span class="item-name">{{ item.menu_items?.name ?? 'Unknown Item' }}</span>
                <span v-if="item.notes" class="item-note">
                  <MessageSquare class="note-icon" />
                  {{ item.notes }}
                </span>
              </div>
              <span class="item-price">{{ formatCurrency(item.unit_price * item.quantity) }}</span>
            </div>
          </div>
        </div>

        <!-- Order Footer -->
        <div class="order-footer">
          <div class="order-stats">
            <span class="stat-item">
              <Hash class="stat-icon" />
              {{ order.order_items.length }} items
            </span>
            <span class="stat-item">
              <User class="stat-icon" />
              Cashier
            </span>
          </div>
          <div class="order-total">
            <span class="total-label">Total</span>
            <span class="total-value">{{ formatCurrency(orderTotal(order)) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Footer - Now integrated in flow, not fixed -->
    <div v-if="orders.length > 0" class="summary-section">
      <div class="summary-card">
        <div class="summary-item">
          <span class="summary-label">Orders</span>
          <span class="summary-value">{{ orders.length }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">Items Sold</span>
          <span class="summary-value">{{ totalItems }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item highlight">
          <span class="summary-label">Total Revenue</span>
          <span class="summary-value">{{ formatCurrency(todayRevenue) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  TrendingUp,
  Receipt,
  Armchair,
  Clock,
  CheckCircle2,
  MessageSquare,
  Hash,
  User,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const orders = ref([])

// Computed
const todayRevenue = computed(() => orders.value.reduce((sum, order) => sum + orderTotal(order), 0))

const totalItems = computed(() =>
  orders.value.reduce((sum, order) => sum + (order.order_items?.length || 0), 0),
)

// Methods
function orderTotal(order) {
  return order.order_items?.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// Fetch orders
onMounted(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'paid')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  if (!error && data) orders.value = data
})
</script>

<style scoped>
.history-page {
  padding: 24px;
  max-width: var(--width-narrow);
  margin: 0 auto;
  font-family: var(--font-body);
  color: var(--color-text-primary);
  min-height: 100%;
  padding-bottom: 32px;
}

@media (max-width: 640px) {
  .history-page {
    padding: 16px;
    padding-bottom: 100px; /* Space for mobile bottom nav */
  }
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.revenue-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: var(--radius-panel);
  transition: all 0.2s ease;
}

.revenue-card:hover {
  border-color: rgba(74, 222, 128, 0.35);
  box-shadow: 0 8px 24px rgba(74, 222, 128, 0.12);
}

.revenue-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(74, 222, 128, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.revenue-icon {
  width: 22px;
  height: 22px;
  color: var(--color-status-success);
}

.revenue-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.revenue-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-status-success);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.revenue-value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-status-success);
  letter-spacing: -0.02em;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  background: var(--color-accent-muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.empty-icon {
  width: 36px;
  height: 36px;
  color: var(--color-accent);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.empty-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* ── Orders List ── */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.order-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
}

.order-card:hover {
  border-color: var(--color-border-medium);
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
}

/* ── Order Header ── */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon-wrap {
  width: 40px;
  height: 40px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.table-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.order-id {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: monospace;
  letter-spacing: 0.02em;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.time-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.time-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-badge.paid {
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: var(--color-status-success);
}

.status-icon {
  width: 14px;
  height: 14px;
}

/* ── Order Items ── */
.order-items {
  padding: 8px 0;
}

.item-row {
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.item-row:last-child {
  border-bottom: none;
}

.item-main {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.item-qty {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent);
  min-width: 28px;
  margin-top: 1px;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.item-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

.note-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

.item-price {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 70px;
  text-align: right;
}

/* ── Order Footer ── */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-subtle);
  flex-wrap: wrap;
  gap: 12px;
}

.order-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
}

.order-total {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.total-value {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.01em;
}

/* ── Summary Section (Integrated, not fixed) ── */
.summary-section {
  margin-top: 8px;
  padding-top: 8px;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 20px 32px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-card);
}

.summary-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border-subtle);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-item.highlight {
  padding: 8px 24px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-card);
  margin: -8px 0;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-item.highlight .summary-label {
  color: var(--color-accent);
}

.summary-value {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.summary-item.highlight .summary-value {
  font-size: 22px;
  color: var(--color-accent);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .revenue-card {
    width: 100%;
    justify-content: space-between;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-meta {
    width: 100%;
    justify-content: space-between;
  }

  .item-main {
    flex-wrap: wrap;
  }

  .item-price {
    width: 100%;
    text-align: left;
    margin-left: 42px;
    margin-top: 6px;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-card {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .summary-divider {
    width: 100%;
    height: 1px;
  }

  .summary-item.highlight {
    margin: 0;
    width: 100%;
    padding: 12px;
  }
}

/* ── Animations ── */
.order-card {
  animation: var(--animate-float-in);
}

.order-card:nth-child(1) {
  animation-delay: 0ms;
}
.order-card:nth-child(2) {
  animation-delay: 50ms;
}
.order-card:nth-child(3) {
  animation-delay: 100ms;
}
.order-card:nth-child(4) {
  animation-delay: 150ms;
}
.order-card:nth-child(5) {
  animation-delay: 200ms;
}
</style>
