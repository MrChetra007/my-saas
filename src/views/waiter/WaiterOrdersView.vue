<template>
  <div class="my-orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('waiter.orders.title') }}</h1>
        <p class="page-subtitle">{{ $t('waiter.orders.subtitle') }}</p>
      </div>
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span class="live-text">{{ $t('waiter.orders.live') }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="orders.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <ClipboardList class="empty-icon" />
      </div>
      <h3 class="empty-title">{{ $t('waiter.orders.emptyTitle') }}</h3>
      <p class="empty-subtitle">{{ $t('waiter.orders.emptySubtitle') }}</p>
      <RouterLink to="/waiter/new-order" class="btn-primary">
        <Plus class="btn-icon" />
        {{ $t('waiter.orders.newOrder') }}
      </RouterLink>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        :class="`status-${order.status}`"
      >
        <!-- Card Header -->
        <div class="order-header">
          <div class="table-info">
            <div class="table-icon-wrap">
              <Armchair class="table-icon" />
            </div>
            <div class="table-details">
              <span class="table-name">{{ order.tables?.name ?? $t('waiter.orders.unknownTable') }}</span>
              <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
            </div>
          </div>
          <div class="status-badge" :class="`badge-${order.status}`">
            <span class="status-dot"></span>
            <span class="status-text">{{ formatStatus(order.status) }}</span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items">
          <div
            v-for="(item, index) in order.order_items"
            :key="item.id"
            class="item-row"
            :class="{ 'item-last': index === order.order_items.length - 1 }"
          >
            <div class="item-main">
              <span class="item-qty">{{ item.quantity }}×</span>
              <span class="item-name">{{ item.menu_items?.name ?? $t('waiter.orders.unknownItem') }}</span>
            </div>
            <span class="item-price">{{ formatCurrency(item.unit_price * item.quantity) }}</span>
          </div>
        </div>

        <!-- Order Footer -->
        <div class="order-footer">
          <div class="order-meta">
            <Clock class="time-icon" />
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
            <span class="time-separator">•</span>
            <span class="item-count">
              {{ order.order_items.length }} {{ order.order_items.length !== 1 ? $t('waiter.orders.items') : $t('waiter.orders.item') }}
            </span>
          </div>
          <div class="order-total">
            <span class="total-label">{{ $t('waiter.orders.total') }}</span>
            <span class="total-value">{{ formatCurrency(orderTotal(order)) }}</span>
          </div>
        </div>

        <!-- Status Progress Bar -->
        <div class="status-progress">
          <div
            class="progress-fill"
            :class="`progress-${order.status}`"
            :style="{ width: progressWidth(order.status) }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Refresh Hint -->
    <div v-if="orders.length > 0" class="refresh-hint">
      <RefreshCw class="refresh-icon" />
      <span>{{ $t('waiter.orders.updatesAutomatically') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { ClipboardList, Plus, Armchair, Clock, RefreshCw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const orders = ref([])
let channel = null

function formatTime(iso) {
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount) {
  const currency = authStore.restaurantCurrency || 'USD'
  const num = (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const spaceIndex = currency.indexOf(' ')
  if (spaceIndex !== -1) {
    const symbol = currency.slice(0, spaceIndex)
    return `${symbol} ${num}`
  }

  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
  } catch {
    return `${currency} ${num}`
  }
}

function formatStatus(status) {
  const map = {
    pending: t('waiter.orders.statusPending'),
    cooking: t('waiter.orders.statusCooking'),
    ready: t('waiter.orders.statusReady'),
  }
  return map[status] || status
}

function progressWidth(status) {
  const map = {
    pending: '33%',
    cooking: '66%',
    ready: '100%',
  }
  return map[status] || '0%'
}

function orderTotal(order) {
  return order.order_items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || 0
}

async function fetchOrders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .gte('created_at', today.toISOString())
    .not('status', 'in', '(paid,rejected)')
    .order('created_at', { ascending: false })

  if (!error && data) orders.value = data
}

onMounted(async () => {
  await fetchOrders()
  channel = supabase
    .channel('waiter-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${authStore.profile?.restaurant_id}`,
      },
      fetchOrders,
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.my-orders-page {
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  min-height: 100vh;
  padding-bottom: 100px;
}

@media (max-width: 640px) {
  .my-orders-page {
    padding: 16px;
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
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 999px;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
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

.live-text {
  font-size: 12px;
  font-weight: 700;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.35);
}

.empty-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.empty-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #c8733a;
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.btn-primary:hover {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.3);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ── Orders List ── */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.order-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Status-based left border accent */
.order-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  transition: background 0.3s ease;
}

.status-pending::before {
  background: #facc15;
}

.status-cooking::before {
  background: #f97316;
}

.status-ready::before {
  background: #4ade80;
}

/* ── Order Header ── */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-icon {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.75);
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.order-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

/* ── Status Badge ── */
.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.badge-pending {
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.25);
  color: #facc15;
}

.badge-pending .status-dot {
  background: #facc15;
}

.badge-cooking {
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #f97316;
}

.badge-cooking .status-dot {
  background: #f97316;
}

.badge-ready {
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: #4ade80;
}

.badge-ready .status-dot {
  background: #4ade80;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* ── Order Items ── */
.order-items {
  display: flex;
  flex-direction: column;
  background: #0e0e0e;
  border-radius: 12px;
  padding: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.item-last {
  border-bottom: none;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-qty {
  width: 28px;
  height: 28px;
  background: rgba(200, 115, 58, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #c8733a;
  flex-shrink: 0;
}

.item-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

/* ── Order Footer ── */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-wrap: wrap;
  gap: 12px;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.time-icon {
  width: 14px;
  height: 14px;
}

.order-time {
  color: rgba(255, 255, 255, 0.55);
}

.time-separator {
  opacity: 0.5;
}

.item-count {
  color: rgba(255, 255, 255, 0.55);
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-value {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #c8733a;
}

/* ── Status Progress Bar ── */
.status-progress {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition:
    width 0.5s ease,
    background 0.3s ease;
}

.progress-pending {
  background: #facc15;
}

.progress-cooking {
  background: #f97316;
}

.progress-ready {
  background: #4ade80;
}

/* ── Refresh Hint ── */
.refresh-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
