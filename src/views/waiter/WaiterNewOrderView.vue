<template>
  <div class="new-order-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">New Order</h1>
        <p class="page-subtitle">Select a table, browse the menu and place the order</p>
      </div>
      <div v-if="selectedTable" class="table-indicator">
        <MapPin class="indicator-icon" />
        <span>{{ selectedTable.name }}</span>
      </div>
    </div>

    <!-- Table Selector -->
    <div class="table-section">
      <div class="section-header">
        <h2 class="section-title">Select Table</h2>
        <span class="section-count">{{ tables.filter((t) => t.is_active).length }} available</span>
      </div>
      <div class="table-grid">
        <button
          v-for="table in tables"
          :key="table.id"
          class="table-btn"
          :class="{
            'table-btn--selected': selectedTableId === table.id,
            'table-btn--inactive': !table.is_active,
          }"
          @click="table.is_active && (selectedTableId = table.id)"
          :disabled="!table.is_active"
        >
          <div class="table-icon-wrap">
            <Armchair v-if="table.is_active" class="table-icon" />
            <Ban v-else class="table-icon inactive" />
          </div>
          <span class="table-name">{{ table.name }}</span>
          <span class="table-status" v-if="!table.is_active">Inactive</span>
          <CheckCircle2 v-if="selectedTableId === table.id" class="table-check" />
        </button>
      </div>
    </div>

    <!-- Menu -->
    <template v-if="selectedTableId">
      <!-- Category Tabs -->
      <div class="category-section">
        <div class="category-tabs">
          <button
            v-for="cat in menu"
            :key="cat.id"
            class="cat-tab"
            :class="{ 'cat-tab--active': activeCatId === cat.id }"
            @click="activeCatId = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="menu-section">
        <div class="menu-items">
          <div
            v-for="item in activeItems"
            :key="item.id"
            class="menu-item"
            :class="{ 'menu-item--unavailable': !item.is_available }"
          >
            <div class="item-image" v-if="item.image_url">
              <img :src="item.image_url" :alt="item.name" />
            </div>
            <div class="item-image item-image--placeholder" v-else>
              <UtensilsCrossed class="placeholder-icon" />
            </div>

            <div class="item-content">
              <div class="item-main">
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <p class="item-desc" v-if="item.description">{{ item.description }}</p>
                  <div class="item-price">
                    <span class="price-currency">$</span>
                    <span class="price-value">{{ Number(item.price).toFixed(2) }}</span>
                  </div>
                </div>

                <div class="item-actions" v-if="item.is_available !== false">
                  <div class="qty-control">
                    <button
                      class="qty-btn qty-btn--minus"
                      @click="decrement(item)"
                      :disabled="!cart[item.id]?.qty"
                    >
                      <Minus class="qty-icon" />
                    </button>
                    <span class="qty-value" :class="{ 'qty-value--active': cart[item.id]?.qty }">
                      {{ cart[item.id]?.qty ?? 0 }}
                    </span>
                    <button class="qty-btn qty-btn--plus" @click="increment(item)">
                      <Plus class="qty-icon" />
                    </button>
                  </div>
                </div>
                <div v-else class="sold-out-badge">
                  <Ban class="sold-out-icon" />
                  <span>Sold Out</span>
                </div>
              </div>

              <!-- Notes Input -->
              <div class="item-notes" v-if="cart[item.id]?.qty > 0">
                <div class="notes-input-wrap">
                  <MessageSquare class="notes-icon" />
                  <input
                    v-model="cart[item.id].notes"
                    type="text"
                    class="notes-input"
                    placeholder="Add note (e.g. no onions, extra spicy...)"
                    maxlength="120"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div class="empty-state" v-else>
      <div class="empty-icon-wrap">
        <MousePointerClick class="empty-icon" />
      </div>
      <h3 class="empty-title">Select a Table</h3>
      <p class="empty-subtitle">Choose a table above to start building the order</p>
    </div>

    <!-- ── Floating Action Button ── -->
    <transition name="fab">
      <button v-if="cartItems.length > 0" class="fab" @click="sheetOpen = true">
        <div class="fab-content">
          <ShoppingCart class="fab-icon" />
          <div class="fab-info">
            <span class="fab-label">View Order</span>
            <span class="fab-meta">{{ totalQty }} items • ${{ cartTotal.toFixed(2) }}</span>
          </div>
        </div>
        <div class="fab-badge" v-if="totalQty > 0">{{ totalQty }}</div>
        <ChevronRight class="fab-arrow" />
      </button>
    </transition>

    <!-- ── Bottom Sheet ── -->
    <Teleport to="body">
      <transition name="sheet">
        <div v-if="sheetOpen" class="sheet-overlay" @click.self="sheetOpen = false">
          <div class="sheet">
            <!-- Handle -->
            <div class="sheet-handle" @click="sheetOpen = false">
              <div class="handle-bar"></div>
            </div>

            <!-- Header -->
            <div class="sheet-header">
              <div class="sheet-header-content">
                <h2 class="sheet-title">Order Summary</h2>
                <div v-if="selectedTable" class="sheet-table">
                  <MapPin class="table-icon-sm" />
                  <span>{{ selectedTable.name }}</span>
                </div>
              </div>
              <button class="sheet-close" @click="sheetOpen = false">
                <X class="close-icon" />
              </button>
            </div>

            <!-- Cart Items -->
            <div class="sheet-body">
              <div v-if="cartItems.length === 0" class="sheet-empty">
                <ShoppingCart class="empty-cart-icon" />
                <p>Your cart is empty</p>
              </div>
              <div v-else class="cart-list">
                <div v-for="item in cartItems" :key="item.id" class="cart-item">
                  <div class="cart-item-main">
                    <div class="cart-item-info">
                      <div class="cart-item-header">
                        <span class="cart-item-name">{{ item.name }}</span>
                        <span class="cart-item-total"
                          >${{ (item.price * item.qty).toFixed(2) }}</span
                        >
                      </div>
                      <div class="cart-item-unit">${{ item.price.toFixed(2) }} each</div>
                    </div>
                    <div class="qty-control qty-control--compact">
                      <button
                        class="qty-btn qty-btn--sm"
                        @click="decrementById(item.id)"
                        :disabled="item.qty <= 1"
                      >
                        <Minus class="qty-icon-sm" />
                      </button>
                      <span class="qty-value-sm">{{ item.qty }}</span>
                      <button
                        class="qty-btn qty-btn--sm qty-btn--plus"
                        @click="incrementById(item.id)"
                      >
                        <Plus class="qty-icon-sm" />
                      </button>
                    </div>
                  </div>
                  <div class="cart-item-note" v-if="item.notes">
                    <MessageSquare class="note-icon" />
                    <span>{{ item.notes }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sheet-footer">
              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">Subtotal</span>
                  <span class="total-value">${{ cartTotal.toFixed(2) }}</span>
                </div>
                <div class="total-row total-row--final">
                  <span class="total-label-final">Total</span>
                  <span class="total-value-final">${{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
              <div class="action-buttons">
                <button class="btn-place" :disabled="submitting" @click="submitOrder">
                  <span v-if="submitting" class="btn-spinner"></span>
                  <span v-else>
                    <Send class="btn-icon" />
                    Place Order
                  </span>
                </button>
                <button class="btn-clear" @click="clearCart">
                  <Trash2 class="btn-icon-sm" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Success Toast -->
    <transition name="toast">
      <div v-if="successMsg" class="toast">
        <CheckCircle2 class="toast-icon" />
        <span>{{ successMsg }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  MapPin,
  Armchair,
  Ban,
  CheckCircle2,
  UtensilsCrossed,
  MousePointerClick,
  Minus,
  Plus,
  MessageSquare,
  ShoppingCart,
  ChevronRight,
  X,
  Send,
  Trash2,
} from 'lucide-vue-next'

const authStore = useAuthStore()

const tables = ref([])
const menu = ref([])
const selectedTableId = ref(null)
const activeCatId = ref(null)
const cart = ref({})
const submitting = ref(false)
const successMsg = ref('')
const sheetOpen = ref(false)

const activeItems = computed(() => {
  const cat = menu.value.find((c) => c.id === activeCatId.value)
  return cat?.menu_items ?? []
})

const cartItems = computed(() => Object.values(cart.value).filter((i) => i.qty > 0))
const totalQty = computed(() => cartItems.value.reduce((s, i) => s + i.qty, 0))
const cartTotal = computed(() => cartItems.value.reduce((s, i) => s + i.price * i.qty, 0))
const selectedTable = computed(() => tables.value.find((t) => t.id === selectedTableId.value))

function increment(item) {
  if (!cart.value[item.id]) {
    cart.value[item.id] = {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      qty: 0,
      notes: '',
    }
  }
  cart.value[item.id].qty++
}

function decrement(item) {
  if (!cart.value[item.id] || cart.value[item.id].qty === 0) return
  cart.value[item.id].qty--
  if (cart.value[item.id].qty === 0) {
    cart.value[item.id].notes = ''
  }
}

function incrementById(id) {
  if (cart.value[id]) cart.value[id].qty++
}

function decrementById(id) {
  if (!cart.value[id] || cart.value[id].qty === 0) return
  cart.value[id].qty--
  if (cart.value[id].qty === 0) {
    cart.value[id].notes = ''
    if (cartItems.value.length === 0) sheetOpen.value = false
  }
}

function clearCart() {
  cart.value = {}
  sheetOpen.value = false
}

async function submitOrder() {
  if (!selectedTableId.value || cartItems.value.length === 0) return
  submitting.value = true

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: authStore.profile?.restaurant_id,
        table_id: selectedTableId.value,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    if (order) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        cartItems.value.map((i) => ({
          order_id: order.id,
          menu_item_id: i.id,
          quantity: i.qty,
          unit_price: i.price,
          notes: i.notes?.trim() || null,
        })),
      )

      if (itemsError) throw itemsError

      cart.value = {}
      selectedTableId.value = null
      sheetOpen.value = false
      successMsg.value = 'Order placed successfully!'
      setTimeout(() => {
        successMsg.value = ''
      }, 3000)
    }
  } catch (err) {
    console.error('Order error:', err)
    successMsg.value = 'Failed to place order. Please try again.'
    setTimeout(() => (successMsg.value = ''), 3000)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const rid = authStore.profile?.restaurant_id
  const [{ data: t }, { data: m }] = await Promise.all([
    supabase.from('tables').select('id, name, is_active').eq('restaurant_id', rid).order('name'),
    supabase
      .from('menu_categories')
      .select('id, name, menu_items(id, name, description, price, image_url, is_available)')
      .eq('restaurant_id', rid)
      .order('name'),
  ])
  if (t) tables.value = t
  if (m) {
    menu.value = m
    activeCatId.value = m[0]?.id ?? null
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.new-order-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  min-height: 100vh;
  padding-bottom: 120px;
}

@media (max-width: 640px) {
  .new-order-page {
    padding: 16px;
    padding-bottom: 140px;
  }
}

/* ── Header ── */
.page-header {
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

.page-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.table-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 999px;
  color: #c8733a;
  font-size: 14px;
  font-weight: 600;
  animation: pulse-dot 2s ease-in-out infinite;
}

.indicator-icon {
  width: 16px;
  height: 16px;
}

/* ── Table Section ── */
.table-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.section-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .table-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.table-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #161616;
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 90px;
}

.table-btn:hover:not(:disabled) {
  border-color: rgba(200, 115, 58, 0.4);
  background: #1a1a1a;
  transform: translateY(-2px);
}

.table-btn--selected {
  background: rgba(200, 115, 58, 0.15);
  border-color: #c8733a;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.2);
}

.table-btn--inactive {
  opacity: 0.4;
  cursor: not-allowed;
  background: #0e0e0e;
}

.table-btn--inactive:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.07);
}

.table-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-btn--selected .table-icon-wrap {
  background: rgba(200, 115, 58, 0.2);
}

.table-icon {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.75);
}

.table-icon.inactive {
  color: rgba(255, 255, 255, 0.35);
}

.table-btn--selected .table-icon {
  color: #c8733a;
}

.table-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
}

.table-btn--inactive .table-name {
  color: rgba(255, 255, 255, 0.35);
}

.table-status {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.table-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  color: #c8733a;
}

/* ── Category Section ── */
.category-section {
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #111111;
  padding: 8px 0;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.cat-tab {
  flex-shrink: 0;
  padding: 10px 20px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.cat-tab:hover {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
}

.cat-tab--active {
  background: #c8733a;
  border-color: #c8733a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

/* ── Menu Section ── */
.menu-section {
  margin-bottom: 32px;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.menu-item--unavailable {
  opacity: 0.5;
  filter: grayscale(0.6);
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #0e0e0e;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.placeholder-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.25);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.item-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px;
  line-height: 1.3;
}

.item-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-currency {
  font-size: 14px;
  font-weight: 600;
  color: #c8733a;
}

.price-value {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #c8733a;
}

.item-actions {
  flex-shrink: 0;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0e0e0e;
  border-radius: 999px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.qty-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #161616;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #c8733a;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-btn--plus {
  background: #c8733a;
}

.qty-btn--plus:hover {
  background: #d4844e;
}

.qty-icon {
  width: 18px;
  height: 18px;
}

.qty-value {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  min-width: 24px;
  text-align: center;
}

.qty-value--active {
  color: #ffffff;
}

.sold-out-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sold-out-icon {
  width: 14px;
  height: 14px;
}

/* ── Notes ── */
.item-notes {
  width: 100%;
}

.notes-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.notes-input-wrap:focus-within {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}

.notes-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}

.notes-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
}

.notes-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.35);
}

.empty-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

/* ── Floating Action Button ── */
.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #c8733a;
  border: none;
  border-radius: 16px;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(200, 115, 58, 0.4);
  transition: all 0.3s ease;
  z-index: 50;
  font-family: 'DM Sans', sans-serif;
}

.fab:hover {
  background: #d4844e;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(200, 115, 58, 0.5);
}

@media (max-width: 640px) {
  .fab {
    left: 16px;
    right: 16px;
    bottom: 16px;
    justify-content: space-between;
  }
}

.fab-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fab-icon {
  width: 24px;
  height: 24px;
}

.fab-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.fab-label {
  font-size: 14px;
  font-weight: 700;
}

.fab-meta {
  font-size: 12px;
  opacity: 0.85;
}

.fab-badge {
  width: 28px;
  height: 28px;
  background: #ffffff;
  color: #c8733a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.fab-arrow {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

/* FAB transition */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

/* ── Bottom Sheet ── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: #161616;
  border-radius: 24px 24px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: none;
  display: flex;
  flex-direction: column;
  animation: sheet-up 0.3s ease;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-handle {
  padding: 12px;
  cursor: pointer;
  display: flex;
  justify-content: center;
}

.handle-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.sheet-header-content {
  flex: 1;
}

.sheet-title {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.sheet-table {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #c8733a;
  font-weight: 500;
}

.table-icon-sm {
  width: 16px;
  height: 16px;
}

.sheet-close {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sheet-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.close-icon {
  width: 20px;
  height: 20px;
}

/* Sheet Body */
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.sheet-empty {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.35);
}

.empty-cart-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  opacity: 0.5;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  padding: 16px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
}

.cart-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.cart-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.cart-item-total {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
  color: #c8733a;
  flex-shrink: 0;
}

.cart-item-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.qty-control--compact {
  background: #161616;
  padding: 3px;
  gap: 8px;
}

.qty-btn--sm {
  width: 28px;
  height: 28px;
}

.qty-icon-sm {
  width: 14px;
  height: 14px;
}

.qty-value-sm {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  min-width: 20px;
  text-align: center;
}

.cart-item-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  font-style: italic;
}

.note-icon {
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.35);
}

/* Sheet Footer */
.sheet-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: #0e0e0e;
  border-radius: 0 0 24px 24px;
}

.total-section {
  margin-bottom: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.total-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.total-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.total-row--final {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin-top: 12px;
}

.total-label-final {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.total-value-final {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #c8733a;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-place {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #c8733a;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-place:hover:not(:disabled) {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.3);
}

.btn-place:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.btn-icon-sm {
  width: 16px;
  height: 16px;
}

/* Sheet transition */
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #161616;
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 12px;
  color: #4ade80;
  font-size: 14px;
  font-weight: 600;
  z-index: 300;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.toast-icon {
  width: 20px;
  height: 20px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Animations */
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
