<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="header-sub">Live order management</p>
        <h1 class="header-title">Orders</h1>
      </div>

      <!-- Waiter: create order button -->
      <button v-if="isWaiter" class="btn-primary" @click="openNewOrder">+ New Order</button>
    </div>

    <!-- Status Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.value"
        class="tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="countByStatus[tab.value]" class="tab-count">
          {{ countByStatus[tab.value] }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <span class="empty-icon">🧾</span>
      <p>No {{ activeTab === 'all' ? '' : activeTab }} orders right now</p>
    </div>

    <!-- Orders Grid -->
    <div v-else class="orders-grid">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="`card--${order.status}`"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-header-left">
            <span class="card-table">{{ order.tables?.name || 'Table' }}</span>
            <span class="card-elapsed">{{ timeElapsed(order.created_at) }}</span>
          </div>
          <span class="status-badge" :class="`status--${order.status}`">
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
          <span class="note-icon">📝</span> {{ order.note }}
        </div>

        <!-- Total -->
        <div class="card-total">
          <span>Total</span>
          <span class="total-amount">{{ formatCurrency(order.total_price) }}</span>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <!-- Cashier: mark as paid (only for ready orders) -->
          <button
            v-if="isCashier && order.status === 'ready'"
            class="btn-action btn-paid"
            @click="markAsPaid(order)"
          >
            ✅ Mark as Paid
          </button>

          <!-- Admin sees paid button too -->
          <button
            v-if="isAdmin && order.status === 'ready'"
            class="btn-action btn-paid"
            @click="markAsPaid(order)"
          >
            ✅ Mark as Paid
          </button>

          <!-- Waiter: cancel pending orders only -->
          <button
            v-if="isWaiter && order.status === 'pending'"
            class="btn-action btn-cancel-order"
            @click="cancelOrder(order)"
          >
            Cancel Order
          </button>

          <!-- Read-only states -->
          <p v-if="(isCashier || isAdmin) && order.status === 'pending'" class="card-waiting">
            Waiting for kitchen to accept…
          </p>
          <p v-if="(isCashier || isAdmin) && order.status === 'cooking'" class="card-waiting">
            Kitchen is cooking…
          </p>
          <p v-if="order.status === 'paid'" class="card-paid-label">✅ Paid</p>
        </div>
      </div>
    </div>

    <!-- ── New Order Modal (Waiter) ── -->
    <Transition name="modal">
      <div v-if="showNewOrder" class="modal-overlay" @click.self="closeNewOrder">
        <div class="modal modal--lg">
          <div class="modal-header">
            <h2 class="modal-title">New Order</h2>
            <button class="modal-close" @click="closeNewOrder">✕</button>
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
                      <span>{{ cartQty(item.id) }}</span>
                      <button class="qty-btn" @click.stop="addToCart(item)">+</button>
                    </div>
                    <div v-else-if="!item.is_available" class="sold-out">Sold out</div>
                    <div v-else class="add-hint">Tap to add</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div class="form-group" style="margin-top: 1rem">
              <label class="form-label">Order Note (optional)</label>
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
              <div class="cart-total">
                <span>Total</span>
                <span>{{ formatCurrency(cartTotal) }}</span>
              </div>
            </div>

            <div v-if="newOrderError" class="alert alert--error">{{ newOrderError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeNewOrder" :disabled="submitting">Cancel</button>
            <button
              class="btn-submit"
              @click="submitOrder"
              :disabled="submitting || !newOrder.tableId || cartItems.length === 0"
            >
              <span v-if="submitting" class="spinner"></span>
              {{ submitting ? 'Placing...' : `Place Order · ${formatCurrency(cartTotal)}` }}
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

// Cashier sees all non-paid tabs; Waiter sees all; Admin sees all
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
  for (const o of orders.value) {
    counts[o.status] = (counts[o.status] || 0) + 1
  }
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
const cart = ref({}) // { [menuItemId]: { id, name, price, quantity } }

const cartItems = computed(() => Object.values(cart.value).filter((i) => i.quantity > 0))
const cartTotal = computed(() => cartItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

function cartQty(itemId) {
  return cart.value[itemId]?.quantity || 0
}

function addToCart(item) {
  if (!cart.value[item.id]) {
    cart.value[item.id] = { id: item.id, name: item.name, price: item.price, quantity: 0 }
  }
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
  const currency = authStore.profile?.restaurants?.currency || 'USD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
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

// ─── Fetch Data ───────────────────────────────────────────────────────────────
async function fetchOrders() {
  const restaurantId = authStore.profile?.restaurant_id
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, notes, total_amount, created_at, tables(name), order_items(id, quantity, unit_price, menu_items(name))',
    )
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  console.log('Fetched orders:', orders.value)

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

  console.log('Fetched tables:', tables.value)
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

  console.log('Fetched menu:', menuCategories.value)
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
    // 1. Create order
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: newOrder.value.tableId,
        status: 'pending',
        note: newOrder.value.note || null,
        total_price: cartTotal.value,
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
.orders-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}
.header-sub {
  font-size: 0.78rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}
.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.btn-primary {
  background: #111827;
  color: #fff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover {
  background: #374151;
}

/* ── Filter Tabs ── */
.filter-tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.tab:hover {
  border-color: #d1d5db;
  color: #374151;
}
.tab.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}
.tab-count {
  background: #e5e7eb;
  color: #374151;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}
.tab.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* ── Skeleton ── */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.skeleton-card {
  height: 180px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
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

/* ── Empty ── */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #9ca3af;
}
.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

/* ── Orders Grid ── */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* ── Order Card ── */
.order-card {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  transition: box-shadow 0.15s;
}
.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}
.card--pending {
  border-color: #fde68a;
}
.card--cooking {
  border-color: #fca5a5;
}
.card--ready {
  border-color: #6ee7b7;
}
.card--paid {
  border-color: #e5e7eb;
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.card-table {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111827;
}
.card-elapsed {
  font-size: 0.72rem;
  color: #9ca3af;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}
.status--pending {
  background: #fef3c7;
  color: #d97706;
}
.status--cooking {
  background: #fee2e2;
  color: #dc2626;
}
.status--ready {
  background: #d1fae5;
  color: #059669;
}
.status--paid {
  background: #f3f4f6;
  color: #6b7280;
}

.card-items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.83rem;
}
.item-qty {
  font-weight: 700;
  color: #6b7280;
  min-width: 24px;
}
.item-name {
  flex: 1;
  color: #374151;
}
.item-price {
  color: #6b7280;
  font-size: 0.78rem;
}

.card-note {
  background: #fafafa;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #6b7280;
}

.card-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
  font-size: 0.82rem;
  color: #6b7280;
}
.total-amount {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111827;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.btn-action {
  width: 100%;
  padding: 0.6rem;
  border-radius: 9px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-paid {
  background: #059669;
  color: #fff;
}
.btn-paid:hover {
  background: #047857;
}
.btn-cancel-order {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}
.btn-cancel-order:hover {
  background: #ffe4e6;
}
.card-waiting {
  font-size: 0.78rem;
  color: #9ca3af;
  text-align: center;
  margin: 0;
}
.card-paid-label {
  font-size: 0.82rem;
  color: #059669;
  font-weight: 600;
  text-align: center;
  margin: 0;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal--lg {
  max-width: 600px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  flex-shrink: 0;
}
.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #9ca3af;
  cursor: pointer;
}
.modal-close:hover {
  color: #111827;
}
.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  flex-shrink: 0;
  border-top: 1px solid #f3f4f6;
}

/* ── Form ── */
.form-group {
  margin-bottom: 1rem;
}
.form-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
}
.form-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  font-size: 0.85rem;
  color: #111827;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  background: #fff;
}
.form-input:focus {
  border-color: #6366f1;
}

/* ── Menu ── */
.menu-category {
  margin-bottom: 1.25rem;
}
.category-name {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 0.6rem;
}
.menu-items-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-radius: 9px;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.15s;
  background: #fff;
}
.menu-item:hover:not(.item--unavailable) {
  border-color: #c7d2fe;
  background: #eef2ff;
}
.item--in-cart {
  border-color: #6366f1 !important;
  background: #eef2ff !important;
}
.item--unavailable {
  opacity: 0.45;
  cursor: not-allowed;
}
.menu-item-info {
  flex: 1;
}
.menu-item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}
.menu-item-price {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.1rem;
}
.add-hint {
  font-size: 0.72rem;
  color: #9ca3af;
}
.sold-out {
  font-size: 0.72rem;
  color: #e11d48;
  font-weight: 600;
}
.menu-item-qty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #4338ca;
}
.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  border: none;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.qty-btn:hover {
  background: #c7d2fe;
}

/* ── Cart Summary ── */
.cart-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
}
.cart-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cart-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.83rem;
  color: #374151;
  margin-bottom: 0.35rem;
}
.cart-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 0.9rem;
  color: #111827;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.6rem;
  margin-top: 0.6rem;
}

/* ── Alert ── */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 500;
  margin-top: 0.75rem;
}
.alert--error {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

/* ── Buttons ── */
.btn-cancel {
  padding: 0.65rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-submit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-submit:hover:not(:disabled) {
  background: #374151;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Spinner ── */
.spinner {
  width: 14px;
  height: 14px;
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

/* ── Modal Transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96) translateY(8px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .orders-page {
    padding: 1rem;
  }
  .orders-grid {
    grid-template-columns: 1fr;
  }
}
</style>
