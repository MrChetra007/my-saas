<template>
  <div class="order-page" :style="{ '--accent': '#c8733a' }">
    <!-- ── Loading ──────────────────────────── -->
    <div v-if="loading" class="full-center">
      <div class="spinner" />
      <p class="loading-text">Loading menu…</p>
    </div>

    <!-- ── Not found ────────────────────────── -->
    <div v-else-if="notFound" class="full-center">
      <div class="not-found-icon">🍽️</div>
      <h2 class="not-found-title">Menu not found</h2>
      <p class="not-found-sub">This QR code may be invalid or the restaurant is unavailable.</p>
    </div>

    <!-- ── Order placed (status tracker) ────── -->
    <div v-else-if="orderPlaced" class="status-screen">
      <div class="status-header">
        <div class="restaurant-logo-sm">
          <img v-if="restaurant.logo_url" :src="restaurant.logo_url" class="logo-img-sm" />
          <span v-else class="logo-emoji">🍽️</span>
        </div>
        <div class="restaurant-name-sm">{{ restaurant.name }}</div>
        <div class="table-badge-sm">{{ tableName }}</div>
      </div>

      <div class="status-card">
        <div class="status-icon-wrap">
          <div class="status-icon" :class="statusClass">{{ statusEmoji }}</div>
        </div>
        <h2 class="status-title">{{ statusTitle }}</h2>
        <p class="status-desc">{{ statusDesc }}</p>

        <!-- Progress steps -->
        <div class="status-steps">
          <div
            class="step-item"
            :class="{ done: orderStatus !== 'pending', active: orderStatus === 'pending' }"
          >
            <div class="step-circle">{{ orderStatus !== 'pending' ? '✓' : '1' }}</div>
            <span>Order received</span>
          </div>
          <div
            class="step-line"
            :class="{ done: ['cooking', 'ready', 'paid'].includes(orderStatus) }"
          />
          <div
            class="step-item"
            :class="{
              done: ['ready', 'paid'].includes(orderStatus),
              active: orderStatus === 'cooking',
            }"
          >
            <div class="step-circle">{{ ['ready', 'paid'].includes(orderStatus) ? '✓' : '2' }}</div>
            <span>Being prepared</span>
          </div>
          <div class="step-line" :class="{ done: ['ready', 'paid'].includes(orderStatus) }" />
          <div
            class="step-item"
            :class="{
              done: ['ready', 'paid'].includes(orderStatus),
              active: orderStatus === 'ready',
            }"
          >
            <div class="step-circle">{{ ['ready', 'paid'].includes(orderStatus) ? '✓' : '3' }}</div>
            <span>Ready!</span>
          </div>
        </div>

        <!-- Order summary -->
        <div class="order-summary">
          <div class="summary-title">Your order</div>
          <div class="summary-items">
            <div v-for="item in placedItems" :key="item.id" class="summary-item">
              <span class="summary-qty">×{{ item.quantity }}</span>
              <span class="summary-name">{{ item.name }}</span>
              <span class="summary-price"
                >{{ currencySymbol }}{{ (item.unit_price * item.quantity).toFixed(2) }}</span
              >
            </div>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <span>{{ currencySymbol }}{{ placedTotal.toFixed(2) }}</span>
          </div>
        </div>

        <button class="btn-order-again" @click="resetOrder">Order more items</button>
      </div>
    </div>

    <!-- ── Menu page ─────────────────────────── -->
    <template v-else>
      <!-- Restaurant header -->
      <div class="restaurant-header">
        <div class="restaurant-brand">
          <div class="restaurant-logo">
            <img v-if="restaurant.logo_url" :src="restaurant.logo_url" class="logo-img" />
            <span v-else class="logo-emoji-lg">🍽️</span>
          </div>
          <div>
            <h1 class="restaurant-title">{{ restaurant.name }}</h1>
            <div class="table-badge">📍 {{ tableName }}</div>
          </div>
        </div>
      </div>

      <!-- Category tabs -->
      <div class="category-tabs-wrap">
        <div class="category-tabs" ref="tabsEl">
          <button
            v-for="cat in activeCategories"
            :key="cat.id"
            class="cat-tab"
            :class="{ active: activeCatId === cat.id }"
            @click="scrollToCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Menu items -->
      <div class="menu-content">
        <div
          v-for="cat in activeCategories"
          :key="cat.id"
          :id="`cat-${cat.id}`"
          class="cat-section"
        >
          <h2 class="cat-title">{{ cat.name }}</h2>
          <div class="items-list">
            <div
              v-for="item in cat.items"
              :key="item.id"
              class="menu-item-row"
              :class="{ 'out-of-stock': !item.is_available }"
              @click="item.is_available && openItemModal(item)"
            >
              <div class="item-info">
                <div class="item-name-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span v-if="!item.is_available" class="sold-out-tag">Sold out</span>
                </div>
                <div v-if="item.description" class="item-desc">{{ item.description }}</div>
                <div class="item-price">
                  {{ currencySymbol }}{{ Number(item.price).toFixed(2) }}
                </div>
              </div>
              <div class="item-right">
                <div class="item-thumb-wrap">
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    class="item-thumb"
                    :alt="item.name"
                  />
                  <div v-else class="item-thumb-placeholder">🍽️</div>
                  <button
                    v-if="item.is_available"
                    class="add-btn"
                    :class="{ 'has-items': cartCount(item.id) > 0 }"
                    @click.stop="addToCart(item)"
                  >
                    <span v-if="cartCount(item.id) > 0" class="add-btn-count">{{
                      cartCount(item.id)
                    }}</span>
                    <span v-else>+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spacer for cart bar -->
      <div style="height: 100px" />

      <!-- ── Cart bar ───────────────────────── -->
      <Transition name="cart-bar">
        <div v-if="cartItemCount > 0" class="cart-bar" @click="openCart">
          <div class="cart-bar-left">
            <span class="cart-count-badge">{{ cartItemCount }}</span>
            <span class="cart-bar-label">View order</span>
          </div>
          <span class="cart-bar-total">{{ currencySymbol }}{{ cartTotal.toFixed(2) }}</span>
        </div>
      </Transition>
    </template>

    <!-- ══ ITEM DETAIL MODAL ══════════════════ -->
    <Teleport to="body">
      <div v-if="itemModal.open" class="modal-backdrop" @click.self="itemModal.open = false">
        <div class="modal modal-item">
          <button class="modal-close-float" @click="itemModal.open = false">✕</button>

          <div class="item-modal-image">
            <img
              v-if="itemModal.item?.image_url"
              :src="itemModal.item.image_url"
              class="item-modal-img"
            />
            <div v-else class="item-modal-img-placeholder">🍽️</div>
          </div>

          <div class="item-modal-body">
            <h3 class="item-modal-name">{{ itemModal.item?.name }}</h3>
            <p v-if="itemModal.item?.description" class="item-modal-desc">
              {{ itemModal.item?.description }}
            </p>
            <div class="item-modal-price">
              {{ currencySymbol }}{{ Number(itemModal.item?.price).toFixed(2) }}
            </div>

            <!-- Notes -->
            <div class="field-group">
              <label class="field-label"
                >Special instructions <span class="optional">(optional)</span></label
              >
              <textarea
                v-model="itemModal.notes"
                class="field-input field-textarea"
                placeholder="e.g. no onions, extra sauce…"
                rows="2"
              />
            </div>

            <!-- Quantity + Add -->
            <div class="item-modal-footer">
              <div class="qty-control">
                <button class="qty-btn" @click="itemModal.qty = Math.max(1, itemModal.qty - 1)">
                  −
                </button>
                <span class="qty-val">{{ itemModal.qty }}</span>
                <button class="qty-btn" @click="itemModal.qty++">+</button>
              </div>
              <button class="btn-add-to-cart" @click="confirmAddToCart">
                Add {{ itemModal.qty }} — {{ currencySymbol
                }}{{ (Number(itemModal.item?.price) * itemModal.qty).toFixed(2) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ CART MODAL ════════════════════════ -->
    <Teleport to="body">
      <div v-if="cartOpen" class="modal-backdrop" @click.self="cartOpen = false">
        <div class="modal modal-cart">
          <div class="modal-header">
            <h2 class="modal-title">Your Order</h2>
            <button class="modal-close" @click="cartOpen = false">✕</button>
          </div>

          <div class="cart-body">
            <div v-for="(line, idx) in cart" :key="idx" class="cart-line">
              <div class="cart-line-info">
                <div class="cart-line-name">{{ line.name }}</div>
                <div v-if="line.notes" class="cart-line-notes">{{ line.notes }}</div>
                <div class="cart-line-price">
                  {{ currencySymbol }}{{ (line.price * line.qty).toFixed(2) }}
                </div>
              </div>
              <div class="cart-line-qty">
                <button class="qty-btn sm" @click="decrementCart(idx)">−</button>
                <span class="qty-val sm">{{ line.qty }}</span>
                <button class="qty-btn sm" @click="line.qty++">+</button>
              </div>
            </div>

            <!-- Order notes -->
            <div class="field-group" style="margin-top: 16px">
              <label class="field-label"
                >Order notes <span class="optional">(optional)</span></label
              >
              <textarea
                v-model="orderNotes"
                class="field-input field-textarea"
                placeholder="Any notes for the kitchen…"
                rows="2"
              />
            </div>
          </div>

          <div class="cart-footer">
            <div class="cart-total-row">
              <span class="cart-total-label">Total</span>
              <span class="cart-total-val">{{ currencySymbol }}{{ cartTotal.toFixed(2) }}</span>
            </div>
            <button class="btn-place-order" :disabled="placing" @click="placeOrder">
              {{
                placing
                  ? 'Placing order…'
                  : `Place Order · ${currencySymbol}${cartTotal.toFixed(2)}`
              }}
            </button>
            <div v-if="orderError" class="order-error">{{ orderError }}</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const restaurant = ref({})
const categories = ref([])
const tableName = ref('')
const tableId = ref('')
const orderPlaced = ref(false)
const placedItems = ref([])
const orderStatus = ref('pending')
const orderNotes = ref('')
const orderError = ref('')
const placing = ref(false)
const activeCatId = ref(null)
const cartOpen = ref(false)
const tabsEl = ref(null)
let statusChannel = null

// ── Cart ─────────────────────────────────────
const cart = ref([]) // [{ itemId, name, price, qty, notes }]

const cartItemCount = computed(() => cart.value.reduce((n, l) => n + l.qty, 0))
const cartTotal = computed(() => cart.value.reduce((n, l) => n + l.price * l.qty, 0))
const placedTotal = computed(() =>
  placedItems.value.reduce((n, i) => n + i.unit_price * i.quantity, 0),
)

const currencySymbol = computed(() => {
  const map = { USD: '$', EUR: '€', GBP: '£', KHR: '៛', THB: '฿', SGD: 'S$', AUD: 'A$', JPY: '¥' }
  return map[restaurant.value.currency] || '$'
})

const activeCategories = computed(() =>
  categories.value.filter((c) => c.is_active && c.items?.length > 0),
)

function cartCount(itemId) {
  return cart.value.filter((l) => l.itemId === itemId).reduce((n, l) => n + l.qty, 0)
}

// ── Item modal ───────────────────────────────
const itemModal = ref({ open: false, item: null, qty: 1, notes: '' })

function openItemModal(item) {
  itemModal.value = { open: true, item, qty: 1, notes: '' }
}

function addToCart(item) {
  const existing = cart.value.find((l) => l.itemId === item.id && !l.notes)
  if (existing) {
    existing.qty++
    return
  }
  cart.value.push({
    itemId: item.id,
    name: item.name,
    price: Number(item.price),
    qty: 1,
    notes: '',
  })
}

function confirmAddToCart() {
  const { item, qty, notes } = itemModal.value
  const existing = cart.value.find((l) => l.itemId === item.id && l.notes === notes)
  if (existing) {
    existing.qty += qty
  } else {
    cart.value.push({ itemId: item.id, name: item.name, price: Number(item.price), qty, notes })
  }
  itemModal.value.open = false
}

function decrementCart(idx) {
  if (cart.value[idx].qty <= 1) cart.value.splice(idx, 1)
  else cart.value[idx].qty--
}

function openCart() {
  cartOpen.value = true
}

// ── Status screen ────────────────────────────
const statusEmoji = computed(() => {
  if (orderStatus.value === 'pending') return '⏳'
  if (orderStatus.value === 'cooking') return '👨‍🍳'
  if (orderStatus.value === 'ready') return '✅'
  if (orderStatus.value === 'rejected') return '❌'
  return '✅'
})
const statusClass = computed(() => ({
  'status-pending': orderStatus.value === 'pending',
  'status-cooking': orderStatus.value === 'cooking',
  'status-ready': orderStatus.value === 'ready' || orderStatus.value === 'paid',
  'status-rejected': orderStatus.value === 'rejected',
}))
const statusTitle = computed(() => {
  if (orderStatus.value === 'pending') return 'Order received!'
  if (orderStatus.value === 'cooking') return 'Being prepared…'
  if (orderStatus.value === 'ready') return 'Your order is ready!'
  if (orderStatus.value === 'rejected') return 'Order not accepted'
  return 'Order complete!'
})
const statusDesc = computed(() => {
  if (orderStatus.value === 'pending')
    return 'The kitchen has your order and will confirm it shortly.'
  if (orderStatus.value === 'cooking') return 'Your food is being prepared. Sit back and relax!'
  if (orderStatus.value === 'ready') return 'A staff member will bring it to your table shortly.'
  if (orderStatus.value === 'rejected') return 'Please speak to a staff member for assistance.'
  return 'Thank you for dining with us!'
})

function resetOrder() {
  orderPlaced.value = false
  cart.value = []
  orderNotes.value = ''
  placedItems.value = []
  if (statusChannel) {
    supabase.removeChannel(statusChannel)
    statusChannel = null
  }
}

// ── Load menu ────────────────────────────────
onMounted(async () => {
  const slug = route.params.slug
  tableId.value = route.params.tableId

  // Load restaurant by slug
  const { data: rest, error: restError } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, currency')
    .eq('slug', slug)
    .single()

  if (restError || !rest) {
    notFound.value = true
    loading.value = false
    return
  }
  restaurant.value = rest

  // Load table name
  const { data: table } = await supabase
    .from('tables')
    .select('name, is_active')
    .eq('id', tableId.value)
    .eq('restaurant_id', rest.id)
    .single()

  if (!table || !table.is_active) {
    notFound.value = true
    loading.value = false
    return
  }
  tableName.value = table.name

  // Load categories + items
  const { data: cats } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', rest.id)
    .eq('is_active', true)
    .order('sort_order')

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', rest.id)
    .order('sort_order')

  categories.value = (cats || []).map((c) => ({
    ...c,
    items: (items || []).filter((i) => i.category_id === c.id),
  }))

  if (categories.value.length > 0) activeCatId.value = categories.value[0].id

  loading.value = false

  // Intersection observer for active category tab
  setTimeout(() => setupObserver(), 300)
})

onUnmounted(() => {
  if (statusChannel) supabase.removeChannel(statusChannel)
})

function setupObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('cat-', '')
          activeCatId.value = id
        }
      })
    },
    { threshold: 0.3 },
  )

  activeCategories.value.forEach((cat) => {
    const el = document.getElementById(`cat-${cat.id}`)
    if (el) observer.observe(el)
  })
}

function scrollToCategory(catId) {
  activeCatId.value = catId
  const el = document.getElementById(`cat-${catId}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Place order ──────────────────────────────
async function placeOrder() {
  if (cart.value.length === 0) return
  placing.value = true
  orderError.value = ''

  try {
    const total = cartTotal.value

    const { data: order, error: orderError_ } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.value.id,
        table_id: tableId.value,
        status: 'pending',
        total_amount: total,
        notes: orderNotes.value || null,
      })
      .select()
      .single()

    if (orderError_) throw orderError_

    const orderItemsPayload = cart.value.map((line) => ({
      order_id: order.id,
      menu_item_id: line.itemId,
      quantity: line.qty,
      unit_price: line.price,
      notes: line.notes || null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)
    if (itemsError) throw itemsError

    // Build placed items for summary display
    placedItems.value = cart.value.map((line) => ({
      id: line.itemId,
      name: line.name,
      unit_price: line.price,
      quantity: line.qty,
    }))

    cartOpen.value = false
    orderPlaced.value = true
    orderStatus.value = 'pending'

    // Subscribe to realtime order status updates
    statusChannel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          orderStatus.value = payload.new.status
        },
      )
      .subscribe()
  } catch (e) {
    orderError.value = e.message || 'Failed to place order. Please try again.'
  } finally {
    placing.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.order-page {
  min-height: 100vh;
  background: #faf8f5;
  font-family: 'DM Sans', sans-serif;
  max-width: 640px;
  margin: 0 auto;
  position: relative;
}

/* Loading / not found */
.full-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2ddd6;
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.loading-text {
  font-size: 14px;
  color: #aaa;
}
.not-found-icon {
  font-size: 52px;
}
.not-found-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  color: #1a1a1a;
}
.not-found-sub {
  font-size: 14px;
  color: #aaa;
  max-width: 280px;
  line-height: 1.6;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Restaurant header */
.restaurant-header {
  padding: 24px 16px 16px;
  background: white;
  border-bottom: 1px solid #ede9e2;
}
.restaurant-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.restaurant-logo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-emoji-lg {
  font-size: 26px;
}
.restaurant-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.4px;
}
.table-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #c8733a;
  background: #fff8f0;
  border: 1px solid #f5d5b3;
  padding: 2px 10px;
  border-radius: 99px;
}

/* Category tabs */
.category-tabs-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid #ede9e2;
}
.category-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 12px;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}
.cat-tab {
  padding: 12px 16px;
  white-space: nowrap;
  font-size: 13.5px;
  font-weight: 600;
  color: #aaa;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.cat-tab:hover {
  color: #555;
}
.cat-tab.active {
  color: #c8733a;
  border-bottom-color: #c8733a;
}

/* Menu content */
.menu-content {
  padding: 0 16px 24px;
}
.cat-section {
  padding-top: 28px;
}
.cat-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 14px;
  letter-spacing: -0.3px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0ece5;
  cursor: pointer;
  transition: background 0.1s;
  border-radius: 4px;
}
.menu-item-row:last-child {
  border-bottom: none;
}
.menu-item-row:hover:not(.out-of-stock) {
  background: rgba(200, 115, 58, 0.03);
}
.menu-item-row.out-of-stock {
  opacity: 0.5;
  cursor: default;
}

.item-info {
  flex: 1;
  min-width: 0;
}
.item-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.sold-out-tag {
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: #fff5f5;
  border: 1px solid #fecaca;
  padding: 1px 7px;
  border-radius: 99px;
  letter-spacing: 0.04em;
}
.item-desc {
  font-size: 12.5px;
  color: #aaa;
  line-height: 1.5;
  margin-top: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #c8733a;
  margin-top: 6px;
}

.item-right {
  flex-shrink: 0;
}
.item-thumb-wrap {
  position: relative;
}
.item-thumb {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  object-fit: cover;
  display: block;
}
.item-thumb-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  background: #f0ece5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.add-btn {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a1a1a;
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.15s;
}
.add-btn:hover {
  background: #c8733a;
  transform: scale(1.1);
}
.add-btn.has-items {
  background: #c8733a;
  width: 32px;
  height: 32px;
  font-size: 13px;
  font-weight: 700;
}
.add-btn-count {
  font-size: 13px;
  font-weight: 700;
}

/* Cart bar */
.cart-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 600px;
  background: #1a1a1a;
  color: white;
  border-radius: 14px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  z-index: 50;
  transition: background 0.15s;
}
.cart-bar:hover {
  background: #c8733a;
}
.cart-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cart-count-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #c8733a;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-bar:hover .cart-count-badge {
  background: white;
  color: #c8733a;
}
.cart-bar-label {
  font-size: 14px;
  font-weight: 600;
}
.cart-bar-total {
  font-size: 14px;
  font-weight: 700;
}

.cart-bar-enter-active,
.cart-bar-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cart-bar-enter-from,
.cart-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Status screen */
.status-screen {
  min-height: 100vh;
  background: #faf8f5;
  padding: 0 16px 40px;
}
.status-header {
  padding: 24px 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.restaurant-logo-sm {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: #f5f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-img-sm {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-emoji {
  font-size: 22px;
}
.restaurant-name-sm {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}
.table-badge-sm {
  font-size: 12px;
  font-weight: 600;
  color: #c8733a;
  background: #fff8f0;
  border: 1px solid #f5d5b3;
  padding: 2px 10px;
  border-radius: 99px;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 28px 24px;
  border: 1.5px solid #ede9e2;
}
.status-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.status-icon {
  font-size: 48px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-pending {
  background: #fef9c3;
}
.status-cooking {
  background: #fff7ed;
}
.status-ready {
  background: #f0fdf4;
}
.status-rejected {
  background: #fff5f5;
}

.status-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 6px;
}
.status-desc {
  font-size: 14px;
  color: #888;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* Progress steps */
.status-steps {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 0;
}
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e2ddd6;
  background: white;
  color: #ccc;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.step-item.active .step-circle {
  border-color: #c8733a;
  color: #c8733a;
  background: #fff8f0;
}
.step-item.done .step-circle {
  border-color: #4ade80;
  background: #f0fdf4;
  color: #16a34a;
}
.step-item span:last-child {
  font-size: 10px;
  font-weight: 600;
  color: #bbb;
  white-space: nowrap;
}
.step-item.active span:last-child {
  color: #c8733a;
}
.step-item.done span:last-child {
  color: #16a34a;
}
.step-line {
  flex: 1;
  height: 2px;
  background: #e2ddd6;
  margin: 0 4px;
  margin-bottom: 18px;
  transition: background 0.3s;
}
.step-line.done {
  background: #4ade80;
}

/* Order summary */
.order-summary {
  background: #fdfcfa;
  border: 1.5px solid #ede9e2;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.summary-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #bbb;
  margin-bottom: 12px;
}
.summary-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
}
.summary-qty {
  font-weight: 700;
  color: #aaa;
  width: 24px;
  flex-shrink: 0;
}
.summary-name {
  flex: 1;
  color: #333;
}
.summary-price {
  font-weight: 600;
  color: #1a1a1a;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #ede9e2;
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

.btn-order-again {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #c8733a;
  border: 1.5px solid #c8733a;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-order-again:hover {
  background: #c8733a;
  color: white;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(2px);
}
.modal {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
  animation: slide-up 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  max-height: 92vh;
  overflow-y: auto;
}
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Item modal */
.modal-item {
  padding-bottom: 24px;
}
.modal-close-float {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-modal-image {
  position: relative;
  height: 220px;
  overflow: hidden;
}
.item-modal-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-modal-img-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
}
.item-modal-body {
  padding: 20px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-modal-name {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}
.item-modal-desc {
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}
.item-modal-price {
  font-size: 18px;
  font-weight: 700;
  color: #c8733a;
}
.item-modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

/* Cart modal */
.modal-cart {
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0ece5;
  flex-shrink: 0;
}
.modal-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}
.modal-close {
  background: none;
  border: none;
  color: #aaa;
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
  background: #f5f3ef;
  color: #333;
}

.cart-body {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
}
.cart-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0ece5;
}
.cart-line:last-child {
  border-bottom: none;
}
.cart-line-info {
  flex: 1;
  min-width: 0;
}
.cart-line-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.cart-line-notes {
  font-size: 12px;
  color: #bbb;
  margin-top: 2px;
}
.cart-line-price {
  font-size: 13.5px;
  font-weight: 700;
  color: #c8733a;
  margin-top: 3px;
}
.cart-line-qty {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cart-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0ece5;
  background: #fdfcfa;
  flex-shrink: 0;
}
.cart-total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cart-total-label {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.cart-total-val {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

.btn-place-order {
  width: 100%;
  padding: 14px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-place-order:hover:not(:disabled) {
  background: #c8733a;
}
.btn-place-order:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.order-error {
  font-size: 13px;
  color: #dc2626;
  text-align: center;
  margin-top: 10px;
}

/* Qty controls */
.qty-control {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f5f3ef;
  border-radius: 99px;
  padding: 6px 14px;
}
.qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.qty-btn:hover {
  background: #c8733a;
  color: white;
}
.qty-btn.sm {
  width: 22px;
  height: 22px;
  font-size: 14px;
}
.qty-val {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  min-width: 16px;
  text-align: center;
}
.qty-val.sm {
  font-size: 14px;
}

.btn-add-to-cart {
  flex: 1;
  padding: 12px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-to-cart:hover {
  background: #c8733a;
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
  color: #444;
}
.optional {
  font-weight: 400;
  color: #bbb;
}
.field-input {
  width: 100%;
  padding: 9px 13px;
  border: 1.5px solid #e2ddd6;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
  background: #fdfcfa;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.field-input:focus {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
}
.field-textarea {
  resize: vertical;
  min-height: 60px;
}
</style>
