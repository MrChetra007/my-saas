<template>
  <div class="order-history-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Order History</h1>
        <p class="page-subtitle">Browse and search all past orders</p>
      </div>
      <div class="header-stats">
        <div class="stat-pill">
          <span class="stat-value">{{ filteredOrders.length }}</span>
          <span class="stat-label">orders</span>
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-card">
      <div class="filters-grid">
        <!-- Search by table name -->
        <div class="filter-group">
          <label class="filter-label">Table Name</label>
          <div class="filter-input-wrap">
            <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              v-model="filters.tableName"
              type="text"
              placeholder="e.g. Table 3"
              class="filter-input"
            />
          </div>
        </div>

        <!-- Search by item name -->
        <div class="filter-group">
          <label class="filter-label">Item Name</label>
          <div class="filter-input-wrap">
            <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              v-model="filters.itemName"
              type="text"
              placeholder="e.g. Burger"
              class="filter-input"
            />
          </div>
        </div>

        <!-- Date range -->
        <div class="filter-group">
          <label class="filter-label">From</label>
          <input v-model="filters.dateFrom" type="date" class="filter-input date" />
        </div>
        <div class="filter-group">
          <label class="filter-label">To</label>
          <input v-model="filters.dateTo" type="date" class="filter-input date" />
        </div>
      </div>

      <!-- Status filter + actions row -->
      <div class="filters-footer">
        <div class="status-filters">
          <span class="filter-section-label">Status:</span>
          <div class="status-pills">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="filters.status = opt.value"
              :class="['status-pill', { active: filters.status === opt.value }, opt.colorClass]"
            >
              <span v-if="opt.value !== 'all'" class="status-dot" :class="opt.dotClass"></span>
              {{ opt.label }}
            </button>
          </div>
        </div>
        <button @click="resetFilters" class="reset-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset filters
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading orders…</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <div class="empty-icon">🗂️</div>
      <h3 class="empty-title">No orders found</h3>
      <p class="empty-subtitle">Try adjusting your filters or date range</p>
    </div>

    <!-- Orders list -->
    <div v-else class="orders-list">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="{ expanded: expandedOrders.has(order.id) }"
      >
        <!-- Order header -->
        <div class="order-header" @click="toggleExpand(order.id)">
          <div class="order-header-left">
            <!-- Status badge -->
            <span :class="['status-badge', statusBadgeClass(order.status)]">
              {{ order.status }}
            </span>

            <!-- Table -->
            <div class="table-info">
              <svg class="table-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18M5 6h14M7 18h10"
                />
              </svg>
              <span class="table-name">{{ order.tables?.name || 'Unknown Table' }}</span>
            </div>

            <!-- Items count -->
            <span class="items-count">
              {{ order.order_items?.length || 0 }} item{{
                order.order_items?.length !== 1 ? 's' : ''
              }}
            </span>

            <!-- Order ID -->
            <span class="order-id">#{{ order.id.slice(-6).toUpperCase() }}</span>
          </div>

          <div class="order-header-right">
            <!-- Total -->
            <span class="order-total">{{ formatCurrency(orderTotal(order)) }}</span>

            <!-- Date/time -->
            <span class="order-date">{{ formatDate(order.created_at) }}</span>

            <!-- Expand icon -->
            <svg
              :class="['expand-icon', { rotated: expandedOrders.has(order.id) }]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Expanded order details -->
        <div v-if="expandedOrders.has(order.id)" class="order-details">
          <!-- Items list -->
          <div class="details-section">
            <h4 class="section-title">Order Items</h4>
            <div class="items-list">
              <div v-for="item in order.order_items" :key="item.id" class="item-row">
                <div class="item-main">
                  <span class="item-qty">{{ item.quantity }}×</span>
                  <span class="item-name">{{ item.menu_items?.name || 'Unknown Item' }}</span>
                </div>
                <span class="item-price">{{
                  formatCurrency(item.unit_price * item.quantity)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Metadata grid -->
          <div class="details-meta">
            <!-- Notes -->
            <div v-if="order.notes" class="meta-block">
              <div class="meta-header">
                <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 8h10M7 12h6m-6 4h4M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                  />
                </svg>
                <span class="meta-label">Notes</span>
              </div>
              <p class="meta-content notes">{{ order.notes }}</p>
            </div>

            <!-- Rejection reason -->
            <div
              v-if="order.status === 'rejected' && order.rejection_reason"
              class="meta-block error"
            >
              <div class="meta-header">
                <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="meta-label">Rejection Reason</span>
              </div>
              <p class="meta-content">{{ order.rejection_reason }}</p>
            </div>

            <!-- Timestamps -->
            <div class="meta-block">
              <div class="meta-header">
                <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="meta-label">Order Time</span>
              </div>
              <p class="meta-content">{{ formatDateTime(order.created_at) }}</p>
            </div>
          </div>

          <!-- Total footer -->
          <div class="details-footer">
            <div class="total-breakdown">
              <span class="breakdown-label">Subtotal</span>
              <span class="breakdown-value">{{ formatCurrency(orderTotal(order) * 0.9) }}</span>
            </div>
            <div class="total-breakdown">
              <span class="breakdown-label">Tax & Service</span>
              <span class="breakdown-value">{{ formatCurrency(orderTotal(order) * 0.1) }}</span>
            </div>
            <div class="total-final">
              <span class="final-label">Total</span>
              <span class="final-value">{{ formatCurrency(orderTotal(order)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination hint -->
    <div v-if="filteredOrders.length > 0" class="pagination-hint">
      <p>Showing {{ filteredOrders.length }} orders</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────
const orders = ref([])
const loading = ref(true)
const expandedOrders = ref(new Set())

const filters = ref({
  tableName: '',
  itemName: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
})

const statusOptions = [
  {
    value: 'all',
    label: 'All',
    colorClass: '',
    dotClass: '',
  },
  {
    value: 'paid',
    label: 'Paid',
    colorClass: 'success',
    dotClass: 'bg-green-400',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    colorClass: 'error',
    dotClass: 'bg-red-400',
  },
]

// ── Fetch ───────────────────────────────────────────────────────────────────
async function fetchOrders() {
  loading.value = true

  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) {
    loading.value = false
    return
  }

  let query = supabase
    .from('orders')
    .select(
      `
      id,
      status,
      notes,
      rejection_reason,
      created_at,
      tables(name),
      order_items(
        id,
        quantity,
        unit_price,
        menu_items(name)
      )
    `,
    )
    .eq('restaurant_id', restaurantId)
    .in('status', ['paid', 'rejected'])
    .order('created_at', { ascending: false })

  if (filters.value.dateFrom) {
    query = query.gte('created_at', filters.value.dateFrom + 'T00:00:00')
  }
  if (filters.value.dateTo) {
    query = query.lte('created_at', filters.value.dateTo + 'T23:59:59')
  }

  const { data, error } = await query
  if (!error) orders.value = data || []
  loading.value = false
}

watch([() => filters.value.dateFrom, () => filters.value.dateTo], fetchOrders)

onMounted(fetchOrders)

// ── Client-side filtering ───────────────────────────────────────────────────
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    if (filters.value.status !== 'all' && order.status !== filters.value.status) return false

    if (filters.value.tableName.trim()) {
      const search = filters.value.tableName.trim().toLowerCase()
      const tableName = (order.tables?.name || '').toLowerCase()
      if (!tableName.includes(search)) return false
    }

    if (filters.value.itemName.trim()) {
      const search = filters.value.itemName.trim().toLowerCase()
      const hasItem = order.order_items?.some((item) =>
        (item.menu_items?.name || '').toLowerCase().includes(search),
      )
      if (!hasItem) return false
    }

    return true
  })
})

// ── Helpers ─────────────────────────────────────────────────────────────────
function toggleExpand(orderId) {
  if (expandedOrders.value.has(orderId)) {
    expandedOrders.value.delete(orderId)
  } else {
    expandedOrders.value.add(orderId)
  }
}

function orderTotal(order) {
  return order.order_items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || 0
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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status) {
  return (
    {
      paid: 'success',
      rejected: 'error',
    }[status] || 'default'
  )
}

function resetFilters() {
  filters.value = { tableName: '', itemName: '', dateFrom: '', dateTo: '', status: 'all' }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.order-history-page {
  min-height: 100vh;
  background: #111111;
  padding: 32px 24px;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .order-history-page {
    padding: 20px 16px;
  }
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
}

.page-title {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 4px;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 999px;
}

.stat-value {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #c8733a;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Filters Card */
.filters-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-input-wrap {
  position: relative;
}

.filter-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 14px;
  color: #ffffff;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.filter-input.date {
  padding-left: 12px;
  font-family: 'DM Sans', sans-serif;
}

/* Filters Footer */
.filters-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  gap: 16px;
  flex-wrap: wrap;
}

.status-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-section-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pills {
  display: flex;
  gap: 8px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-pill:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.status-pill.active {
  background: #c8733a;
  border-color: #c8733a;
  color: #ffffff;
}

.status-pill.active.success {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
  color: #4ade80;
}

.status-pill.active.error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  border-color: #c8733a;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.1);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(255, 255, 255, 0.55);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.07);
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.order-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.order-card.expanded {
  border-color: rgba(200, 115, 58, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Order Header */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .order-header {
    padding: 16px;
    gap: 12px;
  }
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.order-header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* Status Badge */
.status-badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-badge.success {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* Table Info */
.table-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.35);
}

.table-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.items-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.order-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

/* Order Meta */
.order-total {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #c8733a;
}

.order-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.expand-icon {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.35);
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
  color: #c8733a;
}

/* Order Details */
.order-details {
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: #0e0e0e;
  padding: 24px;
}

.details-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-qty {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(200, 115, 58, 0.15);
  color: #c8733a;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  flex-shrink: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Fraunces', serif;
}

/* Details Meta */
.details-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .details-meta {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .details-meta {
    grid-template-columns: 1fr;
  }
}

.meta-block {
  padding: 16px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.meta-block.error {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.meta-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.meta-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.35);
}

.meta-block.error .meta-icon {
  color: #ef4444;
}

.meta-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-block.error .meta-label {
  color: #ef4444;
}

.meta-content {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.meta-content.notes {
  font-style: italic;
  color: rgba(255, 255, 255, 0.65);
}

/* Details Footer */
.details-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .details-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

.total-breakdown {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breakdown-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.breakdown-value {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Fraunces', serif;
}

.total-final {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.25);
  border-radius: 10px;
}

.final-label {
  font-size: 13px;
  font-weight: 600;
  color: #c8733a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.final-value {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #c8733a;
}

/* Pagination Hint */
.pagination-hint {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

/* Date input styling for dark theme */
input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.5;
  cursor: pointer;
}

input[type='date']::-webkit-calendar-picker-indicator:hover {
  opacity: 0.8;
}
</style>
