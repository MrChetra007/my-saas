<template>
  <div class="kitchen-page">
    <!-- ── Toast ─────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
        <component :is="toast.icon" :size="16" />
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- Header -->
    <div class="kitchen-header">
      <div class="header-left">
        <h1 class="page-title">Kitchen Display</h1>
        <div class="connection-status">
          <span class="status-dot" :class="{ connected: isConnected }" />
          <span class="status-text">{{ isConnected ? 'Live' : 'Reconnecting…' }}</span>
        </div>
      </div>

      <div class="header-right">
        <span class="date-label">{{ todayLabel }}</span>
        <button
          class="icon-btn audio-toggle"
          @click="audioEnabled = !audioEnabled"
          :title="audioEnabled ? 'Mute new order alerts' : 'Enable new order alerts'"
        >
          <Volume2 v-if="audioEnabled" :size="20" />
          <VolumeX v-else :size="20" />
        </button>
      </div>
    </div>

    <!-- Stat Cards / Tabs -->
    <div class="stat-cards">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="stat-card"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" :size="28" class="stat-icon" />
        <div class="stat-content">
          <div class="stat-label">{{ tab.label }}</div>
          <div class="stat-count">{{ tab.count }}</div>
        </div>
      </div>
    </div>

    <!-- Orders Area -->
    <div class="orders-area">
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>Loading orders…</span>
      </div>

      <div v-else-if="visibleOrders.length === 0" class="empty-state">
        <component :is="emptyStateIcon" :size="64" class="empty-icon" />
        <h3>{{ emptyTitle }}</h3>
        <p class="empty-text">{{ emptyMessage }}</p>
      </div>

      <div v-else class="orders-grid">
        <div
          v-for="order in visibleOrders"
          :key="order.id"
          class="order-card"
          :class="{
            'status-pending': order.status === 'pending',
            'status-cooking': order.status === 'cooking',
            'status-ready': order.status === 'ready',
            'status-rejected': order.status === 'rejected',
            'is-new': order._isNew,
          }"
        >
          <div class="card-header">
            <div class="header-left">
              <span class="table-badge">{{ order._tableName }}</span>
              <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
            </div>
            <span class="timer" :class="{ overdue: elapsedMinutes(order) >= 15 }">
              {{ elapsedLabel(order) }}
            </span>
          </div>

          <div class="card-items">
            <div v-for="item in order._items" :key="item.id" class="order-item">
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-name">{{ item._name }}</span>
              <span v-if="item.notes" class="item-note">({{ item.notes }})</span>
            </div>
          </div>

          <div v-if="order.notes" class="order-notes">
            <MessageSquare :size="18" class="note-icon" />
            {{ order.notes }}
          </div>

          <div class="card-actions">
            <template v-if="order.status === 'pending'">
              <button class="btn-reject" @click="openRejectModal(order)">Reject</button>
              <button class="btn-accept" @click="acceptOrder(order)">Accept → Cooking</button>
            </template>

            <template v-else-if="order.status === 'cooking'">
              <button class="btn-ready" @click="markReady(order)">Mark Ready</button>
            </template>

            <template v-else-if="order.status === 'ready'">
              <div class="status-indicator ready">Ready for pickup</div>
            </template>

            <template v-else-if="order.status === 'rejected'">
              <div class="status-indicator rejected">Rejected</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <Teleport to="body">
      <div v-if="rejectModal.open" class="modal-backdrop" @click.self="rejectModal.open = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Reject Order</h2>
            <button class="modal-close-btn" @click="rejectModal.open = false">
              <X :size="24" />
            </button>
          </div>
          <div class="modal-body">
            <p class="reject-info">Select or enter a reason (visible to customer).</p>

            <div class="reason-chips">
              <button
                v-for="r in rejectReasons"
                :key="r"
                class="chip"
                :class="{ active: rejectModal.reason === r }"
                @click="rejectModal.reason = r"
              >
                {{ r }}
              </button>
            </div>

            <div class="form-group">
              <label class="form-label">Custom reason (optional)</label>
              <input
                v-model="rejectModal.reason"
                class="form-input"
                type="text"
                placeholder="e.g. Temporarily out of stock…"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="rejectModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="rejectModal.saving" @click="rejectOrder">
              {{ rejectModal.saving ? 'Rejecting…' : 'Reject Order' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  Volume2,
  VolumeX,
  Clock,
  Flame,
  CheckCircle,
  AlertCircle,
  ChefHat,
  CheckCircle2,
  MessageSquare,
  X,
  XCircle,
  BellRing,
} from 'lucide-vue-next'

const authStore = useAuthStore()

const loading = ref(true)
const isConnected = ref(false)
const audioEnabled = ref(true)
const activeTab = ref('pending')
const orders = ref([])
const menuItemMap = ref({})
const tableMap = ref({})
const tick = ref(0)

let channel = null
let tickTimer = null

// ── Toast ──────────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success', icon: CheckCircle })
let toastTimer = null

function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    info: BellRing,
    warning: AlertCircle,
  }
  toast.value = { show: true, message, type, icon: iconMap[type] ?? CheckCircle }
  toastTimer = setTimeout(() => (toast.value.show = false), 3500)
}

// ── Audio Ding (Web Audio API — no external file needed) ───────────────────────
let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playDing() {
  if (!audioEnabled.value) return
  try {
    const ctx = getAudioCtx()
    // Two-tone ding: high note then lower note
    const tones = [
      { freq: 1046, start: 0, duration: 0.18 },
      { freq: 784, start: 0.22, duration: 0.3 },
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
      gain.gain.linearRampToValueAtTime(0.45, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
      osc.start(t)
      osc.stop(t + duration + 0.05)
    })
  } catch (e) {
    console.warn('Audio ding failed:', e)
  }
}

// ── Computed ───────────────────────────────────────────────────────────────────
const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
)

const tabs = computed(() => [
  {
    key: 'pending',
    label: 'Pending',
    count: orders.value.filter((o) => o.status === 'pending').length,
    icon: Clock,
  },
  {
    key: 'cooking',
    label: 'Cooking',
    count: orders.value.filter((o) => o.status === 'cooking').length,
    icon: Flame,
  },
  {
    key: 'done',
    label: 'Done',
    count: orders.value.filter((o) => ['ready', 'paid', 'rejected'].includes(o.status)).length,
    icon: CheckCircle,
  },
])

const visibleOrders = computed(() => {
  void tick.value
  const filtered = orders.value.filter((o) => {
    if (activeTab.value === 'pending') return o.status === 'pending'
    if (activeTab.value === 'cooking') return o.status === 'cooking'
    return ['ready', 'paid', 'rejected'].includes(o.status)
  })
  return activeTab.value === 'done'
    ? filtered.sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at),
      )
    : filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const emptyStateIcon = computed(() => {
  if (activeTab.value === 'pending') return AlertCircle
  if (activeTab.value === 'cooking') return ChefHat
  return CheckCircle2
})

const emptyTitle = computed(() => {
  if (activeTab.value === 'pending') return 'No pending orders'
  if (activeTab.value === 'cooking') return 'No orders in progress'
  return 'No completed orders today'
})

const emptyMessage = computed(() => {
  if (activeTab.value === 'pending') return 'New orders will appear here automatically.'
  if (activeTab.value === 'cooking') return 'Accept orders to start preparing them.'
  return 'Finished or rejected orders will show here.'
})

// ── Reject modal ───────────────────────────────────────────────────────────────
const rejectModal = ref({ open: false, order: null, reason: '', saving: false })

const rejectReasons = [
  'Item out of stock',
  'Kitchen too busy',
  'Ingredient unavailable',
  'Duplicate order',
  'Customer requested cancel',
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function elapsedMinutes(order) {
  return Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
}

function elapsedLabel(order) {
  const m = elapsedMinutes(order)
  if (m < 1) return 'just now'
  if (m === 1) return '1 min'
  return `${m} min`
}

// ── Actions ────────────────────────────────────────────────────────────────────
async function acceptOrder(order) {
  const { error } = await updateOrderStatus(order.id, 'cooking')
  if (!error) showToast(`Order ${order.id.slice(-4).toUpperCase()} accepted — now cooking!`, 'info')
  else showToast('Failed to accept order.', 'error')
}

async function markReady(order) {
  const { error } = await updateOrderStatus(order.id, 'ready')
  if (!error) showToast(`Order ${order.id.slice(-4).toUpperCase()} is ready for pickup!`, 'success')
  else showToast('Failed to mark order as ready.', 'error')
}

function openRejectModal(order) {
  rejectModal.value = { open: true, order, reason: '', saving: false }
}

async function rejectOrder() {
  const m = rejectModal.value
  m.saving = true
  const { error } = await updateOrderStatus(m.order.id, 'rejected', m.reason.trim() || null)
  if (!error) showToast(`Order ${m.order.id.slice(-4).toUpperCase()} rejected.`, 'error')
  else showToast('Failed to reject order.', 'error')
  m.open = false
  m.saving = false
}

async function updateOrderStatus(orderId, status, rejectionReason = null) {
  const payload = { status, updated_at: new Date().toISOString() }
  if (rejectionReason) payload.rejection_reason = rejectionReason

  const result = await supabase.from('orders').update(payload).eq('id', orderId)

  if (!result.error) {
    const order = orders.value.find((o) => o.id === orderId)
    if (order) {
      order.status = status
      if (rejectionReason) order.rejection_reason = rejectionReason
    }
  }
  return result
}

// ── Lifecycle & Realtime ───────────────────────────────────────────────────────
onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  const { data: tables } = await supabase
    .from('tables')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
  tables?.forEach((t) => {
    tableMap.value[t.id] = t.name
  })

  const { data: items } = await supabase
    .from('menu_items')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
  items?.forEach((i) => {
    menuItemMap.value[i.id] = i.name
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: raw } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  orders.value = (raw || []).map(enrichOrder)
  loading.value = false

  channel = supabase
    .channel(`kitchen-orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', payload.new.id)

        const enriched = enrichOrder({
          ...payload.new,
          order_items: orderItems || [],
          _isNew: true,
        })
        orders.value.unshift(enriched)

        // Ding + toast for new order
        playDing()
        activeTab.value = 'pending'
        showToast('New order received!', 'info')

        setTimeout(() => {
          const o = orders.value.find((o) => o.id === enriched.id)
          if (o) o._isNew = false
        }, 4000)
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        const idx = orders.value.findIndex((o) => o.id === payload.new.id)
        if (idx !== -1) Object.assign(orders.value[idx], payload.new)
      },
    )
    .subscribe((status) => {
      isConnected.value = status === 'SUBSCRIBED'
    })

  tickTimer = setInterval(() => {
    tick.value++
  }, 20000)
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
  if (tickTimer) clearInterval(tickTimer)
  if (audioCtx) audioCtx.close()
  if (toastTimer) clearTimeout(toastTimer)
})

function enrichOrder(raw) {
  return {
    ...raw,
    _tableName: tableMap.value[raw.table_id] || 'Table ?',
    _items: (raw.order_items || []).map((item) => ({
      ...item,
      _name: menuItemMap.value[item.menu_item_id] || 'Unknown item',
    })),
    _isNew: raw._isNew ?? false,
  }
}
</script>

<style scoped>
/* ── Toast ───────────────────────────────────────────────── */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  pointer-events: none;
  font-family: var(--font-body);
}
.toast--success {
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.35);
  color: #4ade80;
}
.toast--error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
}
.toast--info {
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.35);
  color: #c8733a;
}
.toast--warning {
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.35);
  color: #facc15;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-14px) scale(0.94);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.94);
}

/* ── Everything below is unchanged from your original ────── */
.kitchen-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

.kitchen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-surface);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-text-muted);
  transition: all 0.3s;
}

.status-dot.connected {
  background: #4ade80;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.date-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.14s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--color-accent-muted);
  color: var(--color-accent);
  border-color: var(--color-accent-border);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px 24px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle);
}

.stat-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.16s ease;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
}

.stat-card.active {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border-strong);
}

.stat-icon {
  stroke-width: 2;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-count {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.orders-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  stroke-width: 1.5;
  color: var(--color-text-faint);
}

.empty-text {
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 360px;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.order-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all 0.18s;
}

.order-card.is-new {
  animation: new-order-glow 4s ease-out;
  border-color: var(--color-accent);
}

@keyframes new-order-glow {
  0% {
    box-shadow: 0 0 25px var(--color-accent-muted);
  }
  100% {
    box-shadow: var(--shadow-card);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.table-badge {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: 15px;
  padding: 4px 12px;
  border-radius: 8px;
}

.order-id {
  font-size: 12px;
  color: var(--color-text-muted);
}

.timer {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.timer.overdue {
  color: #ef4444;
  font-weight: 700;
}

.card-items {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 15px;
}

.item-qty {
  color: var(--color-accent);
  font-weight: 700;
  min-width: 24px;
}

.item-name {
  flex: 1;
  color: var(--color-text-primary);
}

.item-note {
  color: var(--color-text-muted);
  font-size: 13px;
}

.order-notes {
  margin: 0 16px 12px;
  padding: 8px 12px;
  background: var(--color-accent-muted);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.card-actions {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-accept,
.btn-ready {
  flex: 1;
  padding: 10px 16px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  transition: all 0.14s;
}

.btn-accept {
  background: var(--color-accent);
  color: white;
}

.btn-accept:hover {
  background: var(--color-accent-hover);
}

.btn-ready {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.btn-ready:hover {
  background: rgba(74, 222, 128, 0.25);
}

.btn-reject {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
}

.btn-reject:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.status-indicator {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  padding: 10px;
  border-radius: var(--radius-pill);
}

.ready {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--color-bg-surface);
  border-radius: var(--radius-panel);
  width: 100%;
  max-width: 460px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-float);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 24px;
}

.reject-info {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.reason-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.chip {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.14s;
}

.chip:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.chip.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 15px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
}

.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Responsive */
@media (max-width: 768px) {
  .kitchen-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .stat-cards {
    grid-template-columns: 1fr;
  }
  .orders-grid {
    grid-template-columns: 1fr;
  }
  .card-actions {
    flex-direction: column;
    gap: 10px;
  }
  .btn-accept,
  .btn-ready {
    width: 100%;
  }
}
</style>
