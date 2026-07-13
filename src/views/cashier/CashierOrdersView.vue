<template>
  <div class="view-page">
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">{{ $t('cashier.orders.title') }}</h1>
        <p class="view-subtitle">{{ $t('cashier.orders.subtitle') }}</p>
      </div>
      <div class="revenue-card">
        <div class="revenue-icon-wrap">
          <TrendingUp class="revenue-icon" />
        </div>
        <div class="revenue-info">
          <span class="revenue-label">{{ $t('cashier.orders.todayRevenue') }}</span>
          <span class="revenue-value">{{ formatCurrency(todayRevenue) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="orders.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <Banknote class="empty-icon" />
      </div>
      <h3 class="empty-title">{{ $t('cashier.orders.emptyTitle') }}</h3>
      <p class="empty-subtitle">{{ $t('cashier.orders.emptySubtitle') }}</p>
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
              <span class="table-name">{{ order.tables?.name ?? $t('cashier.orders.unknownTable') }}</span>
              <span class="order-meta">
                <Clock class="meta-icon" />
                {{ formatTime(order.created_at) }}
                <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
              </span>
            </div>
          </div>
          <div class="order-total-wrap">
            <span class="total-label">{{ $t('cashier.orders.total') }}</span>
            <span class="total-value">{{ formatCurrency(orderTotal(order)) }}</span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items">
          <div v-for="item in order.order_items" :key="item.id" class="item-row">
            <div class="item-main">
              <span class="item-qty">{{ item.quantity }}×</span>
              <div class="item-details">
                <span class="item-name">{{ item.menu_items?.name ?? $t('cashier.orders.unknownItem') }}</span>
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
              {{ order.order_items?.length || 0 }} {{ $t('cashier.orders.items') }}
            </span>
          </div>
          <button class="btn-paid" @click="openReceiptModal(order)">
            <CheckCircle2 class="btn-icon" />
            {{ $t('cashier.orders.markAsPaid') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Receipt Preview Modal ── -->
    <Teleport to="body">
      <div v-if="receiptModal.open" class="modal-backdrop" @click.self="receiptModal.open = false">
        <div class="modal">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-left">
              <Receipt class="modal-header-icon" />
              <div>
                <h2 class="modal-title">{{ $t('cashier.orders.receiptTitle') }}</h2>
                <p class="modal-subtitle">{{ $t('cashier.orders.receiptSubtitle') }}</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="receiptModal.open = false">×</button>
          </div>

          <!-- Receipt Preview -->
          <div class="modal-body">
            <div class="receipt-preview" ref="receiptRef">
              <!-- Receipt Header -->
              <div class="receipt-header">
                <div class="receipt-restaurant">{{ restaurantName }}</div>
                <div class="receipt-tagline">{{ $t('cashier.orders.receiptThanks') }}</div>
                <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>
              </div>

              <!-- Receipt Meta -->
              <div class="receipt-meta">
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('cashier.orders.receiptTable') }}</span>
                  <span class="receipt-meta-value">{{
                    receiptModal.order?.tables?.name ?? '—'
                  }}</span>
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('cashier.orders.receiptOrderId') }}</span>
                  <span class="receipt-meta-value receipt-mono"
                    >#{{ receiptModal.order?.id.slice(-6).toUpperCase() }}</span
                  >
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('cashier.orders.receiptDate') }}</span>
                  <span class="receipt-meta-value">{{
                    formatDate(receiptModal.order?.created_at)
                  }}</span>
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('cashier.orders.receiptTime') }}</span>
                  <span class="receipt-meta-value">{{
                    formatTime(receiptModal.order?.created_at)
                  }}</span>
                </div>
              </div>

              <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>

              <!-- Items -->
              <div class="receipt-items">
                <div
                  v-for="item in receiptModal.order?.order_items"
                  :key="item.id"
                  class="receipt-item"
                >
                  <div class="receipt-item-left">
                    <span class="receipt-item-qty">{{ item.quantity }}×</span>
                    <span class="receipt-item-name">{{ item.menu_items?.name ?? $t('cashier.orders.receiptItemFallback') }}</span>
                  </div>
                  <span class="receipt-item-price">{{
                    formatCurrency(item.unit_price * item.quantity)
                  }}</span>
                </div>
              </div>

              <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>

              <!-- Total -->
              <div class="receipt-total-row">
                <span class="receipt-total-label">{{ $t('cashier.orders.receiptTotal') }}</span>
                <span class="receipt-total-value">{{
                  formatCurrency(orderTotal(receiptModal.order))
                }}</span>
              </div>

              <!-- Footer -->
              <div class="receipt-footer">
                <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>
                <div class="receipt-thanks">{{ $t('cashier.orders.receiptFooter') }}</div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button class="btn-ghost" @click="receiptModal.open = false">{{ $t('cashier.orders.cancel') }}</button>
            <div class="download-group">
              <button class="btn-download-png" @click="downloadPng" :disabled="receiptModal.saving">
                <ImageIcon class="btn-icon-sm" />
                {{ $t('cashier.orders.downloadPng') }}
              </button>
              <button class="btn-download-pdf" @click="downloadPdf" :disabled="receiptModal.saving">
                <FileText class="btn-icon-sm" />
                {{ $t('cashier.orders.downloadPdf') }}
              </button>
            </div>
            <button class="btn-confirm-paid" @click="confirmPaid" :disabled="receiptModal.saving">
              <CheckCircle2 class="btn-icon-sm" />
              {{ receiptModal.saving ? $t('cashier.orders.processing') : $t('cashier.orders.confirmPaid') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Toast Notifications ── -->
    <Teleport to="body">
      <div class="toast-container">
        <TransitionGroup name="toast">
          <div v-for="toast in toasts" :key="toast.id" class="toast" @click="removeToast(toast.id)">
            <div class="toast-icon-wrap">
              <ShoppingBag class="toast-icon" />
            </div>
            <div class="toast-content">
              <span class="toast-title">{{ $t('cashier.orders.toastNewOrder') }}</span>
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
import { useI18n } from 'vue-i18n'
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
  Receipt,
  ImageIcon,
  FileText,
  ShoppingBag,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const { t } = useI18n()
const orders = ref([])
const todayRevenue = ref(0)
const restaurantName = ref(t('cashier.orders.defaultRestaurant'))
const receiptRef = ref(null)
const toasts = ref([])
let channel = null
let knownOrderIds = new Set()
let toastIdCounter = 0

const receiptModal = ref({
  open: false,
  order: null,
  saving: false,
  downloaded: false,
})

// ── Cash Register Sound (Web Audio API) ─────────

function playCashRegisterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Helper: schedule a short tone burst
    const playTone = (frequency, startTime, duration, gainPeak = 0.4) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(frequency, startTime)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration + 0.05)
    }

    // Helper: white noise burst (drawer slam)
    const playNoise = (startTime, duration, gainPeak = 0.25) => {
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 800
      filter.Q.value = 0.8
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(gainPeak, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      source.start(startTime)
      source.stop(startTime + duration + 0.05)
    }

    const t = ctx.currentTime

    // "Ka" — mechanical key press: noise burst + low thud
    playNoise(t, 0.06, 0.3)
    playTone(180, t, 0.07, 0.15)

    // "Ching" — register bell: bright high tone
    playTone(2200, t + 0.05, 0.35, 0.35)
    playTone(2800, t + 0.07, 0.25, 0.2)
    playTone(1800, t + 0.09, 0.3, 0.15)

    // Drawer slide — mid noise
    playNoise(t + 0.12, 0.18, 0.15)

    // Drawer thud — low noise at end
    playNoise(t + 0.28, 0.1, 0.35)
    playTone(120, t + 0.28, 0.12, 0.2)

    // Auto-close context after sound is done
    setTimeout(() => ctx.close(), 800)
  } catch (e) {
    // Silently fail if audio context is unavailable
    console.warn('Audio playback failed:', e)
  }
}

// ── Toast System ─────────────────────────────────

function addToast(message, duration = 4000) {
  const id = ++toastIdCounter
  toasts.value.push({ id, message, duration })
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

// ── Helpers ──────────────────────────────────────

function orderTotal(order) {
  return order?.order_items?.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0
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

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Data Fetching ────────────────────────────────

async function fetchOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })

  if (data) {
    // Detect genuinely new orders (not on first load)
    if (knownOrderIds.size > 0) {
      const newOrders = data.filter((o) => !knownOrderIds.has(o.id))
      newOrders.forEach((o) => {
        const tableName = o.tables?.name ?? t('cashier.orders.unknownTable')
        const itemCount = o.order_items?.length ?? 0
        const itemLabel = itemCount !== 1 ? t('cashier.orders.items') : 'item'
        addToast(`${tableName} · ${itemCount} ${itemLabel}`)
        playCashRegisterSound()
      })
    }

    // Update known IDs
    knownOrderIds = new Set(data.map((o) => o.id))
    orders.value = data
  }
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

async function fetchRestaurantName() {
  if (!authStore.profile?.restaurant_id) return
  const { data } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', authStore.profile.restaurant_id)
    .single()
  if (data?.name) restaurantName.value = data.name
}

// ── Receipt Modal ────────────────────────────────

function openReceiptModal(order) {
  receiptModal.value = { open: true, order, saving: false, downloaded: false }
}

async function confirmPaid() {
  if (!receiptModal.value.downloaded) {
    await downloadPng()
  }

  receiptModal.value.saving = true
  const order = receiptModal.value.order
  const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)
  if (!error) {
    orders.value = orders.value.filter((o) => o.id !== order.id)
  }
  receiptModal.value.open = false
  receiptModal.value.saving = false
}

// ── PNG Download (Canvas) ────────────────────────

async function downloadPng() {
  const order = receiptModal.value.order
  const canvas = drawReceiptToCanvas(order)
  const a = document.createElement('a')
  a.download = `receipt-${order.id.slice(-6).toUpperCase()}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
  receiptModal.value.downloaded = true
}

function drawReceiptToCanvas(order) {
  const W = 480
  const padding = 40
  const lineH = 28
  const items = order.order_items || []

  const totalH = 80 + 24 + 20 + 24 * 4 + 20 + items.length * lineH + 20 + 44 + 60

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = totalH

  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, totalH)

  let y = 40

  ctx.fillStyle = '#111827'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(restaurantName.value, W / 2, y)
  y += 28

  ctx.fillStyle = '#6b7280'
  ctx.font = '13px sans-serif'
  ctx.fillText(t('cashier.orders.receiptThanks'), W / 2, y)
  y += 24

  ctx.fillStyle = '#d1d5db'
  ctx.fillText('· · · · · · · · · · · · · · · · · ·', W / 2, y)
  y += 24

  const meta = [
    [t('cashier.orders.receiptTable'), order.tables?.name ?? '—'],
    [t('cashier.orders.receiptOrderId'), `#${order.id.slice(-6).toUpperCase()}`],
    [t('cashier.orders.receiptDate'), formatDate(order.created_at)],
    [t('cashier.orders.receiptTime'), formatTime(order.created_at)],
  ]
  ctx.textAlign = 'left'
  for (const [label, value] of meta) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '13px sans-serif'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = '#111827'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(value, W - padding, y)
    ctx.textAlign = 'left'
    y += 24
  }

  ctx.fillStyle = '#d1d5db'
  ctx.textAlign = 'center'
  ctx.fillText('· · · · · · · · · · · · · · · · · ·', W / 2, y)
  y += 24

  for (const item of items) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
    const label = `${item.quantity}× ${item.menu_items?.name ?? t('cashier.orders.receiptItemFallback')}`
    ctx.fillText(label, padding, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#111827'
    ctx.fillText(formatCurrency(item.unit_price * item.quantity), W - padding, y)
    y += lineH
  }

  ctx.fillStyle = '#d1d5db'
  ctx.textAlign = 'center'
  ctx.fillText('· · · · · · · · · · · · · · · · · ·', W / 2, y)
  y += 28

  ctx.textAlign = 'left'
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(t('cashier.orders.receiptTotal'), padding, y)
  ctx.textAlign = 'right'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(formatCurrency(orderTotal(order)), W - padding, y)
  y += 36

  ctx.fillStyle = '#d1d5db'
  ctx.textAlign = 'center'
  ctx.font = '13px sans-serif'
  ctx.fillText('· · · · · · · · · · · · · · · · · ·', W / 2, y)
  y += 20
  ctx.fillStyle = '#9ca3af'
  ctx.fillText(t('cashier.orders.receiptFooter'), W / 2, y)

  return canvas
}

// ── PDF Download (Print Window) ──────────────────

function downloadPdf() {
  const order = receiptModal.value.order
  receiptModal.value.downloaded = true
  const items = order.order_items || []

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td class="item-qty">${item.quantity}×</td>
        <td class="item-name">${item.menu_items?.name ?? t('cashier.orders.receiptItemFallback')}</td>
        <td class="item-price">${formatCurrency(item.unit_price * item.quantity)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - #${order.id.slice(-6).toUpperCase()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #fff;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
      color: #111827;
    }
    .receipt {
      width: 320px;
      padding: 32px 28px;
      border: 1px dashed #d1d5db;
      border-radius: 8px;
    }
    .restaurant {
      font-size: 20px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 6px;
    }
    .tagline {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 16px;
    }
    .divider {
      text-align: center;
      color: #d1d5db;
      font-size: 12px;
      letter-spacing: 2px;
      margin: 12px 0;
    }
    .meta-table {
      width: 100%;
      font-size: 13px;
      border-collapse: collapse;
    }
    .meta-table td { padding: 3px 0; }
    .meta-table .label { color: #6b7280; }
    .meta-table .value { text-align: right; font-weight: 500; }
    .items-table {
      width: 100%;
      font-size: 13px;
      border-collapse: collapse;
    }
    .items-table td { padding: 5px 0; vertical-align: top; }
    .item-qty { width: 28px; color: #6b7280; }
    .item-name { flex: 1; }
    .item-price { text-align: right; font-weight: 500; white-space: nowrap; }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      padding-top: 4px;
    }
    .total-label { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; }
    .total-value { font-size: 20px; font-weight: 700; }
    .footer-thanks {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }
    @media print {
      body { padding: 0; }
      .receipt { border: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="restaurant">${restaurantName.value}</div>
    <div class="tagline">${t('cashier.orders.receiptThanks')}</div>
    <div class="divider">· · · · · · · · · · · · ·</div>

    <table class="meta-table">
      <tr><td class="label">${t('cashier.orders.receiptTable')}</td><td class="value">${order.tables?.name ?? '—'}</td></tr>
      <tr><td class="label">${t('cashier.orders.receiptOrderId')}</td><td class="value">#${order.id.slice(-6).toUpperCase()}</td></tr>
      <tr><td class="label">${t('cashier.orders.receiptDate')}</td><td class="value">${formatDate(order.created_at)}</td></tr>
      <tr><td class="label">${t('cashier.orders.receiptTime')}</td><td class="value">${formatTime(order.created_at)}</td></tr>
    </table>

    <div class="divider">· · · · · · · · · · · · ·</div>

    <table class="items-table">
      ${itemRows}
    </table>

    <div class="divider">· · · · · · · · · · · · ·</div>

    <div class="total-row">
      <span class="total-label">${t('cashier.orders.receiptTotal')}</span>
      <span class="total-value">${formatCurrency(orderTotal(order))}</span>
    </div>

    <div class="divider">· · · · · · · · · · · · ·</div>
    <div class="footer-thanks">${t('cashier.orders.receiptFooter')}</div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=480,height=700')
  win.document.write(html)
  win.document.close()
}

// ── Lifecycle ────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchTodayRevenue(), fetchRestaurantName()])

  // Seed known IDs from initial load — no sound/toast on mount
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'ready')
  if (data) knownOrderIds = new Set(data.map((o) => o.id))

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

/* ── Receipt Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
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
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  flex-shrink: 0;
}
.modal-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.modal-header-icon {
  width: 22px;
  height: 22px;
  color: var(--color-accent);
}
.modal-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
}
.modal-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.modal-close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 24px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.16s;
}
.modal-close-btn:hover {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}
.modal-body {
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
}

/* ── Receipt Preview ── */
.receipt-preview {
  background: #ffffff;
  color: #111827;
  width: 300px;
  padding: 28px 24px;
  border-radius: 10px;
  border: 1px dashed #d1d5db;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  font-family: 'DM Sans', sans-serif;
}
.receipt-header {
  text-align: center;
  margin-bottom: 4px;
}
.receipt-restaurant {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}
.receipt-tagline {
  font-size: 12px;
  color: #6b7280;
}
.receipt-divider {
  text-align: center;
  color: #d1d5db;
  font-size: 11px;
  letter-spacing: 3px;
  margin: 12px 0;
}
.receipt-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.receipt-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.receipt-meta-label {
  color: #6b7280;
}
.receipt-meta-value {
  color: #111827;
  font-weight: 500;
}
.receipt-mono {
  font-family: monospace;
  font-size: 12px;
}
.receipt-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.receipt-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
}
.receipt-item-left {
  display: flex;
  gap: 8px;
  flex: 1;
}
.receipt-item-qty {
  color: #6b7280;
  min-width: 24px;
}
.receipt-item-name {
  color: #374151;
  flex: 1;
}
.receipt-item-price {
  color: #111827;
  font-weight: 500;
  min-width: 70px;
  text-align: right;
}
.receipt-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.receipt-total-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #111827;
}
.receipt-total-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}
.receipt-footer {
  text-align: center;
}
.receipt-thanks {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* ── Modal Footer ── */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}
.download-group {
  display: flex;
  gap: 8px;
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.16s;
  font-family: inherit;
}
.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn-download-png,
.btn-download-pdf {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.16s;
  border: 1px solid var(--color-border-medium);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
}
.btn-download-png:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  color: #818cf8;
}
.btn-download-pdf:hover {
  background: rgba(200, 115, 58, 0.1);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}
.btn-download-png:disabled,
.btn-download-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-confirm-paid {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--color-status-success);
  color: #111827;
  border: none;
  border-radius: var(--radius-pill);
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.25);
}
.btn-confirm-paid:hover:not(:disabled) {
  background: #22c55e;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.35);
}
.btn-confirm-paid:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-icon-sm {
  width: 15px;
  height: 15px;
}

/* ── Toast Container ── */
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

/* ── Toast Card ── */
.toast {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-surface, #1e1e2e);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 14px;
  padding: 14px 16px;
  width: 300px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(74, 222, 128, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
}
.toast:hover {
  border-color: rgba(74, 222, 128, 0.5);
}
.toast-icon-wrap {
  width: 38px;
  height: 38px;
  background: rgba(74, 222, 128, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.toast-icon {
  width: 20px;
  height: 20px;
  color: #4ade80;
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
  color: #4ade80;
  letter-spacing: 0.01em;
}
.toast-body {
  font-size: 13px;
  color: var(--color-text-primary, #f3f4f6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast-close {
  background: none;
  border: none;
  color: var(--color-text-muted, #6b7280);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.toast-close:hover {
  color: var(--color-text-primary, #f3f4f6);
}

/* Progress bar that shrinks over toast duration */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
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

/* ── Toast Transition ── */
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
  .modal-footer {
    flex-direction: column;
  }
  .download-group {
    width: 100%;
  }
  .btn-download-png,
  .btn-download-pdf {
    flex: 1;
    justify-content: center;
  }
  .btn-confirm-paid {
    width: 100%;
    justify-content: center;
  }
  .btn-ghost {
    width: 100%;
    justify-content: center;
  }
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
