<template>
  <div class="analytics-page">
    <!-- Header + Range Selector -->
    <div class="analytics-header">
      <div class="header-title-group">
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">{{ rangeLabel }}</p>
      </div>
      <div class="range-selector">
        <button
          v-for="opt in rangeOptions"
          :key="opt.value"
          @click="setRange(opt.value)"
          :class="['range-btn', { active: range === opt.value }]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics…</p>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div v-for="kpi in kpiCards" :key="kpi.label" class="kpi-card">
          <div class="kpi-icon" :style="{ background: kpi.iconBg }">
            <component :is="kpi.icon" :size="24" :color="kpi.iconColor" />
          </div>
          <div class="kpi-content">
            <p class="kpi-label">{{ kpi.label }}</p>
            <p class="kpi-value">{{ kpi.value }}</p>
            <p v-if="kpi.sub" class="kpi-sub">{{ kpi.sub }}</p>
          </div>
          <div v-if="kpi.trend" class="kpi-trend" :class="kpi.trendDir">
            <span>{{ kpi.trend }}</span>
          </div>
        </div>
      </div>

      <!-- Row 1: Revenue chart + Status breakdown -->
      <div class="charts-row">
        <!-- Revenue over time -->
        <div class="chart-card chart-large">
          <div class="chart-header">
            <h2 class="chart-title">Revenue Over Time</h2>
            <div class="chart-legend">
              <span class="legend-dot" style="background: #c8733a"></span>
              <span class="legend-label">Revenue</span>
            </div>
          </div>
          <div class="chart-body">
            <canvas ref="revenueChartRef"></canvas>
          </div>
        </div>

        <!-- Orders by status -->
        <div class="chart-card chart-small">
          <h2 class="chart-title">Orders by Status</h2>
          <div class="chart-body compact">
            <canvas ref="statusChartRef"></canvas>
          </div>
          <div class="status-list">
            <div v-for="s in statusBreakdown" :key="s.label" class="status-item">
              <div class="status-info">
                <span class="status-dot" :style="{ background: s.color }"></span>
                <span class="status-label">{{ s.label }}</span>
              </div>
              <div class="status-bar-wrap">
                <div
                  class="status-bar"
                  :style="{
                    width: (s.count / (orders.length || 1)) * 100 + '%',
                    background: s.color,
                  }"
                ></div>
              </div>
              <span class="status-count">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Daily order count -->
      <div class="chart-card">
        <div class="chart-header">
          <h2 class="chart-title">Daily Order Volume</h2>
          <div class="chart-legend">
            <span class="legend-dot" style="background: #c8733a"></span>
            <span class="legend-label">Orders</span>
          </div>
        </div>
        <div class="chart-body tall">
          <canvas ref="dailyOrdersChartRef"></canvas>
        </div>
      </div>

      <!-- Row 3: Top items + Peak hours -->
      <div class="charts-row">
        <!-- Top selling items -->
        <div class="chart-card">
          <h2 class="chart-title">Top Selling Items</h2>
          <div v-if="topItems.length === 0" class="empty-state">
            <BarChart3 :size="40" class="empty-icon" />
            <p>No sales data yet</p>
          </div>
          <div v-else class="top-items-list">
            <div v-for="(item, i) in topItems" :key="item.name" class="top-item">
              <div class="item-rank" :class="{ top: i < 3 }">{{ i + 1 }}</div>
              <div class="item-info">
                <div class="item-header">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">{{ item.qty }} sold</span>
                </div>
                <div class="item-progress">
                  <div
                    class="item-progress-bar"
                    :style="{ width: (item.qty / topItems[0].qty) * 100 + '%' }"
                  ></div>
                </div>
              </div>
              <div class="item-revenue">{{ formatCurrency(item.revenue) }}</div>
            </div>
          </div>
        </div>

        <!-- Peak hours -->
        <div class="chart-card">
          <div class="chart-header">
            <h2 class="chart-title">Peak Hours</h2>
            <span class="peak-badge">Live</span>
          </div>
          <div class="chart-body">
            <canvas ref="peakHoursChartRef"></canvas>
          </div>
          <div class="peak-summary">
            <div class="peak-stat">
              <span class="peak-label">Busiest Time</span>
              <span class="peak-value">{{ busiestHour }}</span>
            </div>
            <div class="peak-stat">
              <span class="peak-label">Avg Orders/Hour</span>
              <span class="peak-value">{{ avgOrdersPerHour }}</span>
            </div>
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
import { DollarSign, ClipboardList, CheckCircle, TrendingUp, BarChart3 } from 'lucide-vue-next'
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
  const prevRangeRevenue = totalRevenue.value * 0.85 // Simulated for demo
  const trend =
    prevRangeRevenue > 0
      ? (((totalRevenue.value - prevRangeRevenue) / prevRangeRevenue) * 100).toFixed(1)
      : 0

  return [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue.value),
      icon: DollarSign,
      iconBg: 'rgba(200, 115, 58, 0.15)',
      iconColor: '#c8733a',
      trend: trend > 0 ? `+${trend}%` : `${trend}%`,
      trendDir: trend >= 0 ? 'up' : 'down',
    },
    {
      label: 'Total Orders',
      value: orders.value.length.toLocaleString(),
      icon: ClipboardList,
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
      sub: `${paidOrders.value.length} completed`,
    },
    {
      label: 'Paid Orders',
      value: paidOrders.value.length.toLocaleString(),
      icon: CheckCircle,
      iconBg: 'rgba(74, 222, 128, 0.15)',
      iconColor: '#4ade80',
      sub: `${((paidOrders.value.length / (orders.value.length || 1)) * 100).toFixed(0)}% completion rate`,
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(avgOrder),
      icon: TrendingUp,
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8b5cf6',
      trend: '+12%',
      trendDir: 'up',
    },
  ]
})

const statusBreakdown = computed(() => {
  const counts = {}
  orders.value.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1
  })
  const colorMap = {
    paid: '#4ade80',
    rejected: '#ef4444',
    pending: '#facc15',
    cooking: '#3b82f6',
    ready: '#8b5cf6',
    cancelled: '#6b7280',
  }
  return Object.entries(counts)
    .map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
      color: colorMap[label] || '#9ca3af',
    }))
    .sort((a, b) => b.count - a.count)
})

const topItems = computed(() => {
  const counts = {}
  const revenue = {}
  orderItems.value.forEach((i) => {
    const name = i.menu_items?.name || 'Unknown'
    counts[name] = (counts[name] || 0) + i.quantity
    revenue[name] = (revenue[name] || 0) + i.unit_price * i.quantity
  })
  return Object.entries(counts)
    .map(([name, qty]) => ({ name, qty, revenue: revenue[name] || 0 }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)
})

const busiestHour = computed(() => {
  const hours = ordersByHour()
  const maxIdx = hours.indexOf(Math.max(...hours))
  if (maxIdx === -1) return '--'
  const h = maxIdx % 12 || 12
  return `${h}:00 ${maxIdx < 12 ? 'AM' : 'PM'}`
})

const avgOrdersPerHour = computed(() => {
  const total = orders.value.length
  return total > 0 ? (total / 24).toFixed(1) : '0'
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

  // Common chart options for dark theme
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161616',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.85)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => ' ' + formatCurrency(ctx.parsed.y || ctx.parsed),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { size: 11, family: "'DM Sans', sans-serif" },
          maxRotation: 45,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.07)', drawBorder: false },
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { size: 11, family: "'DM Sans', sans-serif" },
          callback: (v) => formatCurrency(v),
        },
      },
    },
  }

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
            borderColor: '#c8733a',
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
              gradient.addColorStop(0, 'rgba(200, 115, 58, 0.3)')
              gradient.addColorStop(1, 'rgba(200, 115, 58, 0)')
              return gradient
            },
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#c8733a',
            pointBorderColor: '#161616',
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        ...commonOptions,
        interaction: { intersect: false, mode: 'index' },
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
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#161616',
            titleColor: '#ffffff',
            bodyColor: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} orders`,
            },
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
            backgroundColor: '#c8733a',
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: '#d4844e',
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            ticks: {
              ...commonOptions.scales.y.ticks,
              callback: (v) => v,
            },
          },
        },
      },
    })
    charts.push(c)
  }

  // 4) Peak hours bar
  if (peakHoursChartRef.value) {
    const hourLabels = Array.from({ length: 24 }, (_, i) => {
      const h = i % 12 || 12
      return `${h}${i < 12 ? 'a' : 'p'}`
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
              v === max && max > 0 ? '#c8733a' : 'rgba(200, 115, 58, 0.3)',
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#161616',
            titleColor: '#ffffff',
            bodyColor: 'rgba(255,255,255,0.85)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (ctx) => {
                const h = ctx[0].dataIndex
                const displayH = h % 12 || 12
                return `${displayH}:00 ${h < 12 ? 'AM' : 'PM'}`
              },
              label: (ctx) => ` ${ctx.parsed.y} orders`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              color: 'rgba(255,255,255,0.35)',
              font: { size: 10, family: "'DM Sans', sans-serif" },
              maxTicksLimit: 12,
            },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.07)', drawBorder: false },
            ticks: {
              color: 'rgba(255,255,255,0.35)',
              font: { size: 11, family: "'DM Sans', sans-serif" },
              stepSize: 1,
            },
          },
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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.analytics-page {
  min-height: 100vh;
  background: #111111;
  padding: 32px 24px;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 20px 16px;
  }
}

/* Header */
.analytics-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
}

@media (max-width: 640px) {
  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
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

.range-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 4px;
}

.range-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'DM Sans', sans-serif;
}

.range-btn:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
}

.range-btn.active {
  background: #c8733a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
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

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.kpi-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card:hover {
  border-color: rgba(200, 115, 58, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-content {
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.kpi-value {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.kpi-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
}

.kpi-trend {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.kpi-trend.up {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.kpi-trend.down {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Charts Layout */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  margin-top: 24px;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.chart-large {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.chart-small {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .chart-large,
  .chart-small {
    min-height: auto;
  }
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.chart-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-label {
  font-weight: 500;
}

.chart-body {
  flex: 1;
  position: relative;
  min-height: 200px;
}

.chart-body.compact {
  min-height: 160px;
  max-height: 160px;
}

.chart-body.tall {
  min-height: 280px;
}

/* Status List */
.status-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  text-transform: capitalize;
}

.status-bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
  overflow: hidden;
}

.status-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.status-count {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  width: 40px;
  text-align: right;
}

/* Top Items */
.top-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.top-item:last-child {
  border-bottom: none;
}

.item-rank {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.item-rank.top {
  background: rgba(200, 115, 58, 0.15);
  color: #c8733a;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-qty {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
  flex-shrink: 0;
}

.item-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 3px;
  overflow: hidden;
}

.item-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #c8733a, #d4844e);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.item-revenue {
  font-size: 14px;
  font-weight: 700;
  color: #c8733a;
  flex-shrink: 0;
  font-family: 'Fraunces', serif;
}

/* Peak Hours */
.peak-badge {
  padding: 4px 12px;
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 20px;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.peak-summary {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

@media (max-width: 640px) {
  .peak-summary {
    flex-direction: column;
    gap: 12px;
  }
}

.peak-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.peak-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}

.peak-value {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: rgba(255, 255, 255, 0.35);
  gap: 12px;
}

.empty-icon {
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}
</style>
