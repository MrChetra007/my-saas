<!-- src/views/cashier/PaymentPage.vue -->
<template>
  <div class="payment-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Payment</h1>
        <p class="page-subtitle">Process payment for customer orders</p>
      </div>
      <RouterLink to="/cashier/orders" class="btn-back">
        <ArrowLeft class="btn-icon" />
        Back to Orders
      </RouterLink>
    </div>

    <!-- Order Selection (if no order selected) -->
    <div v-if="!selectedOrder" class="order-selection">
      <div class="section-header">
        <h2 class="section-title">Select Order to Pay</h2>
        <span class="section-count">{{ pendingOrders.length }} pending</span>
      </div>

      <div v-if="pendingOrders.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <ClipboardCheck class="empty-icon" />
        </div>
        <h3 class="empty-title">No orders to pay</h3>
        <p class="empty-subtitle">All orders have been processed</p>
      </div>

      <div v-else class="orders-grid">
        <div
          v-for="order in pendingOrders"
          :key="order.id"
          class="order-card"
          @click="selectOrder(order)"
        >
          <div class="order-header">
            <div class="table-info">
              <div class="table-icon-wrap">
                <Armchair class="table-icon" />
              </div>
              <div class="table-details">
                <span class="table-name">{{ order.tables?.name }}</span>
                <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
              </div>
            </div>
            <span class="status-badge" :class="`badge-${order.status}`">
              {{ formatStatus(order.status) }}
            </span>
          </div>

          <div class="order-items-preview">
            <div v-for="item in order.order_items.slice(0, 3)" :key="item.id" class="preview-item">
              <span class="preview-qty">{{ item.quantity }}×</span>
              <span class="preview-name">{{ item.menu_items?.name }}</span>
            </div>
            <div v-if="order.order_items.length > 3" class="preview-more">
              +{{ order.order_items.length - 3 }} more items
            </div>
          </div>

          <div class="order-footer">
            <span class="item-count">{{ order.order_items.length }} items</span>
            <span class="order-total">${{ orderTotal(order).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Interface (when order selected) -->
    <div v-else class="payment-interface">
      <!-- Order Summary Card -->
      <div class="summary-card">
        <div class="summary-header">
          <div class="table-info">
            <div class="table-icon-wrap large">
              <Armchair class="table-icon large" />
            </div>
            <div class="table-details">
              <span class="table-name">{{ selectedOrder.tables?.name }}</span>
              <span class="order-id">Order #{{ selectedOrder.id.slice(-6).toUpperCase() }}</span>
            </div>
          </div>
          <button class="btn-change" @click="selectedOrder = null">
            <X class="btn-icon-sm" />
            Change
          </button>
        </div>

        <div class="summary-items">
          <div v-for="item in selectedOrder.order_items" :key="item.id" class="summary-item">
            <div class="item-info">
              <span class="item-qty">{{ item.quantity }}×</span>
              <div class="item-details">
                <span class="item-name">{{ item.menu_items?.name }}</span>
                <span v-if="item.notes" class="item-notes">{{ item.notes }}</span>
              </div>
            </div>
            <span class="item-price">${{ (item.unit_price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>

        <div class="summary-totals">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">${{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Tax (10%)</span>
            <span class="total-value">${{ tax.toFixed(2) }}</span>
          </div>
          <div class="total-row total-final">
            <span class="total-label-final">Total Due</span>
            <span class="total-value-final">${{ totalDue.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="payment-methods">
        <h3 class="methods-title">Select Payment Method</h3>

        <div class="methods-grid">
          <button
            class="method-btn"
            :class="{ 'method-btn--active': paymentMethod === 'cash' }"
            @click="paymentMethod = 'cash'"
          >
            <div class="method-icon-wrap">
              <Banknote class="method-icon" />
            </div>
            <span class="method-name">Cash</span>
          </button>

          <button
            class="method-btn"
            :class="{ 'method-btn--active': paymentMethod === 'card' }"
            @click="paymentMethod = 'card'"
          >
            <div class="method-icon-wrap">
              <CreditCard class="method-icon" />
            </div>
            <span class="method-name">Card</span>
          </button>

          <button
            class="method-btn"
            :class="{ 'method-btn--active': paymentMethod === 'qr' }"
            @click="paymentMethod = 'qr'"
          >
            <div class="method-icon-wrap">
              <QrCode class="method-icon" />
            </div>
            <span class="method-name">QR Pay</span>
          </button>
        </div>

        <!-- Cash Payment Input -->
        <div v-if="paymentMethod === 'cash'" class="payment-input">
          <label class="input-label">Cash Received</label>
          <div class="cash-input-wrap">
            <span class="currency-symbol">$</span>
            <input
              v-model.number="cashReceived"
              type="number"
              step="0.01"
              min="0"
              class="cash-input"
              placeholder="0.00"
              autofocus
            />
          </div>

          <div class="quick-amounts">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              class="quick-btn"
              @click="cashReceived = amount"
            >
              ${{ amount }}
            </button>
            <button class="quick-btn exact" @click="cashReceived = totalDue">Exact</button>
          </div>

          <div v-if="change > 0" class="change-display">
            <span class="change-label">Change Due</span>
            <span class="change-value">${{ change.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Card Payment Placeholder -->
        <div v-if="paymentMethod === 'card'" class="payment-placeholder">
          <div class="placeholder-icon-wrap">
            <CreditCard class="placeholder-icon" />
          </div>
          <p class="placeholder-title">Card Terminal</p>
          <p class="placeholder-subtitle">Connect to card reader or enter manually</p>
          <button class="btn-simulate" @click="simulateCardPayment">Simulate Card Payment</button>
        </div>

        <!-- QR Payment Placeholder -->
        <div v-if="paymentMethod === 'qr'" class="payment-placeholder">
          <div class="qr-code">
            <div class="qr-pattern">
              <QrCode class="qr-icon" />
            </div>
          </div>
          <p class="placeholder-title">Scan to Pay</p>
          <p class="placeholder-subtitle">Customer scans with banking app</p>
          <button class="btn-simulate" @click="simulateQrPayment">Simulate QR Payment</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="payment-actions">
        <button
          class="btn-complete"
          :disabled="!canComplete || processing"
          @click="completePayment"
        >
          <span v-if="processing" class="spinner-sm"></span>
          <span v-else>
            <CheckCircle2 class="btn-icon" />
            Complete Payment
          </span>
        </button>
        <button class="btn-cancel" @click="selectedOrder = null">Cancel</button>
      </div>
    </div>

    <!-- Success Modal -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showSuccess" class="success-modal">
          <div class="success-content">
            <div class="success-icon-wrap">
              <CheckCircle2 class="success-icon" />
            </div>
            <h2 class="success-title">Payment Complete!</h2>
            <p class="success-subtitle">
              Order #{{ selectedOrder?.id.slice(-6).toUpperCase() }} paid successfully
            </p>

            <div class="receipt-preview">
              <div class="receipt-row">
                <span>Amount Paid</span>
                <span>${{ amountPaid.toFixed(2) }}</span>
              </div>
              <div class="receipt-row" v-if="change > 0">
                <span>Change</span>
                <span>${{ change.toFixed(2) }}</span>
              </div>
              <div class="receipt-row receipt-total">
                <span>Payment Method</span>
                <span class="method">{{ paymentMethod }}</span>
              </div>
            </div>

            <div class="success-actions">
              <button class="btn-print" @click="printReceipt">
                <Printer class="btn-icon" />
                Print Receipt
              </button>
              <button class="btn-new" @click="resetPayment">
                <Plus class="btn-icon" />
                New Payment
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowLeft,
  ClipboardCheck,
  Armchair,
  X,
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  Printer,
  Plus,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// State
const pendingOrders = ref([])
const selectedOrder = ref(null)
const paymentMethod = ref('cash')
const cashReceived = ref(0)
const processing = ref(false)
const showSuccess = ref(false)
const amountPaid = ref(0)

let ordersChannel = null

// Dummy data for development
const dummyOrders = [
  {
    id: 'order-001',
    status: 'ready',
    tables: { name: 'Table 1' },
    created_at: new Date().toISOString(),
    order_items: [
      { id: 1, quantity: 2, unit_price: 12.5, menu_items: { name: 'Grilled Salmon' } },
      { id: 2, quantity: 1, unit_price: 8.0, menu_items: { name: 'Caesar Salad' } },
      { id: 3, quantity: 2, unit_price: 4.5, menu_items: { name: 'Soft Drink' } },
    ],
  },
  {
    id: 'order-002',
    status: 'ready',
    tables: { name: 'Table 3' },
    created_at: new Date().toISOString(),
    order_items: [
      { id: 4, quantity: 1, unit_price: 18.0, menu_items: { name: 'Ribeye Steak' } },
      { id: 5, quantity: 1, unit_price: 6.5, menu_items: { name: 'Mashed Potatoes' } },
      { id: 6, quantity: 1, unit_price: 7.0, menu_items: { name: 'House Wine' } },
    ],
  },
  {
    id: 'order-003',
    status: 'cooking',
    tables: { name: 'Table 5' },
    created_at: new Date().toISOString(),
    order_items: [
      { id: 7, quantity: 3, unit_price: 9.5, menu_items: { name: 'Chicken Wings' } },
      { id: 8, quantity: 3, unit_price: 5.0, menu_items: { name: 'Beer' } },
    ],
  },
]

// Computed
const subtotal = computed(() => (selectedOrder.value ? orderTotal(selectedOrder.value) : 0))
const tax = computed(() => subtotal.value * 0.1)
const totalDue = computed(() => subtotal.value + tax.value)
const change = computed(() => Math.max(0, cashReceived.value - totalDue.value))
const canComplete = computed(() => {
  if (!selectedOrder.value) return false
  if (paymentMethod.value === 'cash') {
    return cashReceived.value >= totalDue.value
  }
  return true
})

const quickAmounts = computed(() => {
  const amounts = []
  const base = Math.ceil(totalDue.value / 5) * 5
  amounts.push(base)
  amounts.push(base + 5)
  amounts.push(base + 10)
  amounts.push(base + 20)
  return amounts
})

// Methods
function formatStatus(status) {
  const map = { pending: 'Pending', cooking: 'Cooking', ready: 'Ready' }
  return map[status] || status
}

function orderTotal(order) {
  return order.order_items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || 0
}

function selectOrder(order) {
  selectedOrder.value = order
  paymentMethod.value = 'cash'
  cashReceived.value = 0
}

function simulateCardPayment() {
  processing.value = true
  setTimeout(() => {
    processing.value = false
    amountPaid.value = totalDue.value
    showSuccess.value = true
  }, 1500)
}

function simulateQrPayment() {
  processing.value = true
  setTimeout(() => {
    processing.value = false
    amountPaid.value = totalDue.value
    showSuccess.value = true
  }, 2000)
}

async function completePayment() {
  processing.value = true

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  amountPaid.value = paymentMethod.value === 'cash' ? cashReceived.value : totalDue.value

  // Remove from pending
  pendingOrders.value = pendingOrders.value.filter((o) => o.id !== selectedOrder.value.id)

  processing.value = false
  showSuccess.value = true
}

function printReceipt() {
  alert('Printing receipt... (dummy)')
}

function resetPayment() {
  showSuccess.value = false
  selectedOrder.value = null
  cashReceived.value = 0
  paymentMethod.value = 'cash'
}

// Fetch orders (using dummy data for now)
async function fetchOrders() {
  // In production, replace with actual Supabase query
  // const { data } = await supabase...

  // Using dummy data for development
  pendingOrders.value = dummyOrders.filter((o) => o.status === 'ready')
}

onMounted(() => {
  fetchOrders()

  // Subscribe to real-time updates
  ordersChannel = supabase
    .channel('cashier-payments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      fetchOrders,
    )
    .subscribe()
})

onUnmounted(() => {
  if (ordersChannel) supabase.removeChannel(ordersChannel)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.payment-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  min-height: 100vh;
  padding-bottom: 100px;
}

@media (max-width: 640px) {
  .payment-page {
    padding: 16px;
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

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  background: #1a1a1a;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ── Order Selection ── */
.order-selection {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.section-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  background: #161616;
  padding: 6px 12px;
  border-radius: 999px;
}

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

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.order-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-card:hover {
  border-color: rgba(200, 115, 58, 0.4);
  box-shadow: 0 8px 32px rgba(200, 115, 58, 0.15);
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-icon {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.75);
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.order-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-ready {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.badge-cooking {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.25);
}

.order-items-preview {
  background: #0e0e0e;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 6px;
}

.preview-qty {
  font-weight: 700;
  color: #c8733a;
  min-width: 24px;
}

.preview-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-more {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
  margin-top: 4px;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.order-total {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #c8733a;
}

/* ── Payment Interface ── */
.payment-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .payment-interface {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
}

.summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.table-icon-wrap.large {
  width: 56px;
  height: 56px;
}

.table-icon.large {
  width: 28px;
  height: 28px;
}

.btn-change {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-change:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.btn-icon-sm {
  width: 14px;
  height: 14px;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.summary-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.item-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.item-qty {
  width: 28px;
  height: 28px;
  background: rgba(200, 115, 58, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #c8733a;
  flex-shrink: 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.item-notes {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}

.item-price {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.summary-totals {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.total-value {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.total-final {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin-top: 8px;
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

/* ── Payment Methods ── */
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.methods-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #161616;
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-btn:hover {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.75);
  background: #1a1a1a;
}

.method-btn--active {
  background: rgba(200, 115, 58, 0.15);
  border-color: #c8733a;
  color: #c8733a;
}

.method-icon-wrap {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.method-btn--active .method-icon-wrap {
  background: rgba(200, 115, 58, 0.2);
}

.method-icon {
  width: 24px;
  height: 24px;
}

.method-name {
  font-size: 14px;
  font-weight: 600;
}

/* ── Payment Input ── */
.payment-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.cash-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #0e0e0e;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.cash-input-wrap:focus-within {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}

.currency-symbol {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
}

.cash-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 700;
  outline: none;
  width: 100%;
}

.cash-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.quick-btn.exact {
  background: rgba(200, 115, 58, 0.15);
  border-color: rgba(200, 115, 58, 0.3);
  color: #c8733a;
}

.quick-btn.exact:hover {
  background: rgba(200, 115, 58, 0.25);
}

.change-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 12px;
}

.change-label {
  font-size: 14px;
  color: #4ade80;
  font-weight: 600;
}

.change-value {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #4ade80;
}

/* ── Payment Placeholder ── */
.payment-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  background: #0e0e0e;
  border: 1.5px dashed rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  text-align: center;
}

.placeholder-icon-wrap {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.35);
}

.qr-code {
  width: 160px;
  height: 160px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.qr-pattern {
  width: 100%;
  height: 100%;
  background: #111111;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-icon {
  width: 80px;
  height: 80px;
  color: #ffffff;
}

.placeholder-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.placeholder-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.btn-simulate {
  padding: 12px 24px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.3);
  border-radius: 10px;
  color: #c8733a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-simulate:hover {
  background: rgba(200, 115, 58, 0.25);
}

/* ── Payment Actions ── */
.payment-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-complete {
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

.btn-complete:hover:not(:disabled) {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.3);
}

.btn-complete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-cancel {
  padding: 16px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* ── Success Modal ── */
.success-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.success-content {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-icon-wrap {
  width: 80px;
  height: 80px;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.success-icon {
  width: 40px;
  height: 40px;
  color: #4ade80;
}

.success-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}

.success-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 24px;
}

.receipt-preview {
  background: #0e0e0e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: left;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}

.receipt-row:last-child {
  margin-bottom: 0;
}

.receipt-total {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  margin-top: 12px;
}

.receipt-total .method {
  text-transform: uppercase;
  font-weight: 700;
  color: #c8733a;
}

.success-actions {
  display: flex;
  gap: 12px;
}

.btn-print {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-print:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.btn-new {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #c8733a;
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-new:hover {
  background: #d4844e;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
