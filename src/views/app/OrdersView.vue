<template>
  <div class="orders-page">
    <!-- ── Header ──────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <p class="header-sub">Live order management</p>
        <h1 class="header-title">Orders</h1>
      </div>
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
        New Order
      </button>
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
      <p>No {{ activeTab === 'all' ? '' : activeTab }} orders right now</p>
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
              <p class="card-table">{{ order.tables?.name || 'Table' }}</p>
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
          <span class="total-label">Total</span>
          <span class="total-amount">{{ formatCurrency(orderTotal(order)) }}</span>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button
            v-if="isCashier && order.status === 'ready'"
            class="btn-action btn-paid"
            @click="markAsPaid(order)"
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
            Mark as Paid
          </button>

          <button
            v-if="isAdmin && order.status === 'ready'"
            class="btn-action btn-paid"
            @click="markAsPaid(order)"
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
            Mark as Paid
          </button>

          <button
            v-if="isWaiter && order.status === 'pending'"
            class="btn-action btn-cancel-order"
            @click="cancelOrder(order)"
          >
            Cancel Order
          </button>

          <p v-if="(isCashier || isAdmin) && order.status === 'pending'" class="card-waiting">
            <span class="waiting-dot" />
            Waiting for kitchen to accept…
          </p>
          <p v-if="(isCashier || isAdmin) && order.status === 'cooking'" class="card-waiting">
            <span class="waiting-dot waiting-dot--cooking" />
            Kitchen is cooking…
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
            Paid
          </p>
        </div>
      </div>
    </div>

    <!-- ══ NEW ORDER MODAL ════════════════════════════════ -->
    <Transition name="modal">
      <div v-if="showNewOrder" class="modal-overlay" @click.self="closeNewOrder">
        <div class="modal modal--lg">
          <div class="modal-header">
            <h2 class="modal-title">New Order</h2>
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
              <label class="form-label">Table</label>
              <select v-model="newOrder.tableId" class="form-input">
                <option value="" disabled>Select a table...</option>
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
                    <div v-else-if="!item.is_available" class="sold-out">Sold out</div>
                    <div v-else class="add-hint">+ Add</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div class="form-group">
              <label class="form-label">Order Note <span class="optional">(optional)</span></label>
              <input
                v-model="newOrder.note"
                type="text"
                class="form-input"
                placeholder="e.g. No onions on table 3"
              />
            </div>

            <!-- Cart Summary -->
            <div v-if="cartItems.length > 0" class="cart-summary">
              <p class="cart-title">Order Summary</p>
              <div v-for="ci in cartItems" :key="ci.id" class="cart-row">
                <span>×{{ ci.quantity }} {{ ci.name }}</span>
                <span>{{ formatCurrency(ci.price * ci.quantity) }}</span>
              </div>
              <div class="cart-total-row">
                <span>Total</span>
                <span class="cart-total-val">{{ formatCurrency(cartTotal) }}</span>
              </div>
            </div>

            <div v-if="newOrderError" class="error-alert">{{ newOrderError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeNewOrder" :disabled="submitting">Cancel</button>
            <button
              class="btn-submit"
              @click="submitOrder"
              :disabled="submitting || !newOrder.tableId || cartItems.length === 0"
            >
              <span v-if="submitting" class="spinner" />
              {{ submitting ? 'Placing…' : `Place Order · ${formatCurrency(cartTotal)}` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

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

const allTabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cooking', value: 'cooking' },
  { label: 'Ready', value: 'ready' },
  { label: 'Paid', value: 'paid' },
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

// ─── New Order (Waiter) ───────────────────────────────────────────────────────
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

function timeElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function statusLabel(status) {
  return { pending: 'Pending', cooking: 'Cooking', ready: 'Ready', paid: 'Paid' }[status] || status
}

// ✅ Calculate total from order_items — no total_price column needed
function orderTotal(order) {
  return (order.order_items || []).reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1),
    0,
  )
}

// ✅ Correct way
function getStartOfDayISO(timezone) {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()) // gives "YYYY-MM-DD" in their local time

  return new Date(`${todayStr}T00:00:00`).toISOString()
}

// ─── Fetch Today Data ───────────────────────────────────────────────────────────────
async function fetchOrders() {
  const restaurantId = authStore.profile?.restaurant_id
  const timezone = authStore.restaurantTimezone || 'UTC'

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, notes, created_at, tables(name), order_items(id, quantity, unit_price, menu_items(name))',
    )
    .eq('restaurant_id', restaurantId)
    .gte('created_at', getStartOfDayISO(timezone)) // 👈 only today
    .order('created_at', { ascending: false })

  if (!error) orders.value = data || []
  loading.value = false
}

async function fetchTables() {
  const restaurantId = authStore.profile?.restaurant_id
  const { data } = await supabase
    .from('tables')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
    .order('name')
  tables.value = data || []
}

async function fetchMenu() {
  const restaurantId = authStore.profile?.restaurant_id
  const { data } = await supabase
    .from('menu_categories')
    .select('id, name, menu_items(id, name, price, is_available)')
    .eq('restaurant_id', restaurantId)
    .eq('menu_items.is_available', true)
    .order('name')
  menuCategories.value = (data || []).filter((c) => c.menu_items?.length > 0)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function markAsPaid(order) {
  const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)
  if (!error) order.status = 'paid'
}

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
    // 1. Create the order (no total_price column)
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

    // 2. Insert order items
    const items = cartItems.value.map((i) => ({
      order_id: orderData.id,
      menu_item_id: i.id,
      quantity: i.quantity,
      unit_price: i.price,
    }))

    const { error: itemsErr } = await supabase.from('order_items').insert(items)
    if (itemsErr) throw new Error(itemsErr.message)

    showNewOrder.value = false
    await fetchOrders()
  } catch (err) {
    newOrderError.value = err.message || 'Failed to place order. Please try again.'
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
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => fetchOrders(),
    )
    .subscribe()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchOrders()
  await fetchTables()
  if (isWaiter.value || isAdmin.value) await fetchMenu()
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

/* Left color stripe */
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

/* Offset content so stripe doesn't overlap */
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

/* Status badge */
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

/* Items */
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

/* Note */
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

/* Total */
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

/* Actions */
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

/* ── Modal ───────────────────────────────────────────────── */
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

/* Error */
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

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }
  .header-title {
    font-size: 1.5rem;
  }
}
</style>
