<template>
  <div class="page">
    <!-- ── Page header ──────────────────────────────── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('superAdmin.restaurants.title') }}</h2>
        <p class="page-sub">{{ $t('superAdmin.restaurants.subtitle', { filtered: filtered.length, total: restaurants.length }) }}</p>
      </div>
    </div>

    <!-- ── Filters ──────────────────────────────────── -->
    <div class="filters">
      <div class="search-wrap">
        <span class="search-icon" v-html="icons.search" />
        <input
          v-model="searchQ"
          class="search-input"
          :placeholder="$t('superAdmin.restaurants.searchPlaceholder')"
          type="text"
        />
        <button v-if="searchQ" class="search-clear" @click="searchQ = ''">×</button>
      </div>
      <div class="filter-group">
        <button
          v-for="p in planFilters"
          :key="p.value"
          class="filter-btn"
          :class="{ active: planFilter === p.value }"
          @click="planFilter = p.value"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="filter-group">
        <button
          v-for="b in billingFilters"
          :key="b.value"
          class="filter-btn"
          :class="{ active: billingFilter === b.value }"
          @click="billingFilter = b.value"
        >
          {{ b.label }}
        </button>
      </div>
    </div>

    <!-- ── Table ────────────────────────────────────── -->
    <div class="table-wrap">
      <div v-if="loading" class="skeleton-rows">
        <div class="skeleton-row" v-for="i in 6" :key="i" />
      </div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <span v-html="icons.empty" />
        <span>{{ $t('superAdmin.restaurants.empty') }}</span>
      </div>

      <table v-else class="r-table">
        <thead>
          <tr>
            <th>{{ $t('superAdmin.restaurants.table.restaurant') }}</th>
            <th>{{ $t('superAdmin.restaurants.table.owner') }}</th>
            <th>{{ $t('superAdmin.restaurants.table.plan') }}</th>
            <th>{{ $t('superAdmin.restaurants.table.billing') }}</th>
            <th>{{ $t('superAdmin.restaurants.table.trialExpiry') }}</th>
            <th>{{ $t('superAdmin.restaurants.table.created') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" class="r-row">
            <td>
              <div class="r-name-cell">
                <div class="r-avatar">{{ r.name?.[0]?.toUpperCase() ?? '?' }}</div>
                <div>
                  <div class="r-name">{{ r.name }}</div>
                  <div class="r-slug">/{{ r.slug }}</div>
                </div>
              </div>
            </td>
            <td class="td-email">{{ r.owner_email ?? '—' }}</td>
            <td>
              <span class="plan-badge" :class="r.plan ?? 'trial'">
                {{ r.plan ?? 'trial' }}
              </span>
            </td>
            <td>
              <span class="billing-badge" :class="r.billing_type ?? 'manual'">
                {{ r.billing_type === 'lemonsqueezy' ? $t('superAdmin.restaurants.lemonSqueezy') : $t('superAdmin.restaurants.manual') }}
              </span>
            </td>
            <td class="td-date">
              <template v-if="r.billing_type === 'lemonsqueezy'">
                <span class="td-muted">{{ $t('superAdmin.restaurants.autoRenew') }}</span>
              </template>
              <template v-else-if="r.plan_expires_at">
                <span :class="expiryClass(r.plan_expires_at)">
                  {{ formatDate(r.plan_expires_at) }}
                  <span class="expiry-tag">{{ daysLabel(r.plan_expires_at) }}</span>
                </span>
              </template>
              <template v-else-if="r.trial_ends_at">
                <span :class="expiryClass(r.trial_ends_at)">
                  {{ $t('superAdmin.restaurants.trialEnds', { date: formatDate(r.trial_ends_at) }) }}
                </span>
              </template>
              <template v-else>
                <span class="td-muted">—</span>
              </template>
            </td>
            <td class="td-muted">{{ formatDate(r.created_at) }}</td>
            <td>
              <div class="action-btns">
                <button
                  class="action-btn"
                  :title="$t('superAdmin.restaurants.action.viewDetails')"
                  @click="openDetails(r)"
                  v-html="icons.eye"
                />
                <button
                  class="action-btn"
                  :title="$t('superAdmin.restaurants.action.manageBilling')"
                  @click="openBilling(r)"
                  v-html="icons.billing"
                />
                <button
                  class="action-btn danger"
                  :title="$t('superAdmin.restaurants.action.impersonate')"
                  @click="impersonate(r)"
                  v-html="icons.impersonate"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Details modal ────────────────────────────── -->
    <Teleport to="body">
      <div v-if="detailsModal" class="modal-backdrop" @click.self="detailsModal = null">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <div class="r-avatar lg">{{ detailsModal.name?.[0]?.toUpperCase() }}</div>
              <div>
                <h3 class="modal-title">{{ detailsModal.name }}</h3>
                <span class="modal-sub">/{{ detailsModal.slug }}</span>
              </div>
            </div>
            <button class="modal-close" @click="detailsModal = null">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item" v-for="d in detailFields(detailsModal)" :key="d.label">
                <span class="detail-label">{{ d.label }}</span>
                <span class="detail-value" v-html="d.value" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Billing modal ────────────────────────────── -->
    <Teleport to="body">
      <div v-if="billingModal" class="modal-backdrop" @click.self="closeBilling">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span v-html="icons.billing" style="color: #f97316" />
              <div>
                <h3 class="modal-title">{{ $t('superAdmin.restaurants.billingModal.title') }}</h3>
                <span class="modal-sub">{{ billingModal.name }}</span>
              </div>
            </div>
            <button class="modal-close" @click="closeBilling">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">{{ $t('superAdmin.restaurants.billingModal.planLabel') }}</label>
              <select v-model="billingForm.plan" class="form-select">
                <option value="trial">{{ $t('superAdmin.restaurants.billingModal.planOption.trial') }}</option>
                <option value="starter">{{ $t('superAdmin.restaurants.billingModal.planOption.starter') }}</option>
                <option value="pro">{{ $t('superAdmin.restaurants.billingModal.planOption.pro') }}</option>
                <option value="expired">{{ $t('superAdmin.restaurants.billingModal.planOption.expired') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('superAdmin.restaurants.billingModal.billingTypeLabel') }}</label>
              <select v-model="billingForm.billing_type" class="form-select">
                <option value="manual">{{ $t('superAdmin.restaurants.billingModal.billingOption.manual') }}</option>
                <option value="lemonsqueezy">{{ $t('superAdmin.restaurants.billingModal.billingOption.lemonSqueezy') }}</option>
              </select>
            </div>
            <div class="form-group" v-if="billingForm.billing_type === 'manual'">
              <label class="form-label">{{ $t('superAdmin.restaurants.billingModal.expiresAtLabel') }}</label>
              <input v-model="billingForm.plan_expires_at" type="date" class="form-input" />
              <div class="form-hint">
                {{ $t('superAdmin.restaurants.billingModal.expiresAtHint') }}
              </div>
            </div>
            <div class="form-group" v-if="billingForm.billing_type === 'manual'">
              <div class="quick-dates">
                <span class="quick-label">{{ $t('superAdmin.restaurants.billingModal.quickSet') }}</span>
                <button class="quick-btn" @click="setExpiry(30)">{{ $t('superAdmin.restaurants.billingModal.plus30Days') }}</button>
                <button class="quick-btn" @click="setExpiry(90)">{{ $t('superAdmin.restaurants.billingModal.plus90Days') }}</button>
                <button class="quick-btn" @click="setExpiry(365)">{{ $t('superAdmin.restaurants.billingModal.plus1Year') }}</button>
                <button class="quick-btn danger" @click="billingForm.plan_expires_at = ''">
                  {{ $t('superAdmin.restaurants.billingModal.clear') }}
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeBilling">{{ $t('superAdmin.restaurants.billingModal.cancel') }}</button>
            <button class="btn-primary" :disabled="saving" @click="saveBilling">
              {{ saving ? $t('superAdmin.restaurants.billingModal.saving') : $t('superAdmin.restaurants.billingModal.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Impersonate confirm ───────────────────────── -->
    <Teleport to="body">
      <div v-if="impersonateTarget" class="modal-backdrop" @click.self="impersonateTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span v-html="icons.impersonate" style="color: #e11d48" />
              <h3 class="modal-title">{{ $t('superAdmin.restaurants.impersonateModal.title') }}</h3>
            </div>
            <button class="modal-close" @click="impersonateTarget = null">×</button>
          </div>
          <div class="modal-body">
            <p class="impersonate-warning" v-html="$t('superAdmin.restaurants.impersonateModal.warning', { name: impersonateTarget.name })"></p>
            <div class="impersonate-info">
              <span v-html="icons.info" />
              {{ $t('superAdmin.restaurants.impersonateModal.info') }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="impersonateTarget = null">{{ $t('superAdmin.restaurants.impersonateModal.cancel') }}</button>
            <button class="btn-danger" @click="confirmImpersonate">{{ $t('superAdmin.restaurants.impersonateModal.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
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
const restaurants = ref([])
const saving = ref(false)

// ── Filters ────────────────────────────────────────────
const searchQ = ref('')
const planFilter = ref('all')
const billingFilter = ref('all')

const planFilters = [
  { label: t('superAdmin.restaurants.filter.allPlans'), value: 'all' },
  { label: t('superAdmin.restaurants.filter.trial'), value: 'trial' },
  { label: t('superAdmin.restaurants.filter.starter'), value: 'starter' },
  { label: t('superAdmin.restaurants.filter.pro'), value: 'pro' },
  { label: t('superAdmin.restaurants.filter.expired'), value: 'expired' },
]

const billingFilters = [
  { label: t('superAdmin.restaurants.filter.allBilling'), value: 'all' },
  { label: t('superAdmin.restaurants.filter.manual'), value: 'manual' },
  { label: t('superAdmin.restaurants.filter.lemonSqueezy'), value: 'lemonsqueezy' },
]

const filtered = computed(() => {
  return restaurants.value.filter((r) => {
    const q = searchQ.value.toLowerCase()
    const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.slug?.toLowerCase().includes(q)
    const matchPlan = planFilter.value === 'all' || (r.plan ?? 'trial') === planFilter.value
    const matchBilling =
      billingFilter.value === 'all' || (r.billing_type ?? 'manual') === billingFilter.value
    return matchSearch && matchPlan && matchBilling
  })
})

// ── Modals ─────────────────────────────────────────────
const detailsModal = ref(null)
const billingModal = ref(null)
const impersonateTarget = ref(null)
const billingForm = ref({ plan: 'trial', billing_type: 'manual', plan_expires_at: '' })

function openDetails(r) {
  detailsModal.value = r
}

function openBilling(r) {
  billingModal.value = r
  billingForm.value = {
    plan: r.plan ?? 'trial',
    billing_type: r.billing_type ?? 'manual',
    plan_expires_at: r.plan_expires_at ? r.plan_expires_at.split('T')[0] : '',
  }
}

function closeBilling() {
  billingModal.value = null
  saving.value = false
}

function impersonate(r) {
  impersonateTarget.value = r
}

function confirmImpersonate() {
  // Opens their restaurant's public order page as a reference view
  // You can change this to any internal URL you want to preview
  window.open(`/order/${impersonateTarget.value.slug}/preview`, '_blank')
  impersonateTarget.value = null
}

// ── Save billing ───────────────────────────────────────
async function saveBilling() {
  if (!billingModal.value) return
  saving.value = true
  try {
    const updates = {
      plan: billingForm.value.plan,
      billing_type: billingForm.value.billing_type,
      plan_expires_at:
        billingForm.value.billing_type === 'manual' && billingForm.value.plan_expires_at
          ? new Date(billingForm.value.plan_expires_at).toISOString()
          : null,
      plan_updated_by: authStore.profile?.id ?? null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', billingModal.value.id)

    if (error) throw error

    // Update local state
    const idx = restaurants.value.findIndex((r) => r.id === billingModal.value.id)
    if (idx !== -1) restaurants.value[idx] = { ...restaurants.value[idx], ...updates }

    closeBilling()
  } catch (err) {
    console.error('Save billing error:', err)
    alert('Failed to save: ' + err.message)
    saving.value = false
  }
}

// ── Quick expiry dates ─────────────────────────────────
function setExpiry(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  billingForm.value.plan_expires_at = d.toISOString().split('T')[0]
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
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

function daysLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d < 0) return t('superAdmin.restaurants.daysLabel.expired')
  if (d === 0) return t('superAdmin.restaurants.daysLabel.today')
  return t('superAdmin.restaurants.daysLabel.daysLeft', { days: d })
}

function expiryClass(dateStr) {
  const d = daysUntil(dateStr)
  if (d < 0) return 'expiry-expired'
  if (d <= 3) return 'expiry-danger'
  if (d <= 14) return 'expiry-warning'
  return 'expiry-ok'
}

function detailFields(r) {
  return [
    { label: t('superAdmin.restaurants.details.restaurantId'), value: `<code>${r.id}</code>` },
    { label: t('superAdmin.restaurants.details.name'), value: r.name },
    { label: t('superAdmin.restaurants.details.slug'), value: `/${r.slug}` },
    { label: t('superAdmin.restaurants.details.ownerEmail'), value: r.owner_email ?? '—' },
    { label: t('superAdmin.restaurants.details.plan'), value: r.plan ?? 'trial' },
    { label: t('superAdmin.restaurants.details.billingType'), value: r.billing_type ?? 'manual' },
    { label: t('superAdmin.restaurants.details.trialEnds'), value: formatDate(r.trial_ends_at) },
    { label: t('superAdmin.restaurants.details.planExpires'), value: formatDate(r.plan_expires_at) },
    { label: t('superAdmin.restaurants.details.lsCustomerId'), value: r.lemonsqueezy_customer_id ?? '—' },
    { label: t('superAdmin.restaurants.details.lsSubscriptionId'), value: r.lemonsqueezy_subscription_id ?? '—' },
    { label: t('superAdmin.restaurants.details.currency'), value: r.currency ?? '—' },
    { label: t('superAdmin.restaurants.details.timezone'), value: r.timezone ?? '—' },
    { label: t('superAdmin.restaurants.details.created'), value: formatDate(r.created_at) },
    { label: t('superAdmin.restaurants.details.lastUpdated'), value: formatDate(r.updated_at) },
  ]
}

// ── Icons ──────────────────────────────────────────────
const icons = {
  search: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  billing: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  impersonate: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
  empty: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
}

// ── Fetch ──────────────────────────────────────────────
onMounted(async () => {
  try {
    // Fetch all restaurants
    const { data: rList, error: rErr } = await supabase
      .from('restaurants')
      .select(
        `
        id, name, slug, plan, billing_type,
        trial_ends_at, plan_expires_at, plan_updated_by,
        lemonsqueezy_customer_id, lemonsqueezy_subscription_id,
        currency, timezone, created_at, updated_at
      `,
      )
      .order('created_at', { ascending: false })

    if (rErr) throw rErr

    // Fetch owner emails — one admin user per restaurant
    const ids = rList.map((r) => r.id)
    const { data: owners } = await supabase
      .from('users')
      .select('restaurant_id, email')
      .eq('role', 'admin')
      .in('restaurant_id', ids)

    // Map owner email onto each restaurant
    const ownerMap = {}
    owners?.forEach((o) => {
      ownerMap[o.restaurant_id] = o.email
    })
    restaurants.value = rList.map((r) => ({ ...r, owner_email: ownerMap[r.id] ?? null }))
  } catch (err) {
    console.error('Restaurants fetch error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
}

/* ── Header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1917;
  margin: 0 0 3px;
  letter-spacing: -0.3px;
}

.page-sub {
  font-size: 13px;
  color: #a8a49e;
  margin: 0;
}

/* ── Filters ────────────────────────────────────────── */
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #a8a49e;
  display: flex;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 32px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #fff;
  font-size: 13px;
  color: #1a1917;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: #f97316;
}

.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #a8a49e;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.filter-group {
  display: flex;
  gap: 4px;
}

.filter-btn {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #fff;
  font-size: 12.5px;
  font-weight: 500;
  color: #6b6963;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: #d1cdc7;
  color: #1a1917;
}
.filter-btn.active {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
  font-weight: 600;
}

/* ── Table ──────────────────────────────────────────── */
.table-wrap {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  overflow: hidden;
}

.r-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.r-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid #f0ede8;
  background: #fafaf9;
  white-space: nowrap;
}

.r-table tbody td {
  padding: 13px 16px;
  border-bottom: 1px solid #f8f7f4;
  vertical-align: middle;
  color: #3d3d3a;
}

.r-row:last-child td {
  border-bottom: none;
}
.r-row:hover td {
  background: #fafaf9;
}

/* ── Name cell ──────────────────────────────────────── */
.r-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.r-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #f97316;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.r-avatar.lg {
  width: 40px;
  height: 40px;
  font-size: 16px;
  border-radius: 11px;
}

.r-name {
  font-weight: 600;
  color: #1a1917;
  font-size: 13.5px;
}

.r-slug {
  font-size: 11.5px;
  color: #a8a49e;
  margin-top: 1px;
}

.td-email {
  color: #6b6963 !important;
  font-size: 12.5px !important;
}

.td-muted {
  color: #a8a49e !important;
  font-size: 12px !important;
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
.plan-badge.trial {
  background: #f0fdf4;
  color: #15803d;
}
.plan-badge.expired {
  background: #fff1f2;
  color: #e11d48;
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
  background: #f8f7f4;
  color: #6b6963;
}

/* ── Expiry colors ──────────────────────────────────── */
.expiry-ok {
  color: #6b6963;
  font-size: 12.5px;
}
.expiry-warning {
  color: #c2410c;
  font-size: 12.5px;
  font-weight: 600;
}
.expiry-danger {
  color: #e11d48;
  font-size: 12.5px;
  font-weight: 700;
}
.expiry-expired {
  color: #a8a49e;
  font-size: 12.5px;
  text-decoration: line-through;
}

.expiry-tag {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0.8;
}

/* ── Action buttons ─────────────────────────────────── */
.action-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  background: transparent;
  color: #6b6963;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #f3f1ee;
  color: #1a1917;
  border-color: #d1cdc7;
}

.action-btn.danger:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

/* ── Modal ──────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalIn 0.2s ease;
}

.modal-sm {
  max-width: 420px;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0ede8;
  flex-shrink: 0;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  font-size: 15px;
  font-weight: 650;
  color: #1a1917;
  margin: 0;
}

.modal-sub {
  font-size: 12px;
  color: #a8a49e;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f1ee;
  border-radius: 7px;
  font-size: 18px;
  color: #6b6963;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #e8e6e1;
  color: #1a1917;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #f0ede8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Detail grid ────────────────────────────────────── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: #fafaf9;
  border-radius: 9px;
  border: 1px solid #f0ede8;
}

.detail-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 13px;
  color: #1a1917;
  font-weight: 500;
  word-break: break-all;
}

.detail-value code {
  font-size: 11px;
  background: #f3f1ee;
  padding: 2px 6px;
  border-radius: 5px;
  color: #6b6963;
  font-family: monospace;
}

/* ── Form ───────────────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #3d3d3a;
}

.form-select,
.form-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-family: inherit;
  color: #1a1917;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.form-select:focus,
.form-input:focus {
  border-color: #f97316;
}

.form-hint {
  font-size: 11.5px;
  color: #a8a49e;
}

.quick-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  color: #a8a49e;
}

.quick-btn {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e8e6e1;
  border-radius: 7px;
  background: #fafaf9;
  font-size: 12px;
  font-weight: 500;
  color: #3d3d3a;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.quick-btn:hover {
  background: #f3f1ee;
  border-color: #d1cdc7;
}
.quick-btn.danger:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}

/* ── Buttons ────────────────────────────────────────── */
.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #ea6c10;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  height: 36px;
  padding: 0 16px;
  background: transparent;
  color: #6b6963;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #f3f1ee;
  color: #1a1917;
}

.btn-danger {
  height: 36px;
  padding: 0 16px;
  background: #e11d48;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: #be123c;
}

/* ── Impersonate warning ─────────────────────────────── */
.impersonate-warning {
  font-size: 13.5px;
  color: #3d3d3a;
  line-height: 1.6;
  margin: 0;
}

.impersonate-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #eff6ff;
  border-radius: 9px;
  font-size: 12.5px;
  color: #1d4ed8;
  line-height: 1.5;
}

/* ── Empty & skeleton ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: #a8a49e;
  font-size: 13.5px;
}

.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px;
}

.skeleton-row {
  height: 52px;
  border-radius: 8px;
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

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 900px) {
  .r-table {
    display: block;
    overflow-x: auto;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrap {
    max-width: 100%;
  }
  .filter-group {
    flex-wrap: wrap;
  }
}
</style>
