<template>
  <div class="my-orders-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('waiter.orders.title') }}</h1>
        <p class="page-subtitle">{{ $t('waiter.orders.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button
          class="sound-toggle"
          @click="toggleMute"
          :title="muted ? $t('waiter.orders.unmuteSound') : $t('waiter.orders.muteSound')"
        >
          <VolumeX v-if="muted" class="sound-icon" />
          <Volume2 v-else class="sound-icon" />
        </button>
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span class="live-text">{{ $t('waiter.orders.live') }}</span>
        </div>
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

    <!-- ── Toast Notifications ── -->
    <Teleport to="body">
      <div class="toast-container">
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="toast"
            :class="`toast-${toast.tone}`"
            @click="removeToast(toast.id)"
          >
            <div class="toast-icon-wrap">
              <Bell class="toast-icon" />
            </div>
            <div class="toast-content">
              <span class="toast-title">{{ toast.title }}</span>
              <span class="toast-body">{{ toast.message }}</span>
            </div>
            <button class="toast-close" @click.stop="removeToast(toast.id)">×</button>
            <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }" />
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { ClipboardList, Plus, Armchair, Clock, RefreshCw, Bell, Volume2, VolumeX } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const orders = ref([])
const toasts = ref([])
const muted = ref(localStorage.getItem('waiterSoundMuted') === 'true')
let channel = null
let knownOrders = new Map()
let toastIdCounter = 0
let fetchTimer = null

function toggleMute() {
  muted.value = !muted.value
  localStorage.setItem('waiterSoundMuted', String(muted.value))
}

function scheduleFetch() {
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(fetchOrders, 200)
}

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

function statusMeta(status) {
  const map = {
    pending: { title: t('waiter.orders.statusPending'), tone: 'pending' },
    cooking: { title: t('waiter.orders.statusCooking'), tone: 'cooking' },
    ready: { title: t('waiter.orders.statusReady'), tone: 'ready' },
  }
  return map[status] || null
}

function addToast(title, message, tone = 'ready', duration = 4000) {
  const id = ++toastIdCounter
  toasts.value.push({ id, title, message, tone, duration })
  playNotificationSound(tone)
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

// ── Notification Sound (Web Audio API) ───────────
function playNotificationSound(tone = 'ready') {
  if (muted.value) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const playTone = (frequency, startTime, duration, gainPeak = 0.25) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, startTime)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.05)
    }

    const now = ctx.currentTime
    if (tone === 'ready') {
      // Bright ascending chime — order ready for pickup
      playTone(880, now, 0.18, 0.3)
      playTone(1318.5, now + 0.12, 0.3, 0.28)
    } else if (tone === 'cooking') {
      playTone(740, now, 0.16, 0.2)
    } else {
      // New order — soft double ping
      playTone(660, now, 0.12, 0.22)
      playTone(880, now + 0.1, 0.18, 0.22)
    }

    setTimeout(() => ctx.close(), 800)
  } catch (e) {
    // Silently fail if audio is unavailable or blocked before first interaction
    console.warn('Audio playback failed:', e)
  }
}

function notifyChange(order) {
  const tableName = order.tables?.name ?? t('waiter.orders.unknownTable')
  const itemCount = order.order_items?.length ?? 0
  const message = `${tableName} · ${itemCount} ${
    itemCount === 1 ? t('waiter.orders.item') : t('waiter.orders.items')
  }`
  const prev = knownOrders.get(order.id)

  if (prev === undefined) {
    addToast(t('waiter.orders.newOrder'), message, 'pending')
  } else if (prev !== order.status) {
    const meta = statusMeta(order.status)
    if (meta) addToast(meta.title, message, meta.tone)
  }
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

  if (error || !data) return

  // On the first load knownOrders is empty — use it to distinguish updates
  // from the initial state so we don't toast existing orders on mount.
  if (knownOrders.size > 0) {
    data.forEach(notifyChange)
  }
  knownOrders = new Map(data.map((order) => [order.id, order.status]))
  orders.value = data
}

onMounted(async () => {
  await fetchOrders()
  channel = supabase
    .channel('waiter-orders-view')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${authStore.profile?.restaurant_id}`,
      },
      scheduleFetch,
    )
    // order_items are inserted just after the order row, so listen for them too
    // and debounce so a single refetch picks up the order together with its items.
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, scheduleFetch)
    .subscribe()
})

onUnmounted(() => {
  clearTimeout(fetchTimer)
  if (channel) supabase.removeChannel(channel)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.my-orders-page {
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
  font-family: var(--font-body, 'DM Sans', 'Noto Sans Khmer', sans-serif);
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
  font-family: var(--font-display, 'Fraunces', 'Noto Sans Khmer', serif);
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sound-toggle {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sound-toggle:hover {
  border-color: rgba(200, 115, 58, 0.4);
  color: #c8733a;
}

.sound-icon {
  width: 18px;
  height: 18px;
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
  font-family: var(--font-display, 'Fraunces', 'Noto Sans Khmer', serif);
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
  font-family: var(--font-display, 'Fraunces', 'Noto Sans Khmer', serif);
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
  font-family: var(--font-display, 'Fraunces', 'Noto Sans Khmer', serif);
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

/* ── Toast Notifications ── */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1e1e1e;
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 14px;
  padding: 14px 16px;
  width: 300px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(74, 222, 128, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.toast-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-icon {
  width: 20px;
  height: 20px;
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toast-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.toast-body {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #ffffff;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  border-radius: 0 0 14px 14px;
  transform-origin: left;
  animation: toast-shrink linear forwards;
}

@keyframes toast-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* ── Tone variants ── */
.toast-ready {
  border-color: rgba(74, 222, 128, 0.35);
}

.toast-ready .toast-icon-wrap {
  background: rgba(74, 222, 128, 0.15);
}

.toast-ready .toast-icon,
.toast-ready .toast-title {
  color: #4ade80;
}

.toast-ready .toast-progress {
  background: linear-gradient(90deg, #4ade80, #22c55e);
}

.toast-cooking {
  border-color: rgba(249, 115, 22, 0.35);
}

.toast-cooking .toast-icon-wrap {
  background: rgba(249, 115, 22, 0.15);
}

.toast-cooking .toast-icon,
.toast-cooking .toast-title {
  color: #f97316;
}

.toast-cooking .toast-progress {
  background: linear-gradient(90deg, #f97316, #ea580c);
}

.toast-pending {
  border-color: rgba(250, 204, 21, 0.35);
}

.toast-pending .toast-icon-wrap {
  background: rgba(250, 204, 21, 0.15);
}

.toast-pending .toast-icon,
.toast-pending .toast-title {
  color: #facc15;
}

.toast-pending .toast-progress {
  background: linear-gradient(90deg, #facc15, #eab308);
}

/* ── Toast transition ── */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(110%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(110%) scale(0.95);
}

.toast-move {
  transition: transform 0.25s ease;
}

@media (max-width: 640px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
  }

  .toast {
    width: 100%;
  }
}
</style>
