<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header + Range Selector -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
        <p class="text-sm text-gray-500 mt-1">{{ rangeLabel }}</p>
      </div>
      <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        <button
          v-for="opt in rangeOptions"
          :key="opt.value"
          @click="setRange(opt.value)"
          :class="[
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            range === opt.value
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div
        class="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"
      ></div>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="kpi in kpiCards"
          :key="kpi.label"
          class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">{{ kpi.label }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ kpi.value }}</p>
          <p v-if="kpi.sub" class="text-xs text-gray-400 mt-1">{{ kpi.sub }}</p>
        </div>
      </div>

      <!-- Row 1: Revenue chart + Status breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <!-- Revenue over time -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Revenue Over Time</h2>
          <div class="relative h-56">
            <canvas ref="revenueChartRef"></canvas>
          </div>
        </div>

        <!-- Orders by status -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h2>
          <div class="relative h-40 flex items-center justify-center">
            <canvas ref="statusChartRef"></canvas>
          </div>
          <div class="mt-4 space-y-2">
            <div
              v-for="s in statusBreakdown"
              :key="s.label"
              class="flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ background: s.color }"></span>
                <span class="text-gray-600 capitalize">{{ s.label }}</span>
              </div>
              <span class="font-semibold text-gray-800">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Daily order count -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-4">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Daily Order Count</h2>
        <div class="relative h-44">
          <canvas ref="dailyOrdersChartRef"></canvas>
        </div>
      </div>

      <!-- Row 3: Top items + Peak hours -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Top selling items -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Top Selling Items</h2>
          <div v-if="topItems.length === 0" class="text-center py-8 text-gray-400 text-sm">
            No data yet
          </div>
          <div v-else class="space-y-3">
            <div v-for="(item, i) in topItems" :key="item.name" class="flex items-center gap-3">
              <span class="text-xs font-bold text-gray-400 w-4">{{ i + 1 }}</span>
              <div class="flex-1">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-gray-700 truncate">{{ item.name }}</span>
                  <span class="text-gray-500 ml-2 flex-shrink-0">{{ item.qty }} sold</span>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-400 rounded-full transition-all duration-500"
                    :style="{ width: (item.qty / topItems[0].qty) * 100 + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Peak hours -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Peak Order Hours</h2>
          <div class="relative h-48">
            <canvas ref="peakHoursChartRef"></canvas>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import {
  Chart,
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

Chart.register(
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  BarElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
)

const authStore = useAuthStore()

// ── Range ────────────────────────────────────────────────────────────────────
const rangeOptions = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]
const range = ref(7)

const rangeLabel = computed(() => {
  const from = new Date()
  from.setDate(from.getDate() - range.value)
  return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — Today`
})

function setRange(val) {
  range.value = val
}

// ── Data ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const orders = ref([])
const orderItems = ref([])

async function fetchData() {
  loading.value = true
  destroyCharts()

  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) {
    loading.value = false
    return
  }

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - range.value)
  fromDate.setHours(0, 0, 0, 0)

  const [ordersRes, itemsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', fromDate.toISOString()),
    supabase.from('order_items').select('order_id, quantity, unit_price, menu_items(name)').in(
      'order_id',
      // We'll fetch items for paid orders only in a second step after orders load
      // For now fetch all and filter client-side
      [], // placeholder — handled below
    ),
  ])

  // Fetch orders first
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, status, created_at')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', fromDate.toISOString())

  orders.value = ordersData || []

  // Fetch order_items for paid orders only
  const paidIds = (ordersData || []).filter((o) => o.status === 'paid').map((o) => o.id)
  if (paidIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('order_id, quantity, unit_price, menu_items(name)')
      .in('order_id', paidIds)
    orderItems.value = itemsData || []
  } else {
    orderItems.value = []
  }

  loading.value = false
  await nextTick()
  renderCharts()
}

watch(range, fetchData)
onMounted(fetchData)

// ── Computed stats ───────────────────────────────────────────────────────────
const paidOrders = computed(() => orders.value.filter((o) => o.status === 'paid'))

const totalRevenue = computed(() =>
  orderItems.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
)

const kpiCards = computed(() => {
  const avgOrder = paidOrders.value.length ? totalRevenue.value / paidOrders.value.length : 0
  return [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue.value) },
    { label: 'Total Orders', value: orders.value.length.toString() },
    { label: 'Paid Orders', value: paidOrders.value.length.toString() },
    { label: 'Avg Order Value', value: formatCurrency(avgOrder) },
  ]
})

const statusBreakdown = computed(() => {
  const counts = {}
  orders.value.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1
  })
  const colorMap = {
    paid: '#22c55e',
    rejected: '#ef4444',
    pending: '#f59e0b',
    cooking: '#3b82f6',
    ready: '#8b5cf6',
    cancelled: '#6b7280',
  }
  return Object.entries(counts).map(([label, count]) => ({
    label,
    count,
    color: colorMap[label] || '#9ca3af',
  }))
})

const topItems = computed(() => {
  const counts = {}
  orderItems.value.forEach((i) => {
    const name = i.menu_items?.name || 'Unknown'
    counts[name] = (counts[name] || 0) + i.quantity
  })
  return Object.entries(counts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
})

// ── Chart data builders ──────────────────────────────────────────────────────
function buildDayLabels() {
  const labels = []
  for (let i = range.value - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return labels
}

function buildDayKey(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function revenueByDay() {
  const map = {}
  buildDayLabels().forEach((l) => {
    map[l] = 0
  })

  // Map order_id → created_at for paid orders
  const orderDateMap = {}
  paidOrders.value.forEach((o) => {
    orderDateMap[o.id] = o.created_at
  })

  orderItems.value.forEach((item) => {
    const dateStr = orderDateMap[item.order_id]
    if (!dateStr) return
    const key = buildDayKey(dateStr)
    if (key in map) map[key] += item.unit_price * item.quantity
  })
  return Object.values(map)
}

function orderCountByDay() {
  const map = {}
  buildDayLabels().forEach((l) => {
    map[l] = 0
  })
  orders.value.forEach((o) => {
    const key = buildDayKey(o.created_at)
    if (key in map) map[key]++
  })
  return Object.values(map)
}

function ordersByHour() {
  const hours = Array(24).fill(0)
  orders.value.forEach((o) => {
    const h = new Date(o.created_at).getHours()
    hours[h]++
  })
  return hours
}

// ── Charts ───────────────────────────────────────────────────────────────────
const revenueChartRef = ref(null)
const statusChartRef = ref(null)
const dailyOrdersChartRef = ref(null)
const peakHoursChartRef = ref(null)

let charts = []

function destroyCharts() {
  charts.forEach((c) => c?.destroy())
  charts = []
}

function renderCharts() {
  const labels = buildDayLabels()
  const currency = authStore.profile?.restaurants?.currency || 'USD'

  // 1) Revenue line chart
  if (revenueChartRef.value) {
    const c = new Chart(revenueChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueByDay(),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#f97316',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ' ' + formatCurrency(ctx.parsed.y) },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { size: 11 }, callback: (v) => formatCurrency(v) },
          },
        },
      },
    })
    charts.push(c)
  }

  // 2) Status doughnut
  if (statusChartRef.value && statusBreakdown.value.length > 0) {
    const c = new Chart(statusChartRef.value, {
      type: 'doughnut',
      data: {
        labels: statusBreakdown.value.map((s) => s.label),
        datasets: [
          {
            data: statusBreakdown.value.map((s) => s.count),
            backgroundColor: statusBreakdown.value.map((s) => s.color),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` },
          },
        },
      },
    })
    charts.push(c)
  }

  // 3) Daily order count bar
  if (dailyOrdersChartRef.value) {
    const c = new Chart(dailyOrdersChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Orders',
            data: orderCountByDay(),
            backgroundColor: 'rgba(249,115,22,0.7)',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
          y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, stepSize: 1 } },
        },
      },
    })
    charts.push(c)
  }

  // 4) Peak hours bar
  if (peakHoursChartRef.value) {
    const hourLabels = Array.from({ length: 24 }, (_, i) => {
      const h = i % 12 || 12
      return `${h}${i < 12 ? 'am' : 'pm'}`
    })
    const data = ordersByHour()
    const max = Math.max(...data)
    const c = new Chart(peakHoursChartRef.value, {
      type: 'bar',
      data: {
        labels: hourLabels,
        datasets: [
          {
            label: 'Orders',
            data,
            backgroundColor: data.map((v) =>
              v === max && max > 0 ? '#f97316' : 'rgba(249,115,22,0.3)',
            ),
            borderRadius: 3,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, stepSize: 1 } },
        },
      },
    })
    charts.push(c)
  }
}

onBeforeUnmount(destroyCharts)

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount) {
  const currency = authStore.profile?.restaurants?.currency || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
</script>
