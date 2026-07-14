<template>
  <div class="dashboard">
    <!-- ── Header ──────────────────────────────────────── -->
    <div class="dash-header">
      <div>
        <h2 class="dash-title">{{ $t('superAdmin.dashboard.greeting', { timeOfDay: timeOfDay, firstName: firstName }) }}</h2>
        <p class="dash-subtitle">{{ $t('superAdmin.dashboard.subtitle') }}</p>
      </div>
      <div class="dash-date">{{ todayFormatted }}</div>
    </div>

    <!-- ── Stat Cards ──────────────────────────────────── -->
    <div class="stat-grid" v-if="!loading">
      <div
        class="stat-card"
        v-for="(card, i) in statCards"
        :key="i"
        :style="`--delay: ${i * 60}ms`"
      >
        <div class="stat-card-top">
          <span class="stat-label">{{ card.label }}</span>
          <span class="stat-icon" :style="`background: ${card.iconBg}`">
            <span v-html="card.icon" :style="`color: ${card.iconColor}`" />
          </span>
        </div>
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-sub" v-if="card.sub">{{ card.sub }}</div>
      </div>
    </div>
    <div class="stat-grid" v-else>
      <div class="stat-card skeleton" v-for="i in 4" :key="i" />
    </div>

    <!-- ── Bottom Grid ─────────────────────────────────── -->
    <div class="bottom-grid">
      <!-- Subscription Breakdown -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">{{ $t('superAdmin.dashboard.subscriptionBreakdown') }}</h3>
        </div>
        <div v-if="!loading" class="breakdown-list">
          <div class="breakdown-item" v-for="item in breakdown" :key="item.label">
            <div class="breakdown-left">
              <span class="breakdown-dot" :style="`background: ${item.color}`" />
              <span class="breakdown-label">{{ item.label }}</span>
            </div>
            <div class="breakdown-right">
              <span class="breakdown-count">{{ item.count }}</span>
              <div class="breakdown-bar-wrap">
                <div
                  class="breakdown-bar"
                  :style="`width: ${item.pct}%; background: ${item.color}`"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="skeleton-rows">
          <div class="skeleton-row" v-for="i in 4" :key="i" />
        </div>
      </div>

      <!-- Expiring Soon -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">{{ $t('superAdmin.dashboard.expiringSoon') }}</h3>
          <span class="panel-badge warning" v-if="expiringSoon.length">{{
            expiringSoon.length
          }}</span>
        </div>
        <div v-if="!loading">
          <div v-if="expiringSoon.length === 0" class="empty-state">
            <span v-html="icons.check" />
            {{ $t('superAdmin.dashboard.noExpiringPlans') }}
          </div>
          <div v-else class="expire-list">
            <div class="expire-item" v-for="r in expiringSoon" :key="r.id">
              <div class="expire-avatar">{{ r.name[0].toUpperCase() }}</div>
              <div class="expire-info">
                <span class="expire-name">{{ r.name }}</span>
                <span class="expire-plan">{{ r.plan }}</span>
              </div>
              <div class="expire-days" :class="r.daysLeft <= 3 ? 'danger' : 'warning'">
                {{ $t('superAdmin.dashboard.daysLeft', { days: r.daysLeft }) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="skeleton-rows">
          <div class="skeleton-row" v-for="i in 3" :key="i" />
        </div>
      </div>

      <!-- Recently Upgraded -->
      <div class="panel panel-wide">
        <div class="panel-header">
          <h3 class="panel-title">{{ $t('superAdmin.dashboard.recentlyUpgraded') }}</h3>
        </div>
        <div v-if="!loading">
          <div v-if="recentUpgrades.length === 0" class="empty-state">
            <span v-html="icons.inbox" />
            {{ $t('superAdmin.dashboard.noRecentUpgrades') }}
          </div>

          <!-- Desktop table -->
          <table class="upgrade-table desktop-only" v-else>
            <thead>
              <tr>
                <th>{{ $t('superAdmin.dashboard.table.restaurant') }}</th>
                <th>{{ $t('superAdmin.dashboard.table.plan') }}</th>
                <th>{{ $t('superAdmin.dashboard.table.billing') }}</th>
                <th>{{ $t('superAdmin.dashboard.table.pricePerMonth') }}</th>
                <th>{{ $t('superAdmin.dashboard.table.upgraded') }}</th>
                <th>{{ $t('superAdmin.dashboard.table.expires') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recentUpgrades" :key="r.id">
                <td>
                  <div class="table-name">
                    <span class="table-avatar">{{ r.name[0].toUpperCase() }}</span>
                    {{ r.name }}
                  </div>
                </td>
                <td>
                  <span class="plan-badge" :class="r.plan">{{ r.plan }}</span>
                </td>
                <td>
                  <span class="billing-badge" :class="r.billing_type">
                    {{ r.billing_type === 'lemonsqueezy' ? $t('superAdmin.dashboard.lemonSqueezy') : $t('superAdmin.dashboard.manual') }}
                  </span>
                </td>
                <td>
                  <span class="price-tag">{{ $t('superAdmin.dashboard.pricePerMonthValue', { price: getPlanPrice(r.billing_type, r.plan) }) }}</span>
                </td>
                <td class="td-muted">{{ formatDate(r.updated_at) }}</td>
                <td class="td-muted">
                  {{ r.billing_type === 'lemonsqueezy' ? $t('superAdmin.dashboard.autoRenewShort') : formatDate(r.plan_expires_at) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile cards -->
          <div class="upgrade-cards mobile-only" v-if="recentUpgrades.length > 0">
            <div class="upgrade-card" v-for="r in recentUpgrades" :key="r.id">
              <div class="upgrade-card-top">
                <div class="table-name">
                  <span class="table-avatar">{{ r.name[0].toUpperCase() }}</span>
                  <span class="upgrade-card-name">{{ r.name }}</span>
                </div>
                <span class="price-tag">{{ $t('superAdmin.dashboard.pricePerMonthValue', { price: getPlanPrice(r.billing_type, r.plan) }) }}</span>
              </div>
              <div class="upgrade-card-badges">
                <span class="plan-badge" :class="r.plan">{{ r.plan }}</span>
                <span class="billing-badge" :class="r.billing_type">
                  {{ r.billing_type === 'lemonsqueezy' ? $t('superAdmin.dashboard.lemonSqueezy') : $t('superAdmin.dashboard.manual') }}
                </span>
              </div>
              <div class="upgrade-card-dates">
                <span class="upgrade-card-date-item">
                  <span class="upgrade-card-date-label">{{ $t('superAdmin.dashboard.card.upgradedLabel') }}</span>
                  <span class="upgrade-card-date-value">{{ formatDate(r.updated_at) }}</span>
                </span>
                <span class="upgrade-card-date-item">
                  <span class="upgrade-card-date-label">{{ $t('superAdmin.dashboard.card.expiresLabel') }}</span>
                  <span class="upgrade-card-date-value">
                    {{
                      r.billing_type === 'lemonsqueezy'
                        ? $t('superAdmin.dashboard.autoRenew')
                        : formatDate(r.plan_expires_at)
                    }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="skeleton-rows">
          <div class="skeleton-row" v-for="i in 4" :key="i" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const loading = ref(true)

// ── Pricing — reads from platform_settings.app_config ──
// Falls back to defaults if not yet configured
let PLAN_PRICE = {
  manual: { starter: 15, pro: 25 },
  lemonsqueezy: { starter: 49, pro: 99 },
}

async function loadPrices() {
  const { data } = await supabase
    .from('platform_settings')
    .select('app_config')
    .eq('id', true)
    .single()
  if (data?.app_config) {
    const p = data.app_config
    PLAN_PRICE = {
      manual: { starter: p.starter_price_manual ?? 15, pro: p.pro_price_manual ?? 25 },
      lemonsqueezy: { starter: p.starter_price_ls ?? 49, pro: p.pro_price_ls ?? 99 },
    }
  }
}

function getPlanPrice(billingType, plan) {
  return PLAN_PRICE[billingType ?? 'manual']?.[plan] ?? 0
}

// ── Data refs ──────────────────────────────────────────
const totalRestaurants = ref(0)
const totalUsers = ref(0)
const activeSubscriptions = ref(0)
const manualCount = ref(0)
const lsCount = ref(0)
const trialCount = ref(0)
const expiredCount = ref(0)
const expiringSoon = ref([])
const recentUpgrades = ref([])
const allRestaurants = ref([])

// ── Computed ───────────────────────────────────────────
const firstName = computed(() => authStore.profile?.full_name?.split(' ')[0] || t('superAdmin.dashboard.fallbackName'))

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const mrr = computed(() =>
  allRestaurants.value
    .filter((r) => ['starter', 'pro'].includes(r.plan))
    .reduce((sum, r) => sum + getPlanPrice(r.billing_type ?? 'manual', r.plan), 0),
)

const mrrManual = computed(() =>
  allRestaurants.value
    .filter((r) => ['starter', 'pro'].includes(r.plan) && r.billing_type === 'manual')
    .reduce((sum, r) => sum + getPlanPrice('manual', r.plan), 0),
)

const mrrLS = computed(() =>
  allRestaurants.value
    .filter((r) => ['starter', 'pro'].includes(r.plan) && r.billing_type === 'lemonsqueezy')
    .reduce((sum, r) => sum + getPlanPrice('lemonsqueezy', r.plan), 0),
)

const statCards = computed(() => [
  {
    label: t('superAdmin.dashboard.stat.totalRestaurants'),
    value: totalRestaurants.value,
    sub: t('superAdmin.dashboard.stat.activeSubtext', { count: activeSubscriptions.value }),
    icon: icons.store,
    iconBg: '#fff7ed',
    iconColor: '#f97316',
  },
  {
    label: t('superAdmin.dashboard.stat.totalUsers'),
    value: totalUsers.value,
    sub: t('superAdmin.dashboard.stat.usersSubtext'),
    icon: icons.users,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
  },
  {
    label: t('superAdmin.dashboard.stat.activeSubscriptions'),
    value: activeSubscriptions.value,
    sub: t('superAdmin.dashboard.stat.subscriptionsSubtext', { lsCount: lsCount.value, manualCount: manualCount.value }),
    icon: icons.credit,
    iconBg: '#f0fdf4',
    iconColor: '#22c55e',
  },
  {
    label: t('superAdmin.dashboard.stat.totalMrr'),
    value: `$${mrr.value.toLocaleString()}`,
    sub: t('superAdmin.dashboard.stat.mrrSubtext', { manual: mrrManual.value, ls: mrrLS.value }),
    icon: icons.dollar,
    iconBg: '#fdf4ff',
    iconColor: '#a855f7',
  },
])

const breakdown = computed(() => {
  const total = totalRestaurants.value || 1
  return [
    {
      label: t('superAdmin.dashboard.breakdown.lemonSqueezy'),
      count: lsCount.value,
      color: '#f97316',
      pct: Math.round((lsCount.value / total) * 100),
    },
    {
      label: t('superAdmin.dashboard.breakdown.manual'),
      count: manualCount.value,
      color: '#a855f7',
      pct: Math.round((manualCount.value / total) * 100),
    },
    {
      label: t('superAdmin.dashboard.breakdown.trial'),
      count: trialCount.value,
      color: '#3b82f6',
      pct: Math.round((trialCount.value / total) * 100),
    },
    {
      label: t('superAdmin.dashboard.breakdown.expired'),
      count: expiredCount.value,
      color: '#e11d48',
      pct: Math.round((expiredCount.value / total) * 100),
    },
  ]
})

// ── Icons ──────────────────────────────────────────────
const icons = {
  store: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  credit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  dollar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  inbox: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
}

// ── Helpers ────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

// ── Fetch ──────────────────────────────────────────────
onMounted(async () => {
  await loadPrices()
  try {
    const { data: restaurants, error: rErr } = await supabase
      .from('restaurants')
      .select('id, name, plan, billing_type, plan_expires_at, updated_at')
      .order('updated_at', { ascending: false })

    if (rErr) throw rErr

    allRestaurants.value = restaurants
    totalRestaurants.value = restaurants.length

    lsCount.value = restaurants.filter(
      (r) => r.billing_type === 'lemonsqueezy' && ['starter', 'pro'].includes(r.plan),
    ).length
    manualCount.value = restaurants.filter(
      (r) => r.billing_type === 'manual' && ['starter', 'pro'].includes(r.plan),
    ).length
    trialCount.value = restaurants.filter((r) => r.plan === 'trial' || !r.plan).length
    expiredCount.value = restaurants.filter((r) => r.plan === 'expired').length
    activeSubscriptions.value = lsCount.value + manualCount.value

    expiringSoon.value = restaurants
      .filter((r) => r.billing_type === 'manual' && r.plan_expires_at)
      .map((r) => ({ ...r, daysLeft: daysUntil(r.plan_expires_at) }))
      .filter((r) => r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 14)
      .sort((a, b) => a.daysLeft - b.daysLeft)

    recentUpgrades.value = restaurants
      .filter((r) => ['starter', 'pro'].includes(r.plan))
      .slice(0, 8)

    const { count, error: uErr } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (uErr) throw uErr
    totalUsers.value = count ?? 0
  } catch (err) {
    console.error('SuperAdminDashboard fetch error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
  max-width: 1280px;
}

/* ── Header ─────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.dash-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1917;
  margin: 0 0 4px;
  letter-spacing: -0.4px;
}
.dash-subtitle {
  font-size: 13.5px;
  color: #6b6963;
  margin: 0;
}
.dash-date {
  font-size: 12.5px;
  color: #a8a49e;
  font-weight: 500;
  padding-top: 4px;
  white-space: nowrap;
}

/* ── Stat grid ──────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  background: #ffffff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fadeUp 0.35s ease both;
  animation-delay: var(--delay, 0ms);
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b6963;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-value {
  font-size: 26px;
  font-weight: 750;
  color: #1a1917;
  letter-spacing: -0.8px;
  line-height: 1;
}
.stat-sub {
  font-size: 11.5px;
  color: #a8a49e;
  font-weight: 500;
}

/* ── Bottom grid ────────────────────────────────────── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.panel {
  background: #ffffff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  padding: 20px;
  animation: fadeUp 0.4s ease both;
  animation-delay: 240ms;
}
.panel-wide {
  grid-column: 1 / -1;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 14px;
  font-weight: 650;
  color: #1a1917;
  margin: 0;
  letter-spacing: -0.2px;
}
.panel-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.panel-badge.warning {
  background: #fff7ed;
  color: #c2410c;
}

/* ── Breakdown ──────────────────────────────────────── */
.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.breakdown-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 110px;
}
.breakdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.breakdown-label {
  font-size: 13px;
  color: #3d3d3a;
  font-weight: 500;
}
.breakdown-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}
.breakdown-count {
  font-size: 13px;
  font-weight: 650;
  color: #1a1917;
  min-width: 24px;
  text-align: right;
}
.breakdown-bar-wrap {
  width: 80px;
  height: 6px;
  background: #f3f1ee;
  border-radius: 99px;
  overflow: hidden;
}
.breakdown-bar {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 4px;
}

/* ── Expiring soon ──────────────────────────────────── */
.expire-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.expire-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fafaf9;
  border: 1px solid #f0ede8;
}
.expire-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #f97316;
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.expire-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.expire-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1917;
}
.expire-plan {
  font-size: 11px;
  color: #a8a49e;
  text-transform: capitalize;
}
.expire-days {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}
.expire-days.warning {
  background: #fff7ed;
  color: #c2410c;
}
.expire-days.danger {
  background: #fff1f2;
  color: #e11d48;
}

/* ── Upgrade table (desktop) ────────────────────────── */
.upgrade-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.upgrade-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 12px 10px;
  border-bottom: 1px solid #f0ede8;
}
.upgrade-table thead th:first-child {
  padding-left: 0;
}
.upgrade-table tbody tr:hover td {
  background: #fafaf9;
}
.upgrade-table tbody td {
  padding: 11px 12px;
  color: #3d3d3a;
  border-bottom: 1px solid #f8f7f4;
  vertical-align: middle;
}
.upgrade-table tbody td:first-child {
  padding-left: 0;
}
.td-muted {
  color: #a8a49e !important;
  font-size: 12px !important;
}
.table-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.table-avatar {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #f3f1ee;
  color: #6b6963;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.price-tag {
  font-size: 12px;
  font-weight: 650;
  color: #1a1917;
}

/* ── Upgrade cards (mobile) ─────────────────────────── */
.upgrade-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.upgrade-card {
  padding: 12px 14px;
  background: #fafaf9;
  border: 1px solid #f0ede8;
  border-radius: 11px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.upgrade-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.upgrade-card-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1917;
}
.upgrade-card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.upgrade-card-dates {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.upgrade-card-date-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.upgrade-card-date-label {
  font-size: 10px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.upgrade-card-date-value {
  font-size: 12.5px;
  color: #3d3d3a;
  font-weight: 500;
}

/* ── Visibility helpers ─────────────────────────────── */
.desktop-only {
  display: table;
}
.mobile-only {
  display: none;
}

/* ── Badges ─────────────────────────────────────────── */
.plan-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  text-transform: capitalize;
}
.plan-badge.pro {
  background: #fdf4ff;
  color: #9333ea;
}
.plan-badge.starter {
  background: #eff6ff;
  color: #2563eb;
}

.billing-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.billing-badge.lemonsqueezy {
  background: #fff7ed;
  color: #c2410c;
}
.billing-badge.manual {
  background: #f0fdf4;
  color: #15803d;
}

/* ── Empty state ────────────────────────────────────── */
.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a8a49e;
  font-size: 13px;
  padding: 12px 0;
}

/* ── Skeleton ───────────────────────────────────────── */
.stat-card.skeleton {
  height: 110px;
  background: linear-gradient(90deg, #f3f1ee 25%, #e8e6e1 50%, #f3f1ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-row {
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f1ee 25%, #e8e6e1 50%, #f3f1ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

/* ── Responsive ─────────────────────────────────────── */

/* Large tablet */
@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet */
@media (max-width: 768px) {
  .dashboard {
    gap: 16px;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stat-card {
    padding: 14px;
  }
  .stat-value {
    font-size: 22px;
  }
  .bottom-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .panel-wide {
    grid-column: 1;
  }
  .breakdown-bar-wrap {
    width: 60px;
  }
  .dash-date {
    display: none;
  }
}

/* Mobile */
@media (max-width: 560px) {
  .dash-title {
    font-size: 18px;
  }
  .dash-subtitle {
    font-size: 12.5px;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .stat-card {
    padding: 12px;
    gap: 6px;
  }
  .stat-label {
    font-size: 10px;
  }
  .stat-value {
    font-size: 20px;
  }
  .stat-sub {
    font-size: 10.5px;
  }
  .stat-icon {
    width: 28px;
    height: 28px;
  }
  .panel {
    padding: 14px;
  }
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: flex;
    flex-direction: column;
  }
  .breakdown-left {
    min-width: 90px;
  }
  .breakdown-bar-wrap {
    width: 50px;
  }
  .expire-name {
    font-size: 12px;
  }
}

/* Small mobile */
@media (max-width: 380px) {
  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }
  .stat-value {
    font-size: 18px;
  }
  .stat-sub {
    display: none;
  }
}
</style>
