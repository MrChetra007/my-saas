<template>
  <div class="order-page">
    <!-- ── Toast ──────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
        <component :is="toast.icon" :size="15" />
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- ── Loading ──────────────────────────── -->
    <div v-if="loading" class="full-center">
      <div class="spinner" />
      <p class="loading-text">Loading menu…</p>
    </div>

    <!-- ── Not found ────────────────────────── -->
    <div v-else-if="notFound" class="full-center">
      <UtensilsCrossed :size="48" class="not-found-icon" />
      <h2 class="not-found-title">Menu not found</h2>
      <p class="not-found-sub">This QR code may be invalid or the restaurant is unavailable.</p>
    </div>

    <!-- ── Order placed (status tracker) ────── -->
    <div v-else-if="orderPlaced" class="status-screen">
      <div class="status-header">
        <div class="restaurant-logo-sm">
          <img v-if="restaurant.logo_url" :src="restaurant.logo_url" class="logo-img-sm" />
          <UtensilsCrossed v-else :size="20" class="logo-fallback-icon" />
        </div>
        <div class="restaurant-name-sm">{{ restaurant.name }}</div>
        <div class="table-badge-sm">
          <MapPin :size="11" />
          {{ tableName }}
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon-wrap">
          <div class="status-icon" :class="statusClass">
            <component :is="statusIcon" :size="36" />
          </div>
        </div>
        <h2 class="status-title">{{ statusTitle }}</h2>
        <p class="status-desc">{{ statusDesc }}</p>

        <!-- Progress steps -->
        <div class="status-steps">
          <div
            class="step-item"
            :class="{ done: orderStatus !== 'pending', active: orderStatus === 'pending' }"
          >
            <div class="step-circle">
              <Check v-if="orderStatus !== 'pending'" :size="14" />
              <span v-else>1</span>
            </div>
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
            <div class="step-circle">
              <Check v-if="['ready', 'paid'].includes(orderStatus)" :size="14" />
              <span v-else>2</span>
            </div>
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
            <div class="step-circle">
              <Check v-if="['ready', 'paid'].includes(orderStatus)" :size="14" />
              <span v-else>3</span>
            </div>
            <span>Ready!</span>
          </div>
        </div>

        <!-- Order summary -->
        <div class="order-summary">
          <div class="summary-title">Your order</div>
          <div class="summary-items">
            <div v-for="item in placedItems" :key="item.id" class="summary-item">
              <span class="summary-qty">x{{ item.quantity }}</span>
              <span class="summary-name">{{ item.name }}</span>
              <span class="summary-price">
                {{ currencySymbol }}{{ (item.unit_price * item.quantity).toFixed(2) }}
              </span>
            </div>
          </div>
          <div v-if="placedDiscountAmount > 0" class="summary-discount-row">
            <span>Discount</span>
            <span class="summary-discount-val">
              -{{ currencySymbol }}{{ placedDiscountAmount.toFixed(2) }}
            </span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <span>{{ currencySymbol }}{{ placedTotal.toFixed(2) }}</span>
          </div>
        </div>

        <button class="btn-order-again" @click="resetOrder">
          <Plus :size="15" />
          Order more items
        </button>
      </div>
    </div>

    <!-- ── Menu page ─────────────────────────── -->
    <template v-else>
      <!-- Restaurant header -->
      <div class="restaurant-header">
        <div class="restaurant-brand">
          <div class="restaurant-logo">
            <img v-if="restaurant.logo_url" :src="restaurant.logo_url" class="logo-img" />
            <UtensilsCrossed v-else :size="28" class="logo-fallback-icon" />
          </div>
          <div>
            <h1 class="restaurant-title">{{ restaurant.name }}</h1>
            <div class="table-badge">
              <MapPin :size="11" />
              {{ tableName }}
            </div>
          </div>
        </div>

        <!-- Floating flame badge — auto promo -->
        <Transition name="promo-badge">
          <div
            v-if="autoPromo && (promoCountdown || promoFlashing)"
            class="promo-flame-badge"
            :class="{ 'is-flashing': promoFlashing }"
          >
            <span class="flame-emoji">🔥</span>
            <div class="flame-badge-text">
              <span class="flame-discount">
                {{
                  autoPromo.type === 'percentage'
                    ? `${autoPromo.value}% OFF`
                    : `${currencySymbol}${autoPromo.value} OFF`
                }}
              </span>
              <span class="flame-timer">{{ promoCountdown || 'Expired!' }}</span>
            </div>
          </div>
        </Transition>

        <!-- Floating hint badge — code promo (no code revealed) -->
        <Transition name="promo-badge">
          <div v-if="codePromoHint && !appliedPromo" class="promo-code-hint-badge">
            <span class="hint-emoji">🏷️</span>
            <div class="flame-badge-text">
              <span class="hint-discount">Discount available</span>
              <span class="hint-sub">Use a code at checkout</span>
            </div>
          </div>
        </Transition>

        <!-- Auto promo announcement banner -->
        <div v-if="autoPromo" class="header-promo-banner">
          <Tag :size="14" />
          <span>
            <strong>{{ autoPromo.name }}</strong> is active —
            {{
              autoPromo.type === 'percentage'
                ? `${autoPromo.value}% off`
                : `${currencySymbol}${autoPromo.value} off`
            }}
            your order!
          </span>
        </div>
      </div>

      <!-- Category filter tabs -->
      <div class="category-tabs-wrap">
        <div class="category-tabs">
          <button
            class="cat-tab"
            :class="{ active: activeCatFilter === 'all' }"
            @click="activeCatFilter = 'all'"
          >
            <LayoutGrid :size="13" />
            All
          </button>
          <button
            v-for="cat in activeCategories"
            :key="cat.id"
            class="cat-tab"
            :class="{ active: activeCatFilter === cat.id }"
            @click="activeCatFilter = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Menu content -->
      <div class="menu-content" ref="menuContentEl">
        <template v-if="activeCatFilter === 'all'">
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
                    <div v-else class="item-thumb-placeholder">
                      <Utensils :size="24" class="thumb-placeholder-icon" />
                    </div>
                    <button
                      v-if="item.is_available"
                      class="add-btn"
                      :class="{ 'has-items': cartCount(item.id) > 0 }"
                      @click.stop="addToCart(item)"
                    >
                      <span v-if="cartCount(item.id) > 0" class="add-btn-count">{{
                        cartCount(item.id)
                      }}</span>
                      <Plus v-else :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div ref="scrollSentinel" class="scroll-sentinel" />
          <div v-if="allItemsLoaded" class="end-of-menu">
            <ChefHat :size="20" class="end-icon" />
            <span>That's our full menu!</span>
          </div>
        </template>

        <template v-else>
          <div class="cat-section">
            <div class="items-list">
              <div
                v-for="item in filteredCategoryItems"
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
                    <div v-else class="item-thumb-placeholder">
                      <Utensils :size="24" class="thumb-placeholder-icon" />
                    </div>
                    <button
                      v-if="item.is_available"
                      class="add-btn"
                      :class="{ 'has-items': cartCount(item.id) > 0 }"
                      @click.stop="addToCart(item)"
                    >
                      <span v-if="cartCount(item.id) > 0" class="add-btn-count">{{
                        cartCount(item.id)
                      }}</span>
                      <Plus v-else :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div style="height: 100px" />

      <!-- Cart bar -->
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

    <!-- ITEM DETAIL MODAL -->
    <Teleport to="body">
      <div v-if="itemModal.open" class="modal-backdrop" @click.self="itemModal.open = false">
        <div class="modal modal-item">
          <button class="modal-close-float" @click="itemModal.open = false">
            <X :size="14" />
          </button>
          <div class="item-modal-image">
            <img
              v-if="itemModal.item?.image_url"
              :src="itemModal.item.image_url"
              class="item-modal-img"
            />
            <div v-else class="item-modal-img-placeholder">
              <Utensils :size="56" class="placeholder-icon-lg" />
            </div>
          </div>
          <div class="item-modal-body">
            <h3 class="item-modal-name">{{ itemModal.item?.name }}</h3>
            <p v-if="itemModal.item?.description" class="item-modal-desc">
              {{ itemModal.item?.description }}
            </p>
            <div class="item-modal-price">
              {{ currencySymbol }}{{ Number(itemModal.item?.price).toFixed(2) }}
            </div>
            <div class="field-group">
              <label class="field-label">
                Special instructions <span class="optional">(optional)</span>
              </label>
              <textarea
                v-model="itemModal.notes"
                class="field-input field-textarea"
                placeholder="e.g. no onions, extra sauce..."
                rows="2"
              />
            </div>
            <div class="item-modal-footer">
              <div class="qty-control">
                <button class="qty-btn" @click="itemModal.qty = Math.max(1, itemModal.qty - 1)">
                  <Minus :size="14" />
                </button>
                <span class="qty-val">{{ itemModal.qty }}</span>
                <button class="qty-btn" @click="itemModal.qty++"><Plus :size="14" /></button>
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

    <!-- CART MODAL -->
    <Teleport to="body">
      <div v-if="cartOpen" class="modal-backdrop" @click.self="cartOpen = false">
        <div class="modal modal-cart">
          <div class="modal-header">
            <h2 class="modal-title">Your Order</h2>
            <button class="modal-close" @click="cartOpen = false"><X :size="15" /></button>
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
                <button class="qty-btn sm" @click="decrementCart(idx)"><Minus :size="12" /></button>
                <span class="qty-val sm">{{ line.qty }}</span>
                <button class="qty-btn sm" @click="line.qty++"><Plus :size="12" /></button>
              </div>
            </div>

            <div class="field-group" style="margin-top: 16px">
              <label class="field-label">
                Order notes <span class="optional">(optional)</span>
              </label>
              <textarea
                v-model="orderNotes"
                class="field-input field-textarea"
                placeholder="Any notes for the kitchen..."
                rows="2"
              />
            </div>

            <!-- Auto promo applied banner -->
            <div v-if="autoPromo && !appliedPromo" class="auto-promo-banner">
              <Tag :size="14" />
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

            <!-- Manual promo code input -->
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
                  {{ promoLoading ? '...' : 'Apply' }}
                </button>
              </div>
              <p v-if="promoError" class="promo-error">{{ promoError }}</p>
            </div>

            <!-- Applied code promo tag -->
            <div v-if="appliedPromo" class="applied-promo-tag">
              <CheckCircle :size="16" class="applied-check" />
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
              <button class="remove-promo-btn" @click="removePromoCode"><X :size="13" /></button>
            </div>
          </div>

          <div class="cart-footer">
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
              <span class="cart-discount-val">
                -{{ currencySymbol }}{{ discountAmount.toFixed(2) }}
              </span>
            </div>
            <div class="cart-total-row" :class="{ 'has-discount': discountAmount > 0 }">
              <span class="cart-total-label">Total</span>
              <span class="cart-total-val">{{ currencySymbol }}{{ orderTotal.toFixed(2) }}</span>
            </div>
            <button class="btn-place-order" :disabled="placing" @click="placeOrder">
              <ShoppingBag v-if="!placing" :size="16" />
              <div v-else class="btn-spinner" />
              {{
                placing
                  ? 'Placing order...'
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import {
  UtensilsCrossed,
  Utensils,
  MapPin,
  Tag,
  LayoutGrid,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle,
  ChefHat,
  ShoppingBag,
  Clock,
  XCircle,
  Flame,
} from 'lucide-vue-next'

const route = useRoute()

const restaurantIdFromUrl = route.query.rid || null

// ── Core state ────────────────────────────────────────────────────────────────
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
const activeCatFilter = ref('all')
const cartOpen = ref(false)
const menuContentEl = ref(null)
const scrollSentinel = ref(null)
const visibleCatCount = ref(2)

let statusChannel = null
let menuChannel = null
let scrollObserver = null
let promoPollingInterval = null

const resolvedRestaurantId = computed(() => restaurantIdFromUrl || restaurant.value?.id || null)
const allItemsLoaded = computed(() => visibleCatCount.value >= activeCategories.value.length)

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success', icon: CheckCircle })
let toastTimer = null

function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  const iconMap = { success: CheckCircle, error: XCircle, info: Flame, warning: Clock }
  toast.value = { show: true, message, type, icon: iconMap[type] ?? CheckCircle }
  toastTimer = setTimeout(() => (toast.value.show = false), 4000)
}

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}
function playStatusChime(type = 'cooking') {
  try {
    const ctx = getAudioCtx()
    const tonesMap = {
      cooking: [
        { freq: 523, start: 0, duration: 0.22 },
        { freq: 659, start: 0.25, duration: 0.3 },
      ],
      ready: [
        { freq: 523, start: 0, duration: 0.18 },
        { freq: 659, start: 0.2, duration: 0.18 },
        { freq: 784, start: 0.4, duration: 0.35 },
      ],
      rejected: [{ freq: 311, start: 0, duration: 0.4 }],
    }
    const tones = tonesMap[type] || tonesMap.cooking
    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + start
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
      osc.start(t)
      osc.stop(t + duration + 0.05)
    })
  } catch (e) {
    console.warn('Chime failed:', e)
  }
}

// ── Cart state ────────────────────────────────────────────────────────────────
const cart = ref([])
const cartItemCount = computed(() => cart.value.reduce((n, l) => n + l.qty, 0))
const cartSubtotal = computed(() => cart.value.reduce((n, l) => n + l.price * l.qty, 0))

// ── Promotion state ───────────────────────────────────────────────────────────
const promoInput = ref('')
const appliedPromoCode = ref('')
const promoError = ref('')
const promoLoading = ref(false)
const appliedPromo = ref(null) // manually entered & validated code promo
const autoPromo = ref(null) // is_auto=true: applied live in cart
const codePromoHint = ref(null) // is_auto=false: hint badge only, no value shown

// ── Discount calculation ──────────────────────────────────────────────────────
// Auto promos are always live. Code promos only count after the user applies them.
const discountAmount = computed(() => {
  const promo = appliedPromo.value || autoPromo.value
  if (!promo || cartSubtotal.value === 0) return 0
  const val = Number(promo.value)
  if (promo.type === 'percentage') return Math.round(cartSubtotal.value * val) / 100
  return Math.min(val, cartSubtotal.value)
})

const orderTotal = computed(() => Math.max(0, cartSubtotal.value - discountAmount.value))

const placedTotal = computed(() =>
  Math.max(
    0,
    placedItems.value.reduce((n, i) => n + i.unit_price * i.quantity, 0) -
      placedDiscountAmount.value,
  ),
)

// ── Currency ──────────────────────────────────────────────────────────────────
const currencySymbol = computed(() => {
  const currency = restaurant.value.currency || 'USD'
  const map = { USD: '$', EUR: '€', GBP: '£', KHR: '៛', THB: '฿', SGD: 'S$', AUD: 'A$', JPY: '¥' }
  if (map[currency]) return map[currency]
  const spaceIndex = currency.indexOf(' ')
  if (spaceIndex !== -1) return currency.slice(0, spaceIndex)
  return currency || '$'
})

// ── Categories ────────────────────────────────────────────────────────────────
const activeCategories = computed(() =>
  categories.value.filter((c) => c.is_active && c.items?.length > 0),
)
const filteredCategoryItems = computed(() => {
  if (activeCatFilter.value === 'all') return []
  const cat = activeCategories.value.find((c) => c.id === activeCatFilter.value)
  return cat?.items || []
})

// ── Order status helpers ──────────────────────────────────────────────────────
const statusIcon = computed(() => {
  if (orderStatus.value === 'pending') return Clock
  if (orderStatus.value === 'cooking') return ChefHat
  if (orderStatus.value === 'ready') return CheckCircle
  if (orderStatus.value === 'rejected') return X
  return CheckCircle
})
const statusClass = computed(() => ({
  'status-pending': orderStatus.value === 'pending',
  'status-cooking': orderStatus.value === 'cooking',
  'status-ready': ['ready', 'paid'].includes(orderStatus.value),
  'status-rejected': orderStatus.value === 'rejected',
}))
const statusTitle = computed(() => {
  if (orderStatus.value === 'pending') return 'Order received!'
  if (orderStatus.value === 'cooking') return 'Being prepared...'
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

function handleStatusChange(newStatus) {
  orderStatus.value = newStatus
  if (newStatus === 'cooking') {
    playStatusChime('cooking')
    showToast('Kitchen accepted your order — now cooking! 🍳', 'info')
  }
  if (newStatus === 'ready') {
    playStatusChime('ready')
    showToast('Your order is ready for pickup! 🎉', 'success')
  }
  if (newStatus === 'rejected') {
    playStatusChime('rejected')
    showToast('Your order was not accepted. Please ask staff.', 'error')
  }
}

// ── Promo countdown (for auto promos with ends_at) ────────────────────────────
const promoCountdown = ref('')
const promoFlashing = ref(false)
let countdownInterval = null

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval)

  if (!autoPromo.value?.ends_at) {
    promoCountdown.value = '∞'
    return
  }

  const tick = () => {
    // Combine today's date with the time-only string from Supabase e.g. "06:00:00"
    const todayDate = new Date().toISOString().split('T')[0] // "2026-03-02"
    const endsAt = new Date(`${todayDate}T${autoPromo.value.ends_at}`)

    const ms = endsAt - Date.now()
    if (ms <= 0) {
      promoCountdown.value = ''
      clearInterval(countdownInterval)
      countdownInterval = null
      promoFlashing.value = true
      setTimeout(() => {
        promoFlashing.value = false
        autoPromo.value = null
      }, 1200)
      return
    }
    promoCountdown.value = formatCountdown(ms)
  }

  tick()
  countdownInterval = setInterval(tick, 1000)
}

watch(autoPromo, (val) => {
  if (val) {
    startCountdown()
  } else {
    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = null
    promoCountdown.value = ''
    promoFlashing.value = false
  }
})

// ── Unified promotion check ───────────────────────────────────────────────────
// Runs on mount + every 60s. Queries promotions table directly.
//   is_auto = true  → 🔥 flame badge + live cart discount
//   is_auto = false → 🏷️ hint badge only (no discount until code entered)
async function checkPromotion() {
  const rid = resolvedRestaurantId.value
  if (!rid) return

  const { data, error } = await supabase
    .from('promotions')
    .select('id, name, type, value, code, ends_at, is_auto')
    .eq('restaurant_id', rid)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[checkPromotion] error:', error.message)
    return
  }

  if (!data) {
    if (autoPromo.value) showToast('The automatic discount has ended.', 'warning')
    autoPromo.value = null
    codePromoHint.value = null
    return
  }

  // Filter expired promos client-side — avoids PostgREST or() syntax issues with timestamps
  if (data.ends_at) {
    const todayDate = new Date().toISOString().split('T')[0]
    const endsAt = new Date(`${todayDate}T${data.ends_at}`)
    if (endsAt < new Date()) {
      if (autoPromo.value) showToast('The automatic discount has ended.', 'warning')
      autoPromo.value = null
      codePromoHint.value = null
      return
    }
  }
  data.value = Number(data.value)

  if (data.is_auto) {
    codePromoHint.value = null
    if (!autoPromo.value || autoPromo.value.id !== data.id) {
      if (autoPromo.value !== null) showToast(`🎉 "${data.name}" discount is now active!`, 'info')
      autoPromo.value = data
    }
  } else {
    // Code-type: hint only — never reveal the code or auto-apply
    autoPromo.value = null
    if (!codePromoHint.value || codePromoHint.value.id !== data.id) {
      codePromoHint.value = data
    }
  }
}

function startPromoPolling() {
  if (promoPollingInterval) clearInterval(promoPollingInterval)
  promoPollingInterval = setInterval(checkPromotion, 60_000)
}

// ── Manual promo code ─────────────────────────────────────────────────────────
async function applyPromoCode() {
  promoError.value = ''
  if (!promoInput.value.trim()) return

  const rid = resolvedRestaurantId.value
  if (!rid) {
    promoError.value = 'Unable to validate code. Please try again.'
    return
  }

  promoLoading.value = true
  const { data, error } = await supabase.rpc('validate_promotion', {
    p_restaurant_id: rid,
    p_code: promoInput.value.trim(),
    p_order_total: cartSubtotal.value,
  })
  promoLoading.value = false

  if (error || !data || data.length === 0) {
    promoError.value = 'Invalid or expired code.'
    return
  }

  data[0].value = Number(data[0].value)
  appliedPromo.value = data[0]
  appliedPromoCode.value = promoInput.value.trim().toUpperCase()
  promoInput.value = ''
  promoError.value = ''
  codePromoHint.value = null // hide hint once code applied
}

function removePromoCode() {
  appliedPromo.value = null
  appliedPromoCode.value = ''
  promoError.value = ''
  checkPromotion() // re-check so hint badge can reappear
}

// ── Cart helpers ──────────────────────────────────────────────────────────────
function cartCount(itemId) {
  return cart.value.filter((l) => l.itemId === itemId).reduce((n, l) => n + l.qty, 0)
}

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
  if (existing) existing.qty += qty
  else cart.value.push({ itemId: item.id, name: item.name, price: Number(item.price), qty, notes })
  itemModal.value.open = false
}

function decrementCart(idx) {
  if (cart.value[idx].qty <= 1) cart.value.splice(idx, 1)
  else cart.value[idx].qty--
}

function openCart() {
  checkPromotion()
  cartOpen.value = true
}

function resetOrder() {
  orderPlaced.value = false
  cart.value = []
  orderNotes.value = ''
  placedItems.value = []
  placedDiscountAmount.value = 0
  appliedPromo.value = null
  appliedPromoCode.value = ''
  autoPromo.value = null
  codePromoHint.value = null
  if (statusChannel) {
    supabase.removeChannel(statusChannel)
    statusChannel = null
  }
  checkPromotion()
  startPromoPolling()
}

// ── Infinite scroll ───────────────────────────────────────────────────────────
function setupInfiniteScroll() {
  if (!scrollSentinel.value) return
  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !allItemsLoaded.value) visibleCatCount.value += 2
    },
    { threshold: 0.1 },
  )
  scrollObserver.observe(scrollSentinel.value)
}

// ── Real-time menu availability ───────────────────────────────────────────────
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
            )
              itemModal.value.open = false
            if (!updated.is_available)
              cart.value = cart.value.filter((l) => l.itemId !== updated.id)
            break
          }
        }
      },
    )
    .subscribe()
}

// ── Mount ─────────────────────────────────────────────────────────────────────
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

  loading.value = false
  subscribeToMenuAvailability(rest.id)

  await checkPromotion()
  startPromoPolling()

  setTimeout(() => setupInfiniteScroll(), 400)
})

onUnmounted(() => {
  if (statusChannel) supabase.removeChannel(statusChannel)
  if (menuChannel) supabase.removeChannel(menuChannel)
  if (scrollObserver) scrollObserver.disconnect()
  if (audioCtx) audioCtx.close()
  if (toastTimer) clearTimeout(toastTimer)
  if (promoPollingInterval) clearInterval(promoPollingInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})

// ── Place order ───────────────────────────────────────────────────────────────
async function placeOrder() {
  if (cart.value.length === 0) return
  placing.value = true
  orderError.value = ''

  try {
    const usedPromo = appliedPromo.value || autoPromo.value
    const finalDiscount = discountAmount.value
    const finalTotal = orderTotal.value
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

    const { error: itemsError } = await supabase.from('order_items').insert(
      cart.value.map((line) => ({
        order_id: orderId,
        menu_item_id: line.itemId,
        quantity: line.qty,
        unit_price: line.price,
        notes: line.notes || null,
      })),
    )
    if (itemsError) throw itemsError

    if (usedPromo) await supabase.rpc('apply_promotion_to_order', { p_promotion_id: usedPromo.id })

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

    if (promoPollingInterval) {
      clearInterval(promoPollingInterval)
      promoPollingInterval = null
    }
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }

    statusChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          handleStatusChange(payload.new.status)
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

/* ── Toast ───────────────────────────────────────────────────────────────────*/
.toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  pointer-events: none;
  font-family: 'DM Sans', sans-serif;
}
.toast--success {
  background: rgba(74, 222, 128, 0.18);
  border: 1px solid rgba(74, 222, 128, 0.35);
  color: #4ade80;
}
.toast--error {
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
}
.toast--info {
  background: rgba(200, 115, 58, 0.18);
  border: 1px solid rgba(200, 115, 58, 0.35);
  color: #e08040;
}
.toast--warning {
  background: rgba(250, 204, 21, 0.18);
  border: 1px solid rgba(250, 204, 21, 0.35);
  color: #facc15;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) scale(0.92);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px) scale(0.95);
}

/* ── Page shell ──────────────────────────────────────────────────────────────*/
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
@media (min-width: 640px) {
  .order-page {
    max-width: 640px;
    box-shadow: 0 0 80px rgba(200, 115, 58, 0.14);
  }
}

.full-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
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
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}
.not-found-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
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

/* ── Restaurant header ───────────────────────────────────────────────────────*/
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
  }
}

.restaurant-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 130px;
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
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-fallback-icon {
  color: rgba(255, 255, 255, 0.3);
}
.restaurant-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.table-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
}
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

/* ── Flame badge (auto promo) ────────────────────────────────────────────────*/
.promo-flame-badge {
  position: absolute;
  top: 24px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(200, 115, 58, 0.22));
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  animation: flame-pulse 2s ease-in-out infinite;
  font-family: 'DM Sans', sans-serif;
  pointer-events: none;
  z-index: 30;
}
@media (min-width: 640px) {
  .promo-flame-badge {
    right: 24px;
    top: 32px;
  }
}
.promo-flame-badge.is-flashing {
  animation: flash-out 0.25s ease-in-out infinite;
}

.flame-emoji {
  font-size: 20px;
  line-height: 1;
  animation: flame-flicker 0.8s ease-in-out infinite alternate;
}
.flame-badge-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.flame-discount {
  font-size: 12px;
  font-weight: 800;
  color: #ff6b6b;
  letter-spacing: 0.04em;
  line-height: 1;
}
.flame-timer {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 180, 120, 0.9);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
}

@keyframes flame-pulse {
  0%,
  100% {
    box-shadow:
      0 4px 20px rgba(239, 68, 68, 0.25),
      0 0 0 0 rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow:
      0 4px 20px rgba(239, 68, 68, 0.38),
      0 0 0 6px rgba(239, 68, 68, 0);
  }
}
@keyframes flame-flicker {
  from {
    transform: rotate(-5deg) scale(0.95);
  }
  to {
    transform: rotate(5deg) scale(1.05);
  }
}
@keyframes flash-out {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.08;
  }
}

/* ── Hint badge (code promo) ─────────────────────────────────────────────────*/
.promo-code-hint-badge {
  position: absolute;
  top: 24px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.12), rgba(200, 115, 58, 0.14));
  border: 1.5px solid rgba(250, 204, 21, 0.3);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  animation: hint-pulse 3s ease-in-out infinite;
  font-family: 'DM Sans', sans-serif;
  pointer-events: none;
  z-index: 30;
}
@media (min-width: 640px) {
  .promo-code-hint-badge {
    right: 24px;
    top: 32px;
  }
}

.hint-emoji {
  font-size: 18px;
  line-height: 1;
}
.hint-discount {
  font-size: 12px;
  font-weight: 800;
  color: #facc15;
  letter-spacing: 0.04em;
  line-height: 1;
}
.hint-sub {
  font-size: 11px;
  font-weight: 600;
  color: rgba(250, 204, 21, 0.7);
  line-height: 1;
}

@keyframes hint-pulse {
  0%,
  100% {
    box-shadow:
      0 4px 16px rgba(250, 204, 21, 0.15),
      0 0 0 0 rgba(250, 204, 21, 0.2);
  }
  50% {
    box-shadow:
      0 4px 16px rgba(250, 204, 21, 0.25),
      0 0 0 5px rgba(250, 204, 21, 0);
  }
}

/* Badge transition (shared by both badges) */
.promo-badge-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.promo-badge-leave-active {
  transition: all 0.35s ease;
}
.promo-badge-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.8);
}
.promo-badge-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.88);
}

/* ── Category tabs ───────────────────────────────────────────────────────────*/
.category-tabs-wrap {
  position: sticky;
  top: 104px;
  z-index: 15;
  background: #111111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
@media (min-width: 640px) {
  .category-tabs-wrap {
    top: 132px;
  }
}
.category-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 10px 12px;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}
.cat-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'DM Sans', sans-serif;
  flex-shrink: 0;
}
.cat-tab:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
}
.cat-tab.active {
  color: #ffffff;
  background: #c8733a;
  border-color: #c8733a;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

/* ── Menu ────────────────────────────────────────────────────────────────────*/
.menu-content {
  padding: 0 16px 24px;
}
@media (min-width: 640px) {
  .menu-content {
    padding: 0 24px 32px;
  }
}
.cat-section {
  padding-top: 28px;
}
.cat-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 14px;
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
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.thumb-placeholder-icon {
  color: rgba(255, 255, 255, 0.15);
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
  width: 36px;
  height: 36px;
  font-size: 13px;
  font-weight: 700;
}
.add-btn-count {
  font-size: 13px;
  font-weight: 700;
}
.scroll-sentinel {
  height: 1px;
}
.end-of-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}
.end-icon {
  color: rgba(255, 255, 255, 0.2);
}

/* ── Cart bar ─────────────────────────────────────────────────────────────── */
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

/* ── Status screen ───────────────────────────────────────────────────────────*/
.status-screen {
  min-height: 100vh;
  background: #111111;
  padding: 0 16px 40px;
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
.restaurant-name-sm {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}
.table-badge-sm {
  display: flex;
  align-items: center;
  gap: 5px;
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
}
.status-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32px;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.3);
}

/* ── Modals ───────────────────────────────────────────────────────────────── */
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
}
.placeholder-icon-lg {
  color: rgba(255, 255, 255, 0.1);
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
.applied-check {
  color: #4ade80;
  flex-shrink: 0;
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
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.order-error {
  font-size: 14px;
  color: #dc2626;
  text-align: center;
  margin-top: 12px;
}

/* ── Controls ─────────────────────────────────────────────────────────────── */
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
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: #161616;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.qty-btn:hover {
  background: #c8733a;
  border-color: #c8733a;
  color: white;
}
.qty-btn.sm {
  width: 28px;
  height: 28px;
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
}

/* ── Form fields ──────────────────────────────────────────────────────────── */
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

@keyframes float-card {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .cart-bar {
    bottom: calc(20px + env(safe-area-inset-bottom));
  }
  .modal {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
