<template>
  <div class="kitchen-page">
    <!-- ── Header ─────────────────────────── -->
    <div class="kitchen-header">
      <div class="header-left">
        <h1 class="kitchen-title">Kitchen</h1>
        <div class="live-dot-wrap">
          <span class="live-dot" :class="{ connected: isConnected }" />
          <span class="live-label">{{ isConnected ? 'Live' : 'Reconnecting…' }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="date-label">{{ todayLabel }}</div>
        <button
          class="audio-btn"
          @click="toggleAudio"
          :title="audioEnabled ? 'Mute pings' : 'Enable pings'"
        >
          {{ audioEnabled ? '🔔' : '🔕' }}
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
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count" :class="{ urgent: tab.key === 'pending' }">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- ── Content ────────────────────────── -->
    <div class="orders-area">
      <!-- Loading -->
      <div v-if="loading" class="state-center">
        <div class="spinner" />
        <span>Loading orders…</span>
      </div>

      <!-- Empty per tab -->
      <div v-else-if="visibleOrders.length === 0" class="state-center">
        <div class="empty-icon">
          {{ activeTab === 'pending' ? '⏳' : activeTab === 'cooking' ? '👨‍🍳' : '✅' }}
        </div>
        <p class="empty-text">{{ emptyText }}</p>
      </div>

      <!-- Orders grid -->
      <div v-else class="orders-grid">
        <div
          v-for="order in visibleOrders"
          :key="order.id"
          class="order-card"
          :class="[`status-${order.status}`, { 'is-new': order._isNew }]"
        >
          <!-- Card header -->
          <div class="card-header">
            <div class="card-header-left">
              <span class="table-name">{{ order._tableName }}</span>
              <span class="order-num">#{{ order.id.slice(-4).toUpperCase() }}</span>
            </div>
            <div class="card-header-right">
              <span class="elapsed" :class="{ overdue: elapsedMinutes(order) >= 15 }">
                {{ elapsedLabel(order) }}
              </span>
            </div>
          </div>

          <!-- Items -->
          <div class="card-items">
            <div v-for="item in order._items" :key="item.id" class="card-item">
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-name">{{ item._name }}</span>
              <span v-if="item.notes" class="item-note">{{ item.notes }}</span>
            </div>
          </div>

          <!-- Order notes -->
          <div v-if="order.notes" class="card-notes">📝 {{ order.notes }}</div>

          <!-- Actions -->
          <div class="card-actions">
            <!-- Pending: Accept + Reject -->
            <template v-if="order.status === 'pending'">
              <button class="btn-reject" @click="openReject(order)">Reject</button>
              <button class="btn-accept" @click="updateStatus(order, 'cooking')">Accept →</button>
            </template>

            <!-- Cooking: Mark Ready -->
            <template v-else-if="order.status === 'cooking'">
              <div class="cooking-indicator">
                <span class="cooking-dot" />
                Cooking…
              </div>
              <button class="btn-ready" @click="updateStatus(order, 'ready')">Mark Ready ✓</button>
            </template>

            <!-- Ready -->
            <template v-else-if="order.status === 'ready'">
              <div class="ready-badge">✅ Ready for pickup</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ REJECT MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="rejectModal.open" class="modal-backdrop" @click.self="rejectModal.open = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Reject Order?</h2>
            <button class="modal-close" @click="rejectModal.open = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="reject-sub">Let the customer know why their order was rejected.</p>
            <div class="reason-chips">
              <button
                v-for="r in rejectReasons"
                :key="r"
                class="reason-chip"
                :class="{ active: rejectModal.reason === r }"
                @click="rejectModal.reason = r"
                type="button"
              >
                {{ r }}
              </button>
            </div>
            <div class="field-group">
              <label class="field-label"
                >Custom reason <span class="optional">(optional)</span></label
              >
              <input
                v-model="rejectModal.reason"
                type="text"
                class="field-input"
                placeholder="e.g. Item temporarily unavailable…"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="rejectModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="rejectModal.saving" @click="doReject">
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

const authStore = useAuthStore()

const loading = ref(true)
const isConnected = ref(false)
const activeTab = ref('pending')
const audioEnabled = ref(true)
const orders = ref([]) // all today's orders
const menuItemMap = ref({}) // itemId → name
const tableMap = ref({}) // tableId → name
let realtimeChannel = null
let tickInterval = null
const tick = ref(0) // forces elapsed time to recompute every 30s

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
)

const tabs = computed(() => [
  {
    key: 'pending',
    label: 'Pending',
    count: orders.value.filter((o) => o.status === 'pending').length,
  },
  {
    key: 'cooking',
    label: 'Cooking',
    count: orders.value.filter((o) => o.status === 'cooking').length,
  },
  {
    key: 'done',
    label: 'Done',
    count: orders.value.filter((o) => ['ready', 'paid', 'rejected'].includes(o.status)).length,
  },
])

const visibleOrders = computed(() => {
  void tick.value
  if (activeTab.value === 'pending')
    return orders.value.filter((o) => o.status === 'pending').sort(byTime)
  if (activeTab.value === 'cooking')
    return orders.value.filter((o) => o.status === 'cooking').sort(byTime)
  return orders.value
    .filter((o) => ['ready', 'paid', 'rejected'].includes(o.status))
    .sort(byTimeDesc)
})

const emptyText = computed(() => {
  if (activeTab.value === 'pending') return 'No pending orders — all clear!'
  if (activeTab.value === 'cooking') return 'Nothing cooking right now.'
  return 'No completed orders yet today.'
})

function byTime(a, b) {
  return new Date(a.created_at) - new Date(b.created_at)
}
function byTimeDesc(a, b) {
  return new Date(b.created_at) - new Date(a.created_at)
}

function elapsedMinutes(order) {
  return Math.floor((Date.now() - new Date(order.created_at)) / 60000)
}
function elapsedLabel(order) {
  const m = elapsedMinutes(order)
  if (m < 1) return 'Just now'
  if (m === 1) return '1 min ago'
  return `${m} min ago`
}

// ── Audio ping ───────────────────────────────
function toggleAudio() {
  audioEnabled.value = !audioEnabled.value
}

function playPing() {
  if (!audioEnabled.value) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch (e) {
    /* browser may block without user gesture */
  }
}

// ── Reject modal ─────────────────────────────
const rejectModal = ref({ open: false, order: null, reason: '', saving: false })
const rejectReasons = [
  'Kitchen is closing',
  'Item out of stock',
  'Too busy right now',
  'Duplicate order',
]

function openReject(order) {
  rejectModal.value = { open: true, order, reason: '', saving: false }
}

async function doReject() {
  const m = rejectModal.value
  m.saving = true
  await updateStatus(m.order, 'rejected', m.reason)
  rejectModal.value.open = false
  m.saving = false
}

// ── Status update ─────────────────────────────
async function updateStatus(order, status, reason = null) {
  const update = { status, updated_at: new Date().toISOString() }
  if (reason) update.rejection_reason = reason

  const { error } = await supabase.from('orders').update(update).eq('id', order.id)
  if (!error) {
    const o = orders.value.find((o) => o.id === order.id)
    if (o) {
      o.status = status
      if (reason) o.rejection_reason = reason
    }
  }
}

// ── Load ─────────────────────────────────────
onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  // Load tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
  tables?.forEach((t) => {
    tableMap.value[t.id] = t.name
  })

  // Load menu items
  const { data: items } = await supabase
    .from('menu_items')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
  items?.forEach((i) => {
    menuItemMap.value[i.id] = i.name
  })

  // Load today's orders
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false })

  orders.value = (rawOrders || []).map((o) => enrichOrder(o))
  loading.value = false

  // Realtime subscription
  realtimeChannel = supabase
    .channel(`kitchen-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        // Fetch order_items for the new order
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
        activeTab.value = 'pending'
        playPing()

        // Remove "new" highlight after 3s
        setTimeout(() => {
          const o = orders.value.find((o) => o.id === enriched.id)
          if (o) o._isNew = false
        }, 3000)
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
        const o = orders.value.find((o) => o.id === payload.new.id)
        if (o)
          Object.assign(o, {
            status: payload.new.status,
            rejection_reason: payload.new.rejection_reason,
          })
      },
    )
    .subscribe((status) => {
      isConnected.value = status === 'SUBSCRIBED'
    })

  // Tick every 30s to update elapsed times
  tickInterval = setInterval(() => {
    tick.value++
  }, 30000)
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  if (tickInterval) clearInterval(tickInterval)
})

function enrichOrder(raw) {
  return {
    ...raw,
    _isNew: raw._isNew || false,
    _tableName: tableMap.value[raw.table_id] || 'Unknown table',
    _items: (raw.order_items || []).map((i) => ({
      ...i,
      _name: menuItemMap.value[i.menu_item_id] || 'Item',
    })),
  }
}
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
}

/* Header */
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
  transition: background 0.3s;
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
  font-size: 13px;
  color: #555;
}
.audio-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
}
.audio-btn:hover {
  background: rgba(255, 255, 255, 0.07);
}

/* Tabs */
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
  gap: 8px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
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

/* Orders area */
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
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #333;
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-icon {
  font-size: 42px;
}
.empty-text {
  font-size: 15px;
  color: #444;
}

/* Orders grid */
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
.order-card.is-new {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.2);
  animation: newOrder 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes newOrder {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
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

/* Card notes */
.card-notes {
  margin: 0 16px 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12.5px;
  color: #666;
  border-left: 2px solid #444;
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
  padding: 8px 16px;
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
  text-align: center;
  font-size: 13.5px;
  font-weight: 700;
  color: #4ade80;
}

/* Reject modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.modal {
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.modal-title {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 700;
  color: #f0ece5;
}
.modal-close {
  background: none;
  border: none;
  color: #555;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #aaa;
}
.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.reject-sub {
  font-size: 13.5px;
  color: #666;
  line-height: 1.5;
}

.reason-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.reason-chip {
  padding: 5px 12px;
  border-radius: 99px;
  border: 1.5px solid #333;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  background: #1a1a1a;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.reason-chip:hover {
  border-color: #c8733a;
  color: #c8733a;
}
.reason-chip.active {
  border-color: #c8733a;
  background: rgba(200, 115, 58, 0.12);
  color: #e8935a;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}
.btn-ghost {
  padding: 9px 18px;
  background: transparent;
  color: #666;
  border: 1.5px solid #333;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: #555;
  color: #aaa;
}
.btn-danger {
  padding: 9px 18px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Fields */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #888;
}
.optional {
  font-weight: 400;
  color: #444;
}
.field-input {
  width: 100%;
  padding: 9px 13px;
  border: 1.5px solid #2a2a2a;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: #f0ece5;
  background: #161616;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.field-input:focus {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
}

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
