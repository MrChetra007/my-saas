<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Order History</h1>
      <p class="text-sm text-gray-500 mt-1">Browse and search all past orders</p>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search by table name -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Table Name</label>
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Search by item name -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Item Name</label>
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Date range -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            v-model="filters.dateFrom"
            type="date"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            v-model="filters.dateTo"
            type="date"
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Status filter + actions row -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-500">Status:</span>
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            @click="filters.status = opt.value"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filters.status === opt.value
                ? opt.activeClass
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400"
            >{{ filteredOrders.length }} result{{ filteredOrders.length !== 1 ? 's' : '' }}</span
          >
          <button
            @click="resetFilters"
            class="text-xs text-orange-500 hover:text-orange-600 font-medium"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div
        class="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"
      ></div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredOrders.length === 0"
      class="text-center py-20 bg-white rounded-xl border border-gray-200"
    >
      <div class="text-4xl mb-3">🗂️</div>
      <p class="text-gray-500 font-medium">No orders found</p>
      <p class="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
    </div>

    <!-- Orders list -->
    <div v-else class="space-y-3">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <!-- Order header -->
        <div
          class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          @click="toggleExpand(order.id)"
        >
          <div class="flex items-center gap-4">
            <!-- Status badge -->
            <span
              :class="statusBadgeClass(order.status)"
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
            >
              {{ order.status }}
            </span>

            <!-- Table -->
            <div class="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18M5 6h14M7 18h10"
                />
              </svg>
              {{ order.tables?.name || 'Unknown Table' }}
            </div>

            <!-- Items summary -->
            <span class="text-sm text-gray-400 hidden sm:block">
              {{ order.order_items?.length || 0 }} item{{
                order.order_items?.length !== 1 ? 's' : ''
              }}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <!-- Total -->
            <span class="text-sm font-semibold text-gray-900">
              {{ formatCurrency(orderTotal(order)) }}
            </span>

            <!-- Date/time -->
            <span class="text-xs text-gray-400 hidden md:block">
              {{ formatDate(order.created_at) }}
            </span>

            <!-- Chevron -->
            <svg
              :class="[
                'w-4 h-4 text-gray-400 transition-transform',
                expandedOrders.has(order.id) ? 'rotate-180' : '',
              ]"
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

        <!-- Expanded order items -->
        <div
          v-if="expandedOrders.has(order.id)"
          class="border-t border-gray-100 px-5 py-4 bg-gray-50"
        >
          <!-- Date on mobile -->
          <p class="text-xs text-gray-400 mb-3 md:hidden">{{ formatDate(order.created_at) }}</p>

          <!-- Items table -->
          <div class="space-y-2">
            <div
              v-for="item in order.order_items"
              :key="item.id"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0"
                >
                  {{ item.quantity }}
                </span>
                <span class="text-gray-700">{{ item.menu_items?.name || 'Unknown Item' }}</span>
              </div>
              <span class="text-gray-500">{{
                formatCurrency(item.unit_price * item.quantity)
              }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="order.notes" class="mt-3 pt-3 border-t border-gray-200 flex items-start gap-2">
            <svg
              class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 8h10M7 12h6m-6 4h4M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
              />
            </svg>
            <p class="text-xs text-gray-500 italic">{{ order.notes }}</p>
          </div>

          <!-- Rejection reason -->
          <div
            v-if="order.status === 'rejected' && order.rejection_reason"
            class="mt-3 pt-3 border-t border-gray-200"
          >
            <p class="text-xs text-red-500 font-medium">
              Rejection reason: {{ order.rejection_reason }}
            </p>
          </div>

          <!-- Total row -->
          <div class="mt-3 pt-3 border-t border-gray-200 flex justify-end">
            <span class="text-sm font-bold text-gray-900"
              >Total: {{ formatCurrency(orderTotal(order)) }}</span
            >
          </div>
        </div>
      </div>
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
  { value: 'all', label: 'All', activeClass: 'bg-gray-800 text-white' },
  { value: 'paid', label: 'Paid', activeClass: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rejected', activeClass: 'bg-red-100 text-red-700' },
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

  // Date range filters (applied at DB level for efficiency)
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

// Re-fetch when date range changes (DB-level filter)
watch([() => filters.value.dateFrom, () => filters.value.dateTo], fetchOrders)

onMounted(fetchOrders)

// ── Client-side filtering ───────────────────────────────────────────────────
const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    // Status
    if (filters.value.status !== 'all' && order.status !== filters.value.status) return false

    // Table name
    if (filters.value.tableName.trim()) {
      const search = filters.value.tableName.trim().toLowerCase()
      const tableName = (order.tables?.name || '').toLowerCase()
      if (!tableName.includes(search)) return false
    }

    // Item name
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
  const currency = authStore.profile?.restaurants?.currency || 'USD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status) {
  return (
    {
      paid: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }[status] || 'bg-gray-100 text-gray-600'
  )
}

function resetFilters() {
  filters.value = { tableName: '', itemName: '', dateFrom: '', dateTo: '', status: 'all' }
}
</script>
