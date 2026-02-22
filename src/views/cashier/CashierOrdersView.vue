<template>
  <div class="view-page">
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Ready to Pay</h1>
        <p class="view-subtitle">Mark orders as paid when customer settles the bill</p>
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
        <Banknote class="empty-icon" />
      </div>
      <h3 class="empty-title">No orders ready</h3>
      <p class="empty-subtitle">Orders marked "ready" will appear here for payment</p>
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
              <span class="order-meta">
                <Clock class="meta-icon" />
                {{ formatTime(order.created_at) }}
                <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
              </span>
            </div>
          </div>
          <div class="order-total-wrap">
            <span class="total-label">Total</span>
            <span class="total-value">{{ formatCurrency(orderTotal(order)) }}</span>
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

        <!-- Action Footer -->
        <div class="order-footer">
          <div class="order-stats">
            <span class="stat-item">
              <Hash class="stat-icon" />
              {{ order.order_items?.length || 0 }} items
            </span>
          </div>
          <button class="btn-paid" @click="markPaid(order.id)">
            <CheckCircle2 class="btn-icon" />
            Mark as Paid
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  TrendingUp,
  Banknote,
  Armchair,
  Clock,
  CheckCircle2,
  MessageSquare,
  Hash,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const orders = ref([])
const todayRevenue = ref(0)
let channel = null

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

async function fetchOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })
  if (data) orders.value = data
}

async function fetchTodayRevenue() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('orders')
    .select('order_items(unit_price, quantity)')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'paid')
    .gte('created_at', today.toISOString())
  if (data) {
    todayRevenue.value = data.reduce(
      (sum, order) =>
        sum + (order.order_items?.reduce((s, i) => s + i.unit_price * i.quantity, 0) ?? 0),
      0,
    )
  }
}

async function markPaid(id) {
  await supabase.from('orders').update({ status: 'paid' }).eq('id', id)
  await fetchTodayRevenue()
}

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchTodayRevenue()])
  channel = supabase
    .channel('cashier-payment')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${authStore.profile?.restaurant_id}`,
      },
      () => {
        fetchOrders()
        fetchTodayRevenue()
      },
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<style scoped>
.view-page {
  padding: 24px;
  max-width: var(--width-narrow);
  margin: 0 auto;
  font-family: var(--font-body);
  color: var(--color-text-primary);
  min-height: 100%;
  padding-bottom: 32px;
}

@media (max-width: 640px) {
  .view-page {
    padding: 16px;
    padding-bottom: 100px;
  }
}

/* ── Header ── */
.view-header {
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

.view-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.view-subtitle {
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
  padding: 80px 24px;
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
}

.order-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
  animation: var(--animate-float-in);
}

.order-card:hover {
  border-color: var(--color-border-medium);
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
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

/* ── Order Header ── */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-wrap: wrap;
  gap: 16px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.table-icon-wrap {
  width: 44px;
  height: 44px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent);
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.meta-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.order-id {
  font-family: monospace;
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.order-total-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.total-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.total-value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.02em;
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
  font-size: 15px;
  font-weight: 600;
  color: var(--color-accent);
  min-width: 32px;
  margin-top: 1px;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.item-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  font-style: italic;
}

.note-icon {
  width: 14px;
  height: 14px;
  opacity: 0.6;
  flex-shrink: 0;
}

.item-price {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 80px;
  text-align: right;
}

/* ── Order Footer ── */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
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

/* ── Paid Button ── */
.btn-paid {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-status-success);
  color: #111827;
  border: none;
  border-radius: var(--radius-card);
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.25);
}

.btn-paid:hover {
  background: #22c55e;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.35);
}

.btn-paid:active {
  transform: translateY(0);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .view-header {
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

  .order-total-wrap {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--color-border-subtle);
  }

  .item-main {
    flex-wrap: wrap;
  }

  .item-price {
    width: 100%;
    text-align: left;
    margin-left: 46px;
    margin-top: 6px;
  }

  .order-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-paid {
    width: 100%;
    justify-content: center;
  }
}
</style>
