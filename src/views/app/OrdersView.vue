<template>
  <div class="orders-page">
    <!-- ── Header ──────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <p class="header-sub">{{ $t('orders.subtitle') }}</p>
        <h1 class="header-title">{{ $t('orders.title') }}</h1>
      </div>
      <div class="header-actions">
        <button
          class="btn-sound-toggle"
          :class="{ 'sound-off': !soundEnabled }"
          @click="soundEnabled = !soundEnabled"
          :title="soundEnabled ? $t('orders.muteAlerts') : $t('orders.unmuteAlerts')"
        >
          <svg
            v-if="soundEnabled"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          {{ soundEnabled ? $t('orders.soundOn') : $t('orders.soundOff') }}
        </button>
        <button v-if="isWaiter || isAdmin" class="btn-new-order" @click="openNewOrder">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {{ $t('orders.newOrder') }}
        </button>
      </div>
    </div>

    <!-- ── Filter Tabs ─────────────────────────────────── -->
    <div class="filter-tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="tab.value !== 'all' && countByStatus[tab.value]"
          class="tab-count"
          :class="`tab-count--${tab.value}`"
        >
          {{ countByStatus[tab.value] }}
        </span>
      </button>
    </div>

    <!-- ── Loading ─────────────────────────────────────── -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card" />
    </div>

    <!-- ── Empty ───────────────────────────────────────── -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        class="empty-icon"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
      <p>{{ $t('orders.noOrders') }}</p>
    </div>

    <!-- ── Orders Grid ─────────────────────────────────── -->
    <div v-else class="orders-grid">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="`card--${order.status}`"
      >
        <!-- Color stripe -->
        <div class="card-stripe" :class="`stripe--${order.status}`" />

        <!-- Card Header -->
        <div class="card-header">
          <div class="card-header-left">
            <div class="table-avatar">{{ (order.tables?.name || 'T').charAt(0) }}</div>
            <div>
              <p class="card-table">{{ order.tables?.name || $t('orders.unknownTable') }}</p>
              <p class="card-elapsed">{{ timeElapsed(order.created_at) }}</p>
            </div>
          </div>
          <span class="status-badge" :class="`status--${order.status}`">
            <span class="status-dot" />
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- Items -->
        <div class="card-items">
          <div v-for="item in order.order_items" :key="item.id" class="card-item">
            <span class="item-qty">×{{ item.quantity }}</span>
            <span class="item-name">{{ item.menu_items?.name }}</span>
            <span class="item-price">{{ formatCurrency(item.unit_price * item.quantity) }}</span>
          </div>
        </div>

        <!-- Note -->
        <div v-if="order.note" class="card-note">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {{ order.note }}
        </div>

        <!-- Total -->
        <div class="card-total">
          <span class="total-label">{{ $t('orders.total') }}</span>
          <span class="total-amount">{{ formatCurrency(orderTotal(order)) }}</span>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button
            v-if="(isCashier || isAdmin) && order.status === 'ready'"
            class="btn-action btn-paid"
            @click="openReceiptModal(order)"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ $t('orders.markAsPaid') }}
          </button>

          <button
            v-if="isWaiter && order.status === 'pending'"
            class="btn-action btn-cancel-order"
            @click="cancelOrder(order)"
          >
            {{ $t('orders.cancelOrder') }}
          </button>

          <p v-if="(isCashier || isAdmin) && order.status === 'pending'" class="card-waiting">
            <span class="waiting-dot" />
            {{ $t('orders.waitingForKitchen') }}
          </p>
          <p v-if="(isCashier || isAdmin) && order.status === 'cooking'" class="card-waiting">
            <span class="waiting-dot waiting-dot--cooking" />
            {{ $t('orders.kitchenCooking') }}
          </p>
          <p v-if="order.status === 'paid'" class="card-paid-label">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ $t('orders.paidLabel') }}
          </p>
        </div>
      </div>
    </div>

    <!-- ══ NEW ORDER MODAL ════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="showNewOrder" class="modal-overlay" @click.self="closeNewOrder">
        <div class="modal modal--lg">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('orders.newOrderTitle') }}</h2>
            <button class="modal-close" @click="closeNewOrder">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Table Select -->
            <div class="form-group">
              <label class="form-label">{{ $t('orders.tableLabel') }}</label>
              <select v-model="newOrder.tableId" class="form-input">
                <option value="" disabled>{{ $t('orders.selectTable') }}</option>
                <option v-for="t in tables" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>

            <!-- Menu -->
            <div v-if="menuCategories.length > 0">
              <div v-for="category in menuCategories" :key="category.id" class="menu-category">
                <p class="category-name">{{ category.name }}</p>
                <div class="menu-items-grid">
                  <div
                    v-for="item in category.menu_items"
                    :key="item.id"
                    class="menu-item"
                    :class="{
                      'item--in-cart': cartQty(item.id) > 0,
                      'item--unavailable': !item.is_available,
                    }"
                    @click="item.is_available && addToCart(item)"
                  >
                    <div class="menu-item-info">
                      <p class="menu-item-name">{{ item.name }}</p>
                      <p class="menu-item-price">{{ formatCurrency(item.price) }}</p>
                    </div>
                    <div class="menu-item-qty" v-if="cartQty(item.id) > 0">
                      <button class="qty-btn" @click.stop="removeFromCart(item.id)">−</button>
                      <span class="qty-num">{{ cartQty(item.id) }}</span>
                      <button class="qty-btn" @click.stop="addToCart(item)">+</button>
                    </div>
                    <div v-else-if="!item.is_available" class="sold-out">{{ $t('orders.soldOut') }}</div>
                    <div v-else class="add-hint">{{ $t('orders.addItem') }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div class="form-group">
              <label class="form-label">{{ $t('orders.orderNote') }} <span class="optional">{{ $t('common.optional') }}</span></label>
              <input
                v-model="newOrder.note"
                type="text"
                class="form-input"
                :placeholder="$t('orders.notePlaceholder')"
              />
            </div>

            <!-- Cart Summary -->
            <div v-if="cartItems.length > 0" class="cart-summary">
              <p class="cart-title">{{ $t('orders.orderSummary') }}</p>
              <div v-for="ci in cartItems" :key="ci.id" class="cart-row">
                <span>×{{ ci.quantity }} {{ ci.name }}</span>
                <span>{{ formatCurrency(ci.price * ci.quantity) }}</span>
              </div>
              <div class="cart-total-row">
                <span>{{ $t('orders.total') }}</span>
                <span class="cart-total-val">{{ formatCurrency(cartTotal) }}</span>
              </div>
            </div>

            <div v-if="newOrderError" class="error-alert">{{ newOrderError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeNewOrder" :disabled="submitting">{{ $t('common.cancel') }}</button>
            <button
              class="btn-submit"
              @click="submitOrder"
              :disabled="submitting || !newOrder.tableId || cartItems.length === 0"
            >
              <span v-if="submitting" class="spinner" />
              {{ submitting ? $t('orders.placing') : $t('orders.placeOrder', { total: formatCurrency(cartTotal) }) }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══ RECEIPT PREVIEW MODAL ══════════════════════════ -->
    <Teleport to="body">
      <div v-if="receiptModal.open" class="modal-overlay" @click.self="receiptModal.open = false">
        <div class="modal modal--receipt">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="receipt-modal-header-left">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="color: var(--color-accent, #c8733a)"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div>
                <h2 class="modal-title">{{ $t('orders.receiptTitle') }}</h2>
                <p class="receipt-modal-subtitle">{{ $t('orders.receiptSubtitle') }}</p>
              </div>
            </div>
            <button class="modal-close" @click="receiptModal.open = false">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Receipt Preview -->
          <div class="modal-body receipt-modal-body">
            <div class="receipt-preview">
              <div class="receipt-header">
                <div class="receipt-restaurant">{{ restaurantName }}</div>
                <div class="receipt-tagline">{{ $t('orders.receiptTagline') }}</div>
                <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>
              </div>

              <div class="receipt-meta">
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('orders.tableLabel') }}</span>
                  <span class="receipt-meta-value">{{
                    receiptModal.order?.tables?.name ?? '—'
                  }}</span>
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('orders.receiptOrderId') }}</span>
                  <span class="receipt-meta-value receipt-mono"
                    >#{{ receiptModal.order?.id.slice(-6).toUpperCase() }}</span
                  >
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('orders.receiptDate') }}</span>
                  <span class="receipt-meta-value">{{
                    formatDate(receiptModal.order?.created_at)
                  }}</span>
                </div>
                <div class="receipt-meta-row">
                  <span class="receipt-meta-label">{{ $t('orders.receiptTime') }}</span>
                  <span class="receipt-meta-value">{{
                    formatTimeHuman(receiptModal.order?.created_at)
                  }}</span>
                </div>
              </div>

              <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>

              <div class="receipt-items">
                <div
                  v-for="item in receiptModal.order?.order_items"
                  :key="item.id"
                  class="receipt-item"
                >
                  <div class="receipt-item-left">
                    <span class="receipt-item-qty">{{ item.quantity }}×</span>
                    <span class="receipt-item-name">{{ item.menu_items?.name ?? $t('orders.itemFallback') }}</span>
                  </div>
                  <span class="receipt-item-price">{{
                    formatCurrency(item.unit_price * item.quantity)
                  }}</span>
                </div>
              </div>

              <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>

              <div class="receipt-total-row">
                <span class="receipt-total-label">{{ $t('orders.receiptTotal') }}</span>
                <span class="receipt-total-value">{{
                  formatCurrency(orderTotal(receiptModal.order))
                }}</span>
              </div>

              <div class="receipt-footer">
                <div class="receipt-divider">· · · · · · · · · · · · · · ·</div>
                <div class="receipt-thanks">{{ $t('orders.receiptFooter') }}</div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer receipt-modal-footer">
            <button class="btn-ghost" @click="receiptModal.open = false">{{ $t('common.cancel') }}</button>
            <div class="download-group">
              <button class="btn-download-png" @click="downloadPng" :disabled="receiptModal.saving">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {{ $t('orders.downloadPng') }}
              </button>
              <button class="btn-download-pdf" @click="downloadPdf" :disabled="receiptModal.saving">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {{ $t('orders.downloadPdf') }}
              </button>
            </div>
            <button class="btn-confirm-paid" @click="confirmPaid" :disabled="receiptModal.saving">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ receiptModal.saving ? $t('orders.processing') : $t('orders.confirmPaid') }}
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div class="toast-content">
              <span class="toast-title">{{ $t('orders.newOrderReady') }}</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

// ─── Role Helpers ─────────────────────────────────────────────────────────────
const userRole = computed(() => authStore.profile?.role)
const isAdmin = computed(() => userRole.value === 'admin')
const isCashier = computed(() => userRole.value === 'cashier')
const isWaiter = computed(() => userRole.value === 'waiter')

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const orders = ref([])
const tables = ref([])
const menuCategories = ref([])
const activeTab = ref('all')
const restaurantName = ref('Restaurant')

const allTabs = [
  { label: t('orders.tabAll'), value: 'all' },
  { label: t('orders.tabPending'), value: 'pending' },
  { label: t('orders.tabCooking'), value: 'cooking' },
  { label: t('orders.tabReady'), value: 'ready' },
  { label: t('orders.tabPaid'), value: 'paid' },
]
const visibleTabs = computed(() => allTabs)

const countByStatus = computed(() => {
  const counts = {}
  for (const o of orders.value) counts[o.status] = (counts[o.status] || 0) + 1
  return counts
})

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter((o) => o.status === activeTab.value)
})

// ─── Sound & Toast State ──────────────────────────────────────────────────────
const soundEnabled = ref(true)
const toasts = ref([])
let toastIdCounter = 0
let knownOrderIds = new Set()

function addToast(message, duration = 4000) {
  const id = ++toastIdCounter
  toasts.value.push({ id, message, duration })
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function playCashRegisterSound() {
  if (!soundEnabled.value) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
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
    playNoise(t, 0.06, 0.3)
    playTone(180, t, 0.07, 0.15)
    playTone(2200, t + 0.05, 0.35, 0.35)
    playTone(2800, t + 0.07, 0.25, 0.2)
    playTone(1800, t + 0.09, 0.3, 0.15)
    playNoise(t + 0.12, 0.18, 0.15)
    playNoise(t + 0.28, 0.1, 0.35)
    playTone(120, t + 0.28, 0.12, 0.2)
    setTimeout(() => ctx.close(), 800)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────
// `downloaded` tracks whether PNG or PDF was downloaded before confirming paid.
// If neither was downloaded, confirmPaid auto-downloads a PNG first.
const receiptModal = ref({ open: false, order: null, saving: false, downloaded: false })

function openReceiptModal(order) {
  receiptModal.value = { open: true, order, saving: false, downloaded: false }
}

async function confirmPaid() {
  // Auto-download PNG if cashier skipped both download buttons
  if (!receiptModal.value.downloaded) {
    await downloadPng()
  }

  receiptModal.value.saving = true
  const order = receiptModal.value.order
  const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)
  if (!error) {
    const found = orders.value.find((o) => o.id === order.id)
    if (found) found.status = 'paid'
  }
  receiptModal.value.open = false
  receiptModal.value.saving = false
}

// ─── PNG Download ──────────────────────────────────────────────────────────────
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
  ctx.fillText(t('orders.receiptTagline'), W / 2, y)
  y += 24

  ctx.fillStyle = '#d1d5db'
  ctx.fillText('· · · · · · · · · · · · · · · · · ·', W / 2, y)
  y += 24

  const meta = [
    [t('orders.tableLabel'), order.tables?.name ?? '—'],
    [t('orders.receiptOrderId'), `#${order.id.slice(-6).toUpperCase()}`],
    [t('orders.receiptDate'), formatDate(order.created_at)],
    [t('orders.receiptTime'), formatTimeHuman(order.created_at)],
  ]
  ctx.textAlign = 'left'
  for (const [label, value] of meta) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '13px sans-serif'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = '#111827'
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
    ctx.fillText(`${item.quantity}× ${item.menu_items?.name ?? t('orders.itemFallback')}`, padding, y)
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
  ctx.fillText(t('orders.receiptTotal'), padding, y)
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
  ctx.fillText(t('orders.receiptFooter'), W / 2, y)

  return canvas
}

// ─── PDF Download ──────────────────────────────────────────────────────────────
function downloadPdf() {
  const order = receiptModal.value.order
  receiptModal.value.downloaded = true

  const items = order.order_items || []

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td class="item-qty">${item.quantity}×</td>
        <td class="item-name">${item.menu_items?.name ?? t('orders.itemFallback')}</td>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fff; display: flex; justify-content: center; padding: 40px 20px; color: #111827; }
    .receipt { width: 320px; padding: 32px 28px; border: 1px dashed #d1d5db; border-radius: 8px; }
    .restaurant { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 6px; }
    .tagline { font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 16px; }
    .divider { text-align: center; color: #d1d5db; font-size: 12px; letter-spacing: 2px; margin: 12px 0; }
    .meta-table { width: 100%; font-size: 13px; border-collapse: collapse; }
    .meta-table td { padding: 3px 0; }
    .meta-table .label { color: #6b7280; }
    .meta-table .value { text-align: right; font-weight: 500; }
    .items-table { width: 100%; font-size: 13px; border-collapse: collapse; }
    .items-table td { padding: 5px 0; vertical-align: top; }
    .item-qty { width: 28px; color: #6b7280; }
    .item-price { text-align: right; font-weight: 500; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .total-label { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; }
    .total-value { font-size: 20px; font-weight: 700; }
    .footer-thanks { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 4px; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="restaurant">${restaurantName.value}</div>
    <div class="tagline">${t('orders.receiptTagline')}</div>
    <div class="divider">· · · · · · · · · · · · ·</div>
    <table class="meta-table">
      <tr><td class="label">${t('orders.tableLabel')}</td><td class="value">${order.tables?.name ?? '—'}</td></tr>
      <tr><td class="label">${t('orders.receiptOrderId')}</td><td class="value">#${order.id.slice(-6).toUpperCase()}</td></tr>
      <tr><td class="label">${t('orders.receiptDate')}</td><td class="value">${formatDate(order.created_at)}</td></tr>
      <tr><td class="label">${t('orders.receiptTime')}</td><td class="value">${formatTimeHuman(order.created_at)}</td></tr>
    </table>
    <div class="divider">· · · · · · · · · · · · ·</div>
    <table class="items-table">${itemRows}</table>
    <div class="divider">· · · · · · · · · · · · ·</div>
    <div class="total-row">
      <span class="total-label">${t('orders.receiptTotal')}</span>
      <span class="total-value">${formatCurrency(orderTotal(order))}</span>
    </div>
    <div class="divider">· · · · · · · · · · · · ·</div>
    <div class="footer-thanks">${t('orders.receiptFooter')}</div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=480,height=700')
  win.document.write(html)
  win.document.close()
}

// ─── New Order ────────────────────────────────────────────────────────────────
const showNewOrder = ref(false)
const submitting = ref(false)
const newOrderError = ref('')
const newOrder = ref({ tableId: '', note: '' })
const cart = ref({})

const cartItems = computed(() => Object.values(cart.value).filter((i) => i.quantity > 0))
const cartTotal = computed(() => cartItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

function cartQty(itemId) {
  return cart.value[itemId]?.quantity || 0
}
function addToCart(item) {
  if (!cart.value[item.id])
    cart.value[item.id] = { id: item.id, name: item.name, price: item.price, quantity: 0 }
  cart.value[item.id].quantity++
}
function removeFromCart(itemId) {
  if (!cart.value[itemId]) return
  cart.value[itemId].quantity--
  if (cart.value[itemId].quantity <= 0) delete cart.value[itemId]
}
function openNewOrder() {
  newOrder.value = { tableId: '', note: '' }
  cart.value = {}
  newOrderError.value = ''
  showNewOrder.value = true
}
function closeNewOrder() {
  if (submitting.value) return
  showNewOrder.value = false
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
  const currency = authStore.restaurantCurrency || 'USD'
  const num = (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const spaceIndex = currency.indexOf(' ')
  if (spaceIndex !== -1) return `${currency.slice(0, spaceIndex)} ${num}`
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
  } catch {
    return `${currency} ${num}`
  }
}

function timeElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}${t('orders.timeElapsedSeconds')}`
  if (diff < 3600) return `${Math.floor(diff / 60)}${t('orders.timeElapsedMinutes')}`
  return `${Math.floor(diff / 3600)}${t('orders.timeElapsedHours')}`
}

function statusLabel(status) {
  const map = {
    pending: t('orders.tabPending'),
    cooking: t('orders.tabCooking'),
    ready: t('orders.tabReady'),
    paid: t('orders.tabPaid'),
  }
  return map[status] || status
}

function orderTotal(order) {
  return (order?.order_items || []).reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1),
    0,
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeHuman(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function getStartOfDayISO(timezone) {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(`${todayStr}T00:00:00`).toISOString()
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchOrders() {
  const restaurantId = authStore.profile?.restaurant_id
  const timezone = authStore.restaurantTimezone || 'UTC'
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, notes, created_at, tables(name), order_items(id, quantity, unit_price, menu_items(name))',
    )
    .eq('restaurant_id', restaurantId)
    .gte('created_at', getStartOfDayISO(timezone))
    .order('created_at', { ascending: false })
  if (!error) {
    const incoming = data || []
    // Detect new ready orders after initial load
    if (knownOrderIds.size > 0) {
      const newReady = incoming.filter((o) => o.status === 'ready' && !knownOrderIds.has(o.id))
      newReady.forEach((o) => {
        const tableName = o.tables?.name ?? t('orders.unknownTable')
        const itemCount = o.order_items?.length ?? 0
        addToast(`${tableName} · ${itemCount} ${itemCount !== 1 ? 'items' : 'item'}`)
        playCashRegisterSound()
      })
    }
    knownOrderIds = new Set(incoming.map((o) => o.id))
    orders.value = incoming
  }
  loading.value = false
}

async function fetchTables() {
  const { data } = await supabase
    .from('tables')
    .select('id, name')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .order('name')
  tables.value = data || []
}

async function fetchMenu() {
  const { data } = await supabase
    .from('menu_categories')
    .select('id, name, menu_items(id, name, price, is_available)')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('menu_items.is_available', true)
    .order('name')
  menuCategories.value = (data || []).filter((c) => c.menu_items?.length > 0)
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

// ─── Actions ──────────────────────────────────────────────────────────────────
async function cancelOrder(order) {
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
  if (!error) orders.value = orders.value.filter((o) => o.id !== order.id)
}

async function submitOrder() {
  newOrderError.value = ''
  if (!newOrder.value.tableId || cartItems.value.length === 0) return
  submitting.value = true
  const restaurantId = authStore.profile?.restaurant_id
  try {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: newOrder.value.tableId,
        status: 'pending',
        note: newOrder.value.note || null,
      })
      .select()
      .single()
    if (orderErr) throw new Error(orderErr.message)

    const { error: itemsErr } = await supabase.from('order_items').insert(
      cartItems.value.map((i) => ({
        order_id: orderData.id,
        menu_item_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      })),
    )
    if (itemsErr) throw new Error(itemsErr.message)

    showNewOrder.value = false
    await fetchOrders()
  } catch (err) {
    newOrderError.value = err.message || t('orders.failedToPlace')
  } finally {
    submitting.value = false
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────
let realtimeChannel = null

function subscribeRealtime() {
  const restaurantId = authStore.profile?.restaurant_id
  realtimeChannel = supabase
    .channel('orders-view')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
      () => fetchOrders(),
    )
    .subscribe()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchOrders(), fetchTables(), fetchRestaurantName()])
  if (isWaiter.value || isAdmin.value) await fetchMenu()
  // Seed known IDs so first load doesn't trigger alerts
  knownOrderIds = new Set(orders.value.map((o) => o.id))
  subscribeRealtime()
})

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────── */
.orders-page {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  max-width: 1200px;
}

/* ── Header ──────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.header-sub {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin-bottom: 4px;
}
.header-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.5px;
  margin: 0;
}
.btn-new-order {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: var(--color-accent, #c8733a);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill, 999px);
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: background 0.15s;
  box-shadow: var(--shadow-glow, 0 8px 24px rgba(200, 115, 58, 0.3));
}
.btn-new-order:hover {
  background: var(--color-accent-hover, #d4844e);
}

/* ── Filter Tabs ─────────────────────────────────────────── */
.filter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  background: var(--color-bg-surface, #161616);
  font-size: 12.5px;
  font-weight: 500;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
  color: var(--color-text-primary, #fff);
}
.tab.active {
  background: var(--color-text-primary, #fff);
  color: #111;
  border-color: transparent;
  font-weight: 600;
}
.tab-count {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.tab-count--pending {
  background: rgba(250, 204, 21, 0.2);
  color: #facc15;
}
.tab-count--cooking {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
}
.tab-count--ready {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}
.tab-count--paid {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}
.tab.active .tab-count {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

/* ── Skeleton ────────────────────────────────────────────── */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.skeleton-card {
  height: 200px;
  border-radius: var(--radius-card, 10px);
  background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%);
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

/* ── Empty ───────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  font-size: 14px;
}
.empty-icon {
  opacity: 0.3;
}

/* ── Orders Grid ─────────────────────────────────────────── */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* ── Order Card ──────────────────────────────────────────── */
.order-card {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  transition:
    border-color 0.15s,
    transform 0.15s;
  position: relative;
}
.order-card:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
  transform: translateY(-1px);
}
.card-stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.stripe--pending {
  background: #facc15;
}
.stripe--cooking {
  background: #fb923c;
}
.stripe--ready {
  background: #4ade80;
}
.stripe--paid {
  background: rgba(255, 255, 255, 0.12);
}
.card-header,
.card-items,
.card-note,
.card-total,
.card-actions {
  padding-left: 18px;
  padding-right: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.table-avatar {
  width: 34px;
  height: 34px;
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
.card-table {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin: 0 0 2px;
}
.card-elapsed {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  margin: 0;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.8;
}
.status--pending {
  background: rgba(250, 204, 21, 0.12);
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.2);
}
.status--cooking {
  background: rgba(251, 146, 60, 0.12);
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.2);
}
.status--ready {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
}
.status--paid {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.card-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.item-qty {
  font-weight: 700;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  min-width: 24px;
  font-size: 12px;
}
.item-name {
  flex: 1;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
}
.item-price {
  font-size: 12px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.card-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: var(--color-bg-elevated, #0e0e0e);
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.05));
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.05));
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 12px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  line-height: 1.4;
}
.card-note svg {
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0.5;
}
.card-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.05));
  padding-top: 10px;
}
.total-label {
  font-size: 12px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.total-amount {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.3px;
}
.card-actions {
  padding-bottom: 14px;
}
.btn-action {
  width: 100%;
  padding: 9px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.btn-paid {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
}
.btn-paid:hover {
  background: rgba(74, 222, 128, 0.18);
}
.btn-cancel-order {
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.15);
}
.btn-cancel-order:hover {
  background: rgba(239, 68, 68, 0.15);
}
.card-waiting {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  margin: 0;
}
.waiting-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #facc15;
  animation: pulse-dot 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
.waiting-dot--cooking {
  background: #fb923c;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
}
.card-paid-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4ade80;
  margin: 0;
}

/* ── Modal (shared) ──────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-panel, 16px);
  width: 100%;
  max-width: 540px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-float, 0 24px 56px rgba(0, 0, 0, 0.5));
  animation: modal-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal--lg {
  max-width: 600px;
}
.modal--receipt {
  max-width: 460px;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  flex-shrink: 0;
  background: var(--color-bg-elevated, #0e0e0e);
}
.modal-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin: 0;
}
.modal-close {
  width: 30px;
  height: 30px;
  background: none;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 7px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    color 0.12s;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary, #fff);
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium, rgba(255, 255, 255, 0.12)) transparent;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  background: var(--color-bg-elevated, #0e0e0e);
  flex-shrink: 0;
}

/* ── Receipt Modal specifics ─────────────────────────────── */
.receipt-modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.receipt-modal-subtitle {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  margin-top: 2px;
}
.receipt-modal-body {
  display: flex;
  justify-content: center;
}
.receipt-modal-footer {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

/* ── Receipt Preview ─────────────────────────────────────── */
.receipt-preview {
  background: #ffffff;
  color: #111827;
  width: 280px;
  padding: 28px 24px;
  border-radius: 10px;
  border: 1px dashed #d1d5db;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
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

/* ── Download & Confirm Buttons ──────────────────────────── */
.download-group {
  display: flex;
  gap: 8px;
}
.btn-download-png,
.btn-download-pdf {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  background: var(--color-bg-surface, #161616);
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
}
.btn-download-png:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  color: #818cf8;
}
.btn-download-pdf:hover {
  background: rgba(200, 115, 58, 0.1);
  border-color: var(--color-accent-border, rgba(200, 115, 58, 0.25));
  color: var(--color-accent, #c8733a);
}
.btn-download-png:disabled,
.btn-download-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-confirm-paid {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-confirm-paid:hover:not(:disabled) {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
}
.btn-confirm-paid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Form fields ─────────────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
}
.optional {
  font-weight: 400;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.form-input {
  width: 100%;
  padding: 9px 13px;
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-primary, #fff);
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
  box-sizing: border-box;
}
.form-input::placeholder {
  color: var(--color-text-muted, rgba(255, 255, 255, 0.3));
}
.form-input:focus {
  border-color: var(--color-accent-border-strong, rgba(200, 115, 58, 0.45));
}

/* ── Menu in modal ───────────────────────────────────────── */
.menu-category {
  margin-bottom: 12px;
}
.category-name {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  margin-bottom: 6px;
}
.menu-items-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  background: var(--color-bg-elevated, #0e0e0e);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.menu-item:hover:not(.item--unavailable) {
  border-color: var(--color-accent-border, rgba(200, 115, 58, 0.25));
  background: rgba(200, 115, 58, 0.06);
}
.item--in-cart {
  border-color: var(--color-accent-border-strong, rgba(200, 115, 58, 0.45)) !important;
  background: rgba(200, 115, 58, 0.1) !important;
}
.item--unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}
.menu-item-info {
  flex: 1;
}
.menu-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  margin-bottom: 2px;
}
.menu-item-price {
  font-size: 11px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.add-hint {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-accent, #c8733a);
}
.sold-out {
  font-size: 10px;
  font-weight: 700;
  color: #f87171;
}
.menu-item-qty {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(200, 115, 58, 0.15);
  color: var(--color-accent, #c8733a);
  border: none;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.qty-btn:hover {
  background: rgba(200, 115, 58, 0.25);
}
.qty-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  min-width: 16px;
  text-align: center;
}

/* ── Cart summary ────────────────────────────────────────── */
.cart-summary {
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  padding: 14px 16px;
}
.cart-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  margin-bottom: 10px;
}
.cart-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  margin-bottom: 6px;
}
.cart-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  padding-top: 10px;
  margin-top: 6px;
}
.cart-total-val {
  color: var(--color-accent, #c8733a);
}
.error-alert {
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #f87171;
}

/* ── Buttons ─────────────────────────────────────────────── */
.btn-ghost {
  padding: 9px 18px;
  background: transparent;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover:not(:disabled) {
  border-color: var(--color-border-bright, rgba(255, 255, 255, 0.22));
  color: var(--color-text-primary, #fff);
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-submit {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  background: var(--color-accent, #c8733a);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-submit:hover:not(:disabled) {
  background: var(--color-accent-hover, #d4844e);
}
.btn-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Modal transition ────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* ── Header Actions ──────────────────────────────────────── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── Sound Toggle ────────────────────────────────────────── */
.btn-sound-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
  color: #4ade80;
  font-size: 12.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-sound-toggle:hover {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.5);
}
.btn-sound-toggle.sound-off {
  border-color: var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  background: transparent;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.btn-sound-toggle.sound-off:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.15));
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
}

/* ── Toast Container ─────────────────────────────────────── */
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

/* ── Toast Card ──────────────────────────────────────────── */
.toast {
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-surface, #161616);
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
  backdrop-filter: blur(12px);
}
.toast:hover {
  border-color: rgba(74, 222, 128, 0.5);
}
.toast-icon-wrap {
  width: 36px;
  height: 36px;
  background: rgba(74, 222, 128, 0.12);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  font-size: 12px;
  font-weight: 700;
  color: #4ade80;
  letter-spacing: 0.01em;
}
.toast-body {
  font-size: 13px;
  color: var(--color-text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toast-close {
  background: none;
  border: none;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.toast-close:hover {
  color: var(--color-text-primary, #fff);
}
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

/* ── Toast Transitions ───────────────────────────────────── */
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

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
  .header-title {
    font-size: 1.5rem;
  }
  .header-actions {
    gap: 8px;
  }
  .btn-sound-toggle span {
    display: none;
  }
  .receipt-modal-footer {
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
  .btn-confirm-paid,
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
