<template>
  <div class="order-page">
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
          <!-- Discount line in status summary -->
          <div v-if="placedDiscountAmount > 0" class="summary-discount-row">
            <span>Discount</span>
            <span class="summary-discount-val"
              >−{{ currencySymbol }}{{ placedDiscountAmount.toFixed(2) }}</span
            >
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

        <!-- Auto promo announcement in header -->
        <div v-if="autoPromo" class="header-promo-banner">
          🎉 <strong>{{ autoPromo.name }}</strong> is active —
          {{
            autoPromo.type === 'percentage'
              ? `${autoPromo.value}% off`
              : `${currencySymbol}${autoPromo.value} off`
          }}
          your order!
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
          <span class="cart-bar-total">{{ currencySymbol }}{{ orderTotal.toFixed(2) }}</span>
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

            <!-- ── PROMO SECTION ─────────────────── -->
            <!-- Auto promo banner -->
            <div v-if="autoPromo && !appliedPromo" class="auto-promo-banner">
              <span>🎉</span>
              <div>
                <strong>{{ autoPromo.name }}</strong> applied automatically —
                <span class="auto-promo-value">
                  {{
                    autoPromo.type === 'percentage'
                      ? `${autoPromo.value}% off`
                      : `${currencySymbol}${autoPromo.value} off`
                  }}
                </span>
              </div>
            </div>

            <!-- Code input -->
            <div v-if="!appliedPromo" class="promo-section">
              <div class="promo-input-row">
                <input
                  v-model="promoInput"
                  type="text"
                  placeholder="Discount code"
                  class="field-input promo-input"
                  @keyup.enter="applyPromoCode"
                  @input="promoInput = promoInput.toUpperCase()"
                  :disabled="promoLoading"
                />
                <button
                  class="promo-apply-btn"
                  @click="applyPromoCode"
                  :disabled="promoLoading || !promoInput.trim()"
                >
                  {{ promoLoading ? '…' : 'Apply' }}
                </button>
              </div>
              <p v-if="promoError" class="promo-error">{{ promoError }}</p>
            </div>

            <!-- Applied code tag -->
            <div v-if="appliedPromo" class="applied-promo-tag">
              <span>✅</span>
              <div class="applied-info">
                <span class="applied-code">{{ appliedPromoCode }}</span>
                <span class="applied-desc">
                  {{
                    appliedPromo.type === 'percentage'
                      ? `${appliedPromo.value}% off`
                      : `${currencySymbol}${appliedPromo.value} off`
                  }}
                  — saving {{ currencySymbol }}{{ discountAmount.toFixed(2) }}
                </span>
              </div>
              <button class="remove-promo-btn" @click="removePromoCode">✕</button>
            </div>
            <!-- ── END PROMO SECTION ─────────────── -->
          </div>

          <div class="cart-footer">
            <!-- Totals breakdown -->
            <div v-if="discountAmount > 0" class="cart-subtotal-row">
              <span class="cart-total-label">Subtotal</span>
              <span class="cart-total-val">{{ currencySymbol }}{{ cartSubtotal.toFixed(2) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="cart-discount-row">
              <span class="cart-discount-label">
                Discount
                <span class="discount-pill">
                  {{
                    (appliedPromo || autoPromo).type === 'percentage'
                      ? `${(appliedPromo || autoPromo).value}%`
                      : 'Fixed'
                  }}
                </span>
              </span>
              <span class="cart-discount-val"
                >−{{ currencySymbol }}{{ discountAmount.toFixed(2) }}</span
              >
            </div>
            <div class="cart-total-row" :class="{ 'has-discount': discountAmount > 0 }">
              <span class="cart-total-label">Total</span>
              <span class="cart-total-val">{{ currencySymbol }}{{ orderTotal.toFixed(2) }}</span>
            </div>

            <button class="btn-place-order" :disabled="placing" @click="placeOrder">
              {{
                placing
                  ? 'Placing order…'
                  : `Place Order · ${currencySymbol}${orderTotal.toFixed(2)}`
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
// Add this import at the top of your script
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const restaurant = ref({})
const categories = ref([])
const tableName = ref('')
const tableId = ref('')
const orderPlaced = ref(false)
const placedItems = ref([])
const placedDiscountAmount = ref(0)
const orderStatus = ref('pending')
const orderNotes = ref('')
const orderError = ref('')
const placing = ref(false)
const activeCatId = ref(null)
const cartOpen = ref(false)
const tabsEl = ref(null)
let statusChannel = null
let menuChannel = null

// ── Cart ─────────────────────────────────────
const cart = ref([])

const cartItemCount = computed(() => cart.value.reduce((n, l) => n + l.qty, 0))

// Subtotal before discount
const cartSubtotal = computed(() => cart.value.reduce((n, l) => n + l.price * l.qty, 0))

// ── Promotions ───────────────────────────────
const promoInput = ref('')
const appliedPromoCode = ref('')
const promoError = ref('')
const promoLoading = ref(false)
const appliedPromo = ref(null) // manually entered code promo
const autoPromo = ref(null) // time-based auto promo

const discountAmount = computed(() => {
  const promo = appliedPromo.value || autoPromo.value
  if (!promo || cartSubtotal.value === 0) return 0
  if (promo.type === 'percentage') {
    return Math.round(cartSubtotal.value * promo.value) / 100
  }
  return Math.min(promo.value, cartSubtotal.value)
})

// Final total shown to customer and sent to DB
const orderTotal = computed(() => Math.max(0, cartSubtotal.value - discountAmount.value))

// Legacy: placedTotal now reads from orderTotal snapshot stored at order time
const placedTotal = computed(
  () =>
    placedItems.value.reduce((n, i) => n + i.unit_price * i.quantity, 0) -
    placedDiscountAmount.value,
)

async function checkAutoPromotions() {
  const { data } = await supabase.rpc('get_active_auto_promotions', {
    p_restaurant_id: restaurant.value.id,
  })
  if (data && data.length > 0) {
    autoPromo.value = data[0]
  }
}

async function applyPromoCode() {
  promoError.value = ''
  if (!promoInput.value.trim()) return

  promoLoading.value = true
  const { data, error } = await supabase.rpc('validate_promotion', {
    p_restaurant_id: restaurant.value.id,
    p_code: promoInput.value.trim(),
    p_order_total: cartSubtotal.value,
  })
  promoLoading.value = false

  if (error || !data || data.length === 0) {
    promoError.value = 'Invalid or expired code.'
    return
  }

  appliedPromo.value = data[0]
  appliedPromoCode.value = promoInput.value.trim().toUpperCase()
  promoInput.value = ''
  promoError.value = ''
}

function removePromoCode() {
  appliedPromo.value = null
  appliedPromoCode.value = ''
  promoError.value = ''
}

// ── Currency ─────────────────────────────────
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
  placedDiscountAmount.value = 0
  appliedPromo.value = null
  appliedPromoCode.value = ''
  autoPromo.value = null
  if (statusChannel) {
    supabase.removeChannel(statusChannel)
    statusChannel = null
  }
}

// ── Real-time menu availability ──────────────
function subscribeToMenuAvailability(restaurantId) {
  menuChannel = supabase
    .channel(`menu-availability-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'menu_items',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        const updated = payload.new
        for (const cat of categories.value) {
          const item = cat.items?.find((i) => i.id === updated.id)
          if (item) {
            item.is_available = updated.is_available
            if (
              !updated.is_available &&
              itemModal.value.open &&
              itemModal.value.item?.id === updated.id
            ) {
              itemModal.value.open = false
            }
            if (!updated.is_available) {
              cart.value = cart.value.filter((l) => l.itemId !== updated.id)
            }
            break
          }
        }
      },
    )
    .subscribe()
}

// ── Load menu ────────────────────────────────
onMounted(async () => {
  const slug = route.params.slug
  tableId.value = route.params.tableId

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

  subscribeToMenuAvailability(rest.id)

  // Check for active auto-promotions (e.g. happy hour)
  await checkAutoPromotions()

  setTimeout(() => setupObserver(), 300)
})

onUnmounted(() => {
  if (statusChannel) supabase.removeChannel(statusChannel)
  if (menuChannel) supabase.removeChannel(menuChannel)
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
    const usedPromo = appliedPromo.value || autoPromo.value
    const finalDiscount = discountAmount.value
    const finalTotal = orderTotal.value
    // ✅ Generate ID before insert — no fetch needed
    const orderId = uuidv4()

    const { error: orderErr } = await supabase.from('orders').insert({
      id: orderId,
      restaurant_id: restaurant.value.id,
      table_id: tableId.value,
      status: 'pending',
      total_amount: finalTotal,
      notes: orderNotes.value || null,
      promotion_id: usedPromo?.id || null,
      discount_code: appliedPromo.value ? appliedPromoCode.value : null,
      discount_amount: finalDiscount,
    })

    if (orderErr) throw orderErr

    const order = { id: orderId }

    const orderItemsPayload = cart.value.map((line) => ({
      order_id: order.id,
      menu_item_id: line.itemId,
      quantity: line.qty,
      unit_price: line.price,
      notes: line.notes || null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)
    if (itemsError) throw itemsError

    // Increment promotion usage count
    if (usedPromo) {
      await supabase.rpc('apply_promotion_to_order', { p_promotion_id: usedPromo.id })
    }

    // Snapshot for status screen
    placedItems.value = cart.value.map((line) => ({
      id: line.itemId,
      name: line.name,
      unit_price: line.price,
      quantity: line.qty,
    }))
    placedDiscountAmount.value = finalDiscount

    cartOpen.value = false
    orderPlaced.value = true
    orderStatus.value = 'pending'

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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.order-page {
  min-height: 100vh;
  background: #111111;
  font-family: 'DM Sans', sans-serif;
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

/* Responsive container for larger screens */
@media (min-width: 640px) {
  .order-page {
    max-width: 640px;
    box-shadow: 0 0 80px rgba(200, 115, 58, 0.14);
  }
}

/* Loading / not found */
.full-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: #111111;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.07);
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.not-found-icon {
  font-size: 56px;
  margin-bottom: 8px;
}

.not-found-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.not-found-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
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
  padding: 24px 16px 20px;
  background: #161616;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
  z-index: 20;
}

@media (min-width: 640px) {
  .restaurant-header {
    padding: 32px 24px 24px;
    border-radius: 0 0 16px 16px;
    margin-bottom: 8px;
  }
}

.restaurant-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.restaurant-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: #0e0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

@media (min-width: 640px) {
  .restaurant-logo {
    width: 64px;
    height: 64px;
    border-radius: 14px;
  }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-emoji-lg {
  font-size: 28px;
}

.restaurant-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .restaurant-title {
    font-size: 28px;
  }
}

.table-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
}

/* Auto promo header banner */
.header-promo-banner {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 10px;
  font-size: 13px;
  color: #d4844e;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-promo-banner strong {
  color: #c8733a;
  font-weight: 700;
}

/* Category tabs */
.category-tabs-wrap {
  position: sticky;
  top: 104px;
  z-index: 15;
  background: #111111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  padding: 4px 0;
}

@media (min-width: 640px) {
  .category-tabs-wrap {
    top: 132px;
    padding: 8px 0;
  }
}

.category-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 12px;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.cat-tab {
  padding: 10px 16px;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'DM Sans', sans-serif;
}

.cat-tab:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
}

.cat-tab.active {
  color: #ffffff;
  background: #c8733a;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

/* Menu content */
.menu-content {
  padding: 0 16px 24px;
}

@media (min-width: 640px) {
  .menu-content {
    padding: 0 24px 32px;
  }
}

.cat-section {
  padding-top: 32px;
  scroll-margin-top: 140px;
}

@media (min-width: 640px) {
  .cat-section {
    scroll-margin-top: 160px;
  }
}

.cat-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin-left: 8px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item-row:hover:not(.out-of-stock) {
  background: #1a1a1a;
  border-color: rgba(200, 115, 58, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.menu-item-row.out-of-stock {
  opacity: 0.4;
  cursor: default;
  background: #0e0e0e;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  color: #ffffff;
  line-height: 1.3;
}

.sold-out-tag {
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.3);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.item-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  font-size: 15px;
  font-weight: 700;
  color: #c8733a;
  margin-top: 4px;
}

.item-right {
  flex-shrink: 0;
}

.item-thumb-wrap {
  position: relative;
  width: 80px;
  height: 80px;
}

@media (min-width: 640px) {
  .item-thumb-wrap {
    width: 96px;
    height: 96px;
  }
}

.item-thumb {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.item-thumb-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #0e0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.add-btn {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #c8733a;
  color: white;
  border: 2px solid #161616;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: #d4844e;
  transform: scale(1.1);
}

.add-btn.has-items {
  background: #c8733a;
  width: 36px;
  height: 36px;
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
  background: #c8733a;
  color: white;
  border-radius: 14px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow:
    0 24px 56px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(200, 115, 58, 0.3);
  z-index: 50;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cart-bar:hover {
  background: #d4844e;
  transform: translateX(-50%) translateY(-2px);
  box-shadow:
    0 28px 64px rgba(0, 0, 0, 0.5),
    0 12px 32px rgba(200, 115, 58, 0.4);
}

.cart-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-count-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.cart-bar-label {
  font-size: 15px;
  font-weight: 600;
}

.cart-bar-total {
  font-size: 16px;
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
  background: #111111;
  padding: 0 16px 40px;
}

@media (min-width: 640px) {
  .status-screen {
    padding: 0 24px 40px;
  }
}

.status-header {
  padding: 32px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.restaurant-logo-sm {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #161616;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.logo-img-sm {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-emoji {
  font-size: 24px;
}

.restaurant-name-sm {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.table-badge-sm {
  font-size: 12px;
  font-weight: 600;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
}

.status-card {
  background: #161616;
  border-radius: 16px;
  padding: 32px 24px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  max-width: 480px;
  margin: 0 auto;
}

.status-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.status-icon {
  font-size: 40px;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  animation: float-card 4s ease-in-out infinite;
}

.status-pending {
  background: rgba(250, 204, 21, 0.1);
  border-color: rgba(250, 204, 21, 0.3);
  color: #facc15;
}

.status-cooking {
  background: rgba(200, 115, 58, 0.1);
  border-color: rgba(200, 115, 58, 0.3);
  color: #c8733a;
}

.status-ready {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.3);
  color: #4ade80;
}

.status-rejected {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
  color: #dc2626;
}

.status-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.status-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32px;
}

/* Progress steps */
.status-steps {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 0;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  background: #161616;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-item.active .step-circle {
  border-color: #c8733a;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.12);
  box-shadow: 0 0 0 4px rgba(200, 115, 58, 0.1);
}

.step-item.done .step-circle {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

.step-item span:last-child {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.step-item.active span:last-child {
  color: #c8733a;
}

.step-item.done span:last-child {
  color: #4ade80;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 8px;
  margin-bottom: 24px;
  transition: background 0.3s ease;
  border-radius: 1px;
}

.step-line.done {
  background: #4ade80;
}

/* Order summary */
.order-summary {
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 16px;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.summary-qty {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  width: 28px;
  flex-shrink: 0;
}

.summary-name {
  flex: 1;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.summary-price {
  font-weight: 600;
  color: #ffffff;
}

.summary-discount-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  color: #4ade80;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
}

.summary-discount-val {
  font-weight: 700;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.btn-order-again {
  width: 100%;
  padding: 14px;
  background: transparent;
  color: #c8733a;
  border: 1.5px solid rgba(200, 115, 58, 0.45);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-order-again:hover {
  background: #c8733a;
  color: #ffffff;
  border-color: #c8733a;
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.3);
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(8px);
}

@media (min-width: 640px) {
  .modal-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.modal {
  background: #161616;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
  animation: slide-up 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  max-height: 92vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom: none;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    max-height: 85vh;
  }
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

.modal-item {
  padding-bottom: 24px;
}

.modal-close-float {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close-float:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.item-modal-image {
  position: relative;
  height: 240px;
  overflow: hidden;
  background: #0e0e0e;
}

@media (min-width: 640px) {
  .item-modal-image {
    height: 300px;
    border-radius: 20px 20px 0 0;
  }
}

.item-modal-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-modal-img-placeholder {
  width: 100%;
  height: 100%;
  background: #0e0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
}

.item-modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-modal-name {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.item-modal-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
}

.item-modal-price {
  font-size: 20px;
  font-weight: 700;
  color: #c8733a;
}

.item-modal-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.modal-cart {
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

@media (min-width: 640px) {
  .modal-cart {
    border-radius: 20px;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.modal-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.modal-close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.55);
  font-size: 16px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.cart-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

.cart-line {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.cart-line:last-child {
  border-bottom: none;
}

.cart-line-info {
  flex: 1;
  min-width: 0;
}

.cart-line-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.cart-line-notes {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
  font-style: italic;
}

.cart-line-price {
  font-size: 14px;
  font-weight: 700;
  color: #c8733a;
  margin-top: 4px;
}

.cart-line-qty {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  background: #0e0e0e;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

/* ── Promo styles ── */
.auto-promo-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 12px;
  font-size: 14px;
  color: #d4844e;
  line-height: 1.5;
}

.auto-promo-value {
  font-weight: 700;
  color: #c8733a;
}

.promo-section {
  margin-top: 16px;
}

.promo-input-row {
  display: flex;
  gap: 10px;
}

.promo-input {
  flex: 1;
  font-family: 'Courier New', monospace !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: #0e0e0e !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

.promo-input:focus {
  border-color: #c8733a !important;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15) !important;
}

.promo-apply-btn {
  background: rgba(200, 115, 58, 0.12);
  border: 1.5px solid rgba(200, 115, 58, 0.25);
  border-radius: 10px;
  color: #c8733a;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.promo-apply-btn:hover:not(:disabled) {
  background: #c8733a;
  color: #ffffff;
  border-color: #c8733a;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

.promo-apply-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.promo-error {
  font-size: 13px;
  color: #dc2626;
  margin-top: 8px;
}

.applied-promo-tag {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 12px;
}

.applied-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.applied-code {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 14px;
  color: #4ade80;
  letter-spacing: 0.08em;
}

.applied-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
}

.remove-promo-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  font-size: 14px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-promo-btn:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.3);
}

/* Cart footer totals */
.cart-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: #0e0e0e;
  flex-shrink: 0;
  border-radius: 0 0 20px 20px;
}

.cart-subtotal-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.cart-discount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #4ade80;
}

.cart-discount-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.discount-pill {
  background: rgba(74, 222, 128, 0.15);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.cart-discount-val {
  font-weight: 700;
}

.cart-total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.cart-total-row.has-discount {
  padding-top: 16px;
}

.cart-total-label {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
}

.cart-total-val {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.btn-place-order {
  width: 100%;
  padding: 16px;
  background: #c8733a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

.btn-place-order:hover:not(:disabled) {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
}

.btn-place-order:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.order-error {
  font-size: 14px;
  color: #dc2626;
  text-align: center;
  margin-top: 12px;
}

/* Qty controls */
.qty-control {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #0e0e0e;
  border-radius: 999px;
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #161616;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.qty-btn:hover {
  background: #c8733a;
  border-color: #c8733a;
  color: white;
}

.qty-btn.sm {
  width: 28px;
  height: 28px;
  font-size: 16px;
}

.qty-val {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  min-width: 24px;
  text-align: center;
}

.qty-val.sm {
  font-size: 15px;
  min-width: 20px;
}

.btn-add-to-cart {
  flex: 1;
  padding: 14px;
  background: #c8733a;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

.btn-add-to-cart:hover {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
}

/* Fields */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.optional {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.35);
}

.field-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  background: #0e0e0e;
  outline: none;
  transition: all 0.2s ease;
}

.field-input:focus {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

/* Animation keyframes */
@keyframes float-card {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Safe area for iPhone notch */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .cart-bar {
    bottom: calc(20px + env(safe-area-inset-bottom));
  }

  .modal {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
