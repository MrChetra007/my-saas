<template>
  <div class="view-page">
    <div class="view-header">
      <h1 class="view-title">New Order</h1>
      <p class="view-sub">Select a table, browse the menu and place the order.</p>
    </div>

    <!-- Table Selector -->
    <div class="table-selector">
      <label class="section-label">Select Table</label>
      <div class="table-grid">
        <button
          v-for="table in tables"
          :key="table.id"
          class="table-btn"
          :class="{
            'table-btn--selected': selectedTableId === table.id,
            'table-btn--inactive': !table.is_active,
          }"
          @click="selectedTableId = table.id"
        >
          <span class="table-btn-name">{{ table.name }}</span>
          <span class="table-btn-status" v-if="!table.is_active">Inactive</span>
        </button>
      </div>
    </div>

    <!-- Menu -->
    <template v-if="selectedTableId">
      <!-- Category Tabs -->
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

      <!-- Menu Items -->
      <div class="menu-items">
        <div
          v-for="item in activeItems"
          :key="item.id"
          class="menu-item"
          :class="{ 'menu-item--unavailable': !item.is_available }"
        >
          <div class="item-img" v-if="item.image_url">
            <img :src="item.image_url" :alt="item.name" />
          </div>
          <div class="item-img item-img--placeholder" v-else>🍽️</div>

          <div class="item-body">
            <div class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-desc" v-if="item.description">{{ item.description }}</span>
                <span class="item-price">${{ Number(item.price).toFixed(2) }}</span>
              </div>
              <div class="qty-control" v-if="item.is_available !== false">
                <button class="qty-btn" @click="decrement(item)">−</button>
                <span class="qty-value">{{ cart[item.id]?.qty ?? 0 }}</span>
                <button class="qty-btn qty-btn--add" @click="increment(item)">+</button>
              </div>
              <span class="unavailable-label" v-else>Sold Out</span>
            </div>
            <div class="item-notes" v-if="cart[item.id]?.qty > 0">
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
    </template>

    <div class="menu-empty" v-else>
      <p>👆 Select a table above to start building the order.</p>
    </div>

    <!-- ── FAB ── -->
    <transition name="fab">
      <button v-if="cartItems.length > 0" class="fab" @click="sheetOpen = true">
        <span class="fab-icon">🛒</span>
        <span class="fab-label">View Order</span>
        <span class="fab-badge">{{ totalQty }}</span>
        <span class="fab-total">${{ cartTotal.toFixed(2) }}</span>
      </button>
    </transition>

    <!-- ── Bottom Sheet ── -->
    <Teleport to="body">
      <transition name="sheet">
        <div v-if="sheetOpen" class="sheet-overlay" @click.self="sheetOpen = false">
          <div class="sheet">
            <!-- Handle -->
            <div class="sheet-handle"></div>

            <!-- Header -->
            <div class="sheet-header">
              <div>
                <h2 class="sheet-title">Your Order</h2>
                <p class="sheet-sub" v-if="selectedTable">{{ selectedTable.name }}</p>
              </div>
              <button class="sheet-close" @click="sheetOpen = false">✕</button>
            </div>

            <!-- Cart Items -->
            <div class="sheet-body">
              <div v-for="item in cartItems" :key="item.id" class="cart-item">
                <div class="cart-item-main">
                  <div class="cart-item-info">
                    <span class="cart-item-name">{{ item.name }}</span>
                    <span class="cart-item-price">${{ (item.price * item.qty).toFixed(2) }}</span>
                  </div>
                  <div class="qty-control">
                    <button class="qty-btn" @click="decrementById(item.id)">−</button>
                    <span class="qty-value">{{ item.qty }}</span>
                    <button class="qty-btn qty-btn--add" @click="incrementById(item.id)">+</button>
                  </div>
                </div>
                <!-- Notes shown in sheet too -->
                <div class="cart-item-note" v-if="item.notes"><span>📝</span> {{ item.notes }}</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sheet-footer">
              <div class="sheet-total-row">
                <span class="sheet-total-label">Total</span>
                <span class="sheet-total-value">${{ cartTotal.toFixed(2) }}</span>
              </div>
              <button class="btn-place" :disabled="submitting" @click="submitOrder">
                {{ submitting ? 'Placing...' : 'Place Order →' }}
              </button>
              <button class="btn-clear" @click="clearCart">Clear order</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Success Toast -->
    <transition name="toast">
      <div v-if="successMsg" class="toast">✅ {{ successMsg }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

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
    cart.value[item.id] = { id: item.id, name: item.name, price: item.price, qty: 0, notes: '' }
  }
  cart.value[item.id].qty++
}
function decrement(item) {
  if (!cart.value[item.id] || cart.value[item.id].qty === 0) return
  cart.value[item.id].qty--
  if (cart.value[item.id].qty === 0) cart.value[item.id].notes = ''
}

// Used inside the sheet — operate by id
function incrementById(id) {
  if (cart.value[id]) cart.value[id].qty++
}
function decrementById(id) {
  if (!cart.value[id] || cart.value[id].qty === 0) return
  cart.value[id].qty--
  if (cart.value[id].qty === 0) {
    cart.value[id].notes = ''
    // Auto-close sheet if cart becomes empty
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

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      restaurant_id: authStore.profile?.restaurant_id,
      table_id: selectedTableId.value,
      status: 'pending',
    })
    .select()
    .single()

  if (!error && order) {
    await supabase.from('order_items').insert(
      cartItems.value.map((i) => ({
        order_id: order.id,
        menu_item_id: i.id,
        quantity: i.qty,
        unit_price: i.price,
        notes: i.notes?.trim() || null,
      })),
    )

    cart.value = {}
    selectedTableId.value = null
    sheetOpen.value = false
    successMsg.value = 'Order placed successfully!'
    setTimeout(() => {
      successMsg.value = ''
    }, 3000)
  }

  submitting.value = false
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
.view-page {
  padding: 1.5rem 2rem;
  max-width: 780px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  padding-bottom: 7rem;
}
.view-header {
  margin-bottom: 1.5rem;
}
.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;
}
.view-sub {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
}

/* Table Selector */
.table-selector {
  margin-bottom: 1.75rem;
}
.section-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
}
.table-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.table-btn {
  padding: 0.5rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 9px;
  background: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.table-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}
.table-btn--selected {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
}
.table-btn--inactive {
  opacity: 0.45;
}
.table-btn-name {
  font-size: 0.85rem;
}
.table-btn-status {
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 400;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  margin-bottom: 1.25rem;
}
.cat-tab {
  flex-shrink: 0;
  padding: 0.45rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 999px;
  background: white;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.cat-tab:hover {
  border-color: #a5b4fc;
  color: #4f46e5;
}
.cat-tab--active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

/* Menu Items */
.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.menu-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  transition: border-color 0.15s;
}
.menu-item:hover {
  border-color: #d1d5db;
}
.menu-item--unavailable {
  opacity: 0.5;
}
.item-img {
  width: 52px;
  height: 52px;
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: 2px;
}
.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-img--placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}
.item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-desc {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: #4f46e5;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  background: white;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: all 0.15s;
  color: #374151;
  line-height: 1;
}
.qty-btn:hover {
  border-color: #6366f1;
  color: #4f46e5;
}
.qty-btn--add {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}
.qty-btn--add:hover {
  background: #4338ca;
  border-color: #4338ca;
}
.qty-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  min-width: 18px;
  text-align: center;
}
.unavailable-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  flex-shrink: 0;
}
.item-notes {
  width: 100%;
}
.notes-input {
  width: 100%;
  padding: 0.45rem 0.75rem;
  border: 1.5px solid #e0e7ff;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  color: #374151;
  background: #f5f7ff;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.notes-input:focus {
  border-color: #6366f1;
  background: white;
}
.notes-input::placeholder {
  color: #a5b4fc;
}
.menu-empty {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* ── FAB ── */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.85rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
  transition:
    background 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
  z-index: 50;
}
.fab:hover {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.45);
}
.fab-icon {
  font-size: 1.1rem;
}
.fab-label {
  font-size: 0.88rem;
}
.fab-badge {
  background: white;
  color: #4f46e5;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  min-width: 20px;
  text-align: center;
}
.fab-total {
  font-size: 0.88rem;
  opacity: 0.85;
}

/* FAB transition */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.2s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

/* ── Bottom Sheet ── */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  padding-bottom: env(safe-area-inset-bottom);
}
.sheet-handle {
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 999px;
  margin: 0.75rem auto 0;
  flex-shrink: 0;
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.sheet-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.sheet-sub {
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0.15rem 0 0;
}
.sheet-close {
  background: #f3f4f6;
  border: none;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
}
.sheet-close:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Cart items list */
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.cart-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cart-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.cart-item-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cart-item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}
.cart-item-price {
  font-size: 0.88rem;
  font-weight: 700;
  color: #4f46e5;
}
.cart-item-note {
  font-size: 0.75rem;
  color: #6366f1;
  font-style: italic;
  padding-left: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* Sheet Footer */
.sheet-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex-shrink: 0;
}
.sheet-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sheet-total-label {
  font-size: 0.88rem;
  color: #6b7280;
  font-weight: 500;
}
.sheet-total-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #111827;
}
.btn-place {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.85rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-place:hover:not(:disabled) {
  background: #4338ca;
}
.btn-place:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-clear {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  padding: 0.25rem;
}
.btn-clear:hover {
  color: #e11d48;
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
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s ease;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: white;
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  z-index: 300;
  white-space: nowrap;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* Responsive */
@media (max-width: 640px) {
  .view-page {
    padding: 1.25rem 1rem;
    padding-bottom: 8rem;
  }
  .fab {
    bottom: 5.5rem;
    right: 1rem;
    left: 1rem;
    justify-content: center;
    border-radius: 14px;
  }
}
</style>
