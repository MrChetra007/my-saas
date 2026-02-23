<template>
  <div class="kitchen-page">
    <!-- ── Toast Container ────────────────── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
        <component :is="toast.icon" :size="16" />
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- ── Header ─────────────────────────── -->
    <div class="kitchen-header">
      <div class="header-left">
        <h1 class="kitchen-title">Kitchen</h1>
        <div class="live-dot-wrap">
          <span class="live-dot connected" />
          <span class="live-label">Live</span>
        </div>
      </div>
      <div class="header-right">
        <div class="date-label">
          <Calendar :size="13" />
          {{ todayLabel }}
        </div>
        <button
          class="audio-btn"
          @click="muted = !muted"
          :title="muted ? 'Unmute pings' : 'Mute pings'"
        >
          <VolumeX v-if="muted" :size="18" />
          <Volume2 v-else :size="18" />
        </button>
      </div>
    </div>

    <!-- ── Tabs ───────────────────────────── -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="14" />
        {{ tab.label }}
        <span
          v-if="tabCount(tab.key) > 0"
          class="tab-count"
          :class="{ urgent: tab.key === 'pending' }"
        >
          {{ tabCount(tab.key) }}
        </span>
      </button>
    </div>

    <!-- ── Content ────────────────────────── -->
    <div class="orders-area">
      <!-- Empty per tab -->
      <div v-if="filteredOrders.length === 0" class="state-center">
        <div class="empty-icon-wrap">
          <component :is="emptyIcon" :size="36" class="empty-icon" />
        </div>
        <p class="empty-text">{{ emptyText }}</p>
      </div>

      <!-- Orders grid -->
      <div v-else class="orders-grid">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          :class="`status-${order.status}`"
        >
          <!-- Card header -->
          <div class="card-header">
            <div class="card-header-left">
              <span class="table-name">{{ order.tables?.name ?? 'Table' }}</span>
              <span class="order-num">#{{ order.id.slice(-4).toUpperCase() }}</span>
            </div>
            <div class="card-header-right">
              <Clock :size="11" class="elapsed-icon" />
              <span class="elapsed" :class="{ overdue: elapsedMinutes(order) >= 15 }">
                {{ elapsed(order.created_at) }}
              </span>
            </div>
          </div>

          <!-- Items -->
          <div class="card-items">
            <div v-for="item in order.order_items" :key="item.id" class="card-item">
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-name">{{ item.menu_items?.name }}</span>
              <span v-if="item.notes" class="item-note">{{ item.notes }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <!-- Pending: Accept + Reject -->
            <template v-if="order.status === 'pending'">
              <button class="btn-reject" @click="reject(order.id)">
                <X :size="13" />
                Reject
              </button>
              <button class="btn-accept" @click="accept(order.id)">
                <ChefHat :size="13" />
                Accept
              </button>
            </template>

            <!-- Cooking: Mark Ready -->
            <template v-else-if="order.status === 'cooking'">
              <div class="cooking-indicator">
                <span class="cooking-dot" />
                Cooking…
              </div>
              <button class="btn-ready" @click="markReady(order.id)">
                <CheckCheck :size="13" />
                Mark Ready
              </button>
            </template>

            <!-- Ready -->
            <template v-else-if="order.status === 'ready'">
              <div class="ready-badge">
                <CheckCircle :size="14" />
                Ready for pickup
              </div>
            </template>

            <!-- Rejected -->
            <template v-else-if="order.status === 'rejected'">
              <div class="rejected-badge">
                <XCircle :size="14" />
                Rejected
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  ChefHat,
  CheckCheck,
  CheckCircle,
  XCircle,
  X,
  ClipboardList,
  UtensilsCrossed,
  BadgeCheck,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const orders = ref([])
const activeTab = ref('pending')
const muted = ref(false)
let channel = null

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success', icon: CheckCircle })
let toastTimer = null

function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = {
    show: true,
    message,
    type,
    icon: type === 'success' ? CheckCircle : type === 'error' ? XCircle : ChefHat,
  }
  toastTimer = setTimeout(() => (toast.value.show = false), 3000)
}

// ── Date label ────────────────────────────────────────────────────────────────
const todayLabel = computed(() => {
  const timezone = authStore.restaurantTimezone || 'UTC'
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  })
})

// ── Audio Ping ────────────────────────────────────────────────────────────────
let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playPing() {
  if (muted.value) return
  try {
    const ctx = getAudioCtx()
    const tones = [
      { freq: 880, start: 0, duration: 0.15 },
      { freq: 660, start: 0.18, duration: 0.25 },
    ]
    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + start
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.4, t + 0.02)
      gain.gain.linearRampToValueAtTime(0, t + duration)
      osc.start(t)
      osc.stop(t + duration)
    })
  } catch (e) {
    console.warn('Audio ping failed:', e)
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { key: 'pending', label: 'Pending', icon: ClipboardList },
  { key: 'cooking', label: 'Cooking', icon: UtensilsCrossed },
  { key: 'done', label: 'Done', icon: BadgeCheck },
]

function tabCount(key) {
  if (key === 'done')
    return orders.value.filter((o) => ['ready', 'rejected'].includes(o.status)).length
  return orders.value.filter((o) => o.status === key).length
}

const filteredOrders = computed(() => {
  if (activeTab.value === 'done')
    return orders.value.filter((o) => ['ready', 'rejected'].includes(o.status))
  return orders.value.filter((o) => o.status === activeTab.value)
})

const emptyIcon = computed(() => {
  if (activeTab.value === 'pending') return ClipboardList
  if (activeTab.value === 'cooking') return UtensilsCrossed
  return BadgeCheck
})

const emptyText = computed(() => {
  if (activeTab.value === 'pending') return 'No pending orders — all clear!'
  if (activeTab.value === 'cooking') return 'Nothing cooking right now.'
  return 'No completed orders yet today.'
})

// ── Elapsed ───────────────────────────────────────────────────────────────────
function elapsedMinutes(order) {
  return Math.floor((Date.now() - new Date(order.created_at)) / 60000)
}

function elapsed(createdAt) {
  const m = Math.floor((Date.now() - new Date(createdAt)) / 60000)
  if (m < 1) return 'Just now'
  if (m === 1) return '1 min ago'
  return `${m} min ago`
}

// ── Data ──────────────────────────────────────────────────────────────────────
async function fetchOrders() {
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  const timezone = authStore.restaurantTimezone || 'UTC'
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const startOfDay = new Date(`${todayStr}T00:00:00`).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', restaurantId)
    .in('status', ['pending', 'cooking', 'ready', 'rejected'])
    .gte('created_at', startOfDay)
    .order('created_at', { ascending: true })

  if (data) orders.value = data
}

function handleRealtimeChange(payload) {
  if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
    playPing()
    activeTab.value = 'pending'
    showToast('New order received!', 'info')
  }
  fetchOrders()
}

async function accept(id) {
  const { error } = await supabase.from('orders').update({ status: 'cooking' }).eq('id', id)
  if (!error) showToast('Order accepted — now cooking!', 'info')
  else showToast('Failed to accept order.', 'error')
}

async function reject(id) {
  const { error } = await supabase.from('orders').update({ status: 'rejected' }).eq('id', id)
  if (!error) showToast('Order rejected.', 'error')
  else showToast('Failed to reject order.', 'error')
}

async function markReady(id) {
  const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', id)
  if (!error) showToast('Order marked as ready!', 'success')
  else showToast('Failed to update order.', 'error')
}

onMounted(async () => {
  await fetchOrders()
  channel = supabase
    .channel('kitchen-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleRealtimeChange)
    .subscribe()
})

onUnmounted(() => {
  channel && supabase.removeChannel(channel)
  audioCtx && audioCtx.close()
  toastTimer && clearTimeout(toastTimer)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.kitchen-page {
  font-family: 'DM Sans', sans-serif;
  background: #111;
  min-height: 100vh;
  color: #f0ece5;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Toast ───────────────────────────────────────────────── */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}
.toast--success {
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: #4ade80;
}
.toast--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}
.toast--info {
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.3);
  color: #c8733a;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* ── Header ─────────────────────────────────────────────── */
.kitchen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: #161616;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.kitchen-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #f5f0e8;
}
.live-dot-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
}
.live-dot.connected {
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.live-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.date-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #555;
}
.audio-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #666;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.audio-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
}

/* ── Tabs ────────────────────────────────────────────────── */
.tabs-bar {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: #161616;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  color: #555;
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.tab-btn:hover {
  color: #aaa;
  background: rgba(255, 255, 255, 0.05);
}
.tab-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #f0ece5;
}
.tab-count {
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
}
.tab-count.urgent {
  background: #c8733a;
  color: white;
  animation: urgentPulse 1.5s ease-in-out infinite;
}
@keyframes urgentPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* ── Orders area ─────────────────────────────────────────── */
.orders-area {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 80px 20px;
  color: #444;
}
.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-icon {
  color: #444;
}
.empty-text {
  font-size: 15px;
  color: #444;
}

/* ── Orders grid ─────────────────────────────────────────── */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-items: start;
}

.order-card {
  background: #1e1e1e;
  border: 1.5px solid #2a2a2a;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;
}
.order-card.status-pending {
  border-color: rgba(200, 115, 58, 0.3);
}
.order-card.status-cooking {
  border-color: rgba(251, 191, 36, 0.3);
}
.order-card.status-ready {
  border-color: rgba(74, 222, 128, 0.3);
}
.order-card.status-rejected {
  opacity: 0.5;
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.table-name {
  font-size: 17px;
  font-weight: 700;
  color: #f0ece5;
}
.order-num {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  background: #2a2a2a;
  padding: 2px 8px;
  border-radius: 6px;
}
.card-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.elapsed-icon {
  color: #444;
}
.elapsed {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}
.elapsed.overdue {
  color: #ef4444;
  animation: urgentPulse 1.5s ease-in-out infinite;
}

/* Card items */
.card-items {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.card-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.item-qty {
  font-size: 13px;
  font-weight: 700;
  color: #c8733a;
  width: 24px;
  flex-shrink: 0;
}
.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #e0dbd3;
}
.item-note {
  font-size: 11.5px;
  color: #666;
  font-style: italic;
}

/* Card actions */
.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
}

.btn-reject {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid #444;
  background: transparent;
  color: #888;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-reject:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.07);
}

.btn-accept {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  background: #c8733a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-accept:hover {
  background: #d98348;
}

.btn-ready {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px;
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border: 1.5px solid rgba(74, 222, 128, 0.25);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ready:hover {
  background: rgba(74, 222, 128, 0.2);
}

.cooking-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #fbbf24;
}
.cooking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fbbf24;
  animation: pulse 1.5s infinite;
}

.ready-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: #4ade80;
}

.rejected-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: #ef4444;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 600px) {
  .kitchen-header {
    padding: 14px 16px;
  }
  .orders-area {
    padding: 16px;
  }
  .tabs-bar {
    padding: 10px 16px;
  }
  .orders-grid {
    grid-template-columns: 1fr;
  }
}
</style>
