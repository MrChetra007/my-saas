<template>
  <div class="page">
    <!-- ── Page header ──────────────────────────────── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('superAdmin.subscriptions.title') }}</h2>
        <p class="page-sub">{{ $t('superAdmin.subscriptions.subtitle', { filtered: filtered.length, total: rows.length }) }}</p>
      </div>
      <!-- Summary pills -->
      <div class="summary-pills" v-if="!loading">
        <span class="summary-pill active">{{ $t('superAdmin.subscriptions.summary.active', { count: counts.active }) }}</span>
        <span class="summary-pill trial">{{ $t('superAdmin.subscriptions.summary.trial', { count: counts.trial }) }}</span>
        <span class="summary-pill expired">{{ $t('superAdmin.subscriptions.summary.expired', { count: counts.expired }) }}</span>
      </div>
    </div>

    <!-- ── Filters ──────────────────────────────────── -->
    <div class="filters">
      <div class="search-wrap">
        <span class="search-icon" v-html="icons.search" />
        <input
          v-model="searchQ"
          class="search-input"
          :placeholder="$t('superAdmin.subscriptions.searchPlaceholder')"
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
      <div class="filter-group">
        <button
          v-for="s in statusFilters"
          :key="s.value"
          class="filter-btn"
          :class="{ active: statusFilter === s.value }"
          @click="statusFilter = s.value"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- ── Table ────────────────────────────────────── -->
    <div class="table-wrap">
      <div v-if="loading" class="skeleton-rows">
        <div class="skeleton-row" v-for="i in 7" :key="i" />
      </div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <span v-html="icons.empty" />
        <span>{{ $t('superAdmin.subscriptions.empty') }}</span>
      </div>

      <table v-else class="s-table">
        <thead>
          <tr>
            <th>{{ $t('superAdmin.subscriptions.table.restaurant') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.plan') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.billing') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.status') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.expiryRenewal') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.lsSubscriptionId') }}</th>
            <th>{{ $t('superAdmin.subscriptions.table.lastUpdatedBy') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" class="s-row">
            <td>
              <div class="r-name-cell">
                <div class="r-avatar">{{ r.name?.[0]?.toUpperCase() ?? '?' }}</div>
                <div>
                  <div class="r-name">{{ r.name }}</div>
                  <div class="r-slug">/{{ r.slug }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="plan-badge" :class="r.plan ?? 'trial'">{{ r.plan ?? 'trial' }}</span>
            </td>
            <td>
              <span class="billing-badge" :class="r.billing_type ?? 'manual'">
                {{ r.billing_type === 'lemonsqueezy' ? $t('superAdmin.subscriptions.lemonSqueezy') : $t('superAdmin.subscriptions.manual') }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="subStatus(r)">
                <span class="status-dot" />{{ subStatusLabel(r) }}
              </span>
            </td>
            <td class="td-expiry">
              <template v-if="r.billing_type === 'lemonsqueezy'">
                <span class="td-muted">{{ $t('superAdmin.subscriptions.autoRenew') }}</span>
              </template>
              <template v-else-if="r.plan_expires_at">
                <span :class="expiryClass(r.plan_expires_at)">
                  {{ formatDate(r.plan_expires_at) }}
                  <span class="expiry-tag">{{ daysLabel(r.plan_expires_at) }}</span>
                </span>
              </template>
              <template v-else-if="r.trial_ends_at">
                <span :class="expiryClass(r.trial_ends_at)">
                  {{ $t('superAdmin.subscriptions.trialPrefix', { date: formatDate(r.trial_ends_at) }) }}
                </span>
              </template>
              <template v-else>
                <span class="td-muted">—</span>
              </template>
            </td>
            <td>
              <span v-if="r.lemonsqueezy_subscription_id" class="ls-id">
                {{ r.lemonsqueezy_subscription_id }}
              </span>
              <span v-else class="td-muted">—</span>
            </td>
            <td>
              <span v-if="r.updater_name" class="updater">{{ r.updater_name }}</span>
              <span v-else class="td-muted">{{
                r.billing_type === 'lemonsqueezy' ? $t('superAdmin.subscriptions.webhook') : '—'
              }}</span>
            </td>
            <td>
              <div class="action-btns">
                <button
                  class="action-btn"
                  :title="$t('superAdmin.subscriptions.action.viewDetails')"
                  @click="openDetails(r)"
                  v-html="icons.eye"
                />
                <button
                  class="action-btn"
                  :title="$t('superAdmin.subscriptions.action.editPlan')"
                  @click="openBilling(r)"
                  v-html="icons.edit"
                />
                <button
                  class="action-btn danger"
                  :title="$t('superAdmin.subscriptions.action.markExpired')"
                  :disabled="r.plan === 'expired'"
                  @click="openExpire(r)"
                  v-html="icons.expire"
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
                <span class="modal-sub">{{ $t('superAdmin.subscriptions.detailsModal.subtitle') }}</span>
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
              <span v-html="icons.edit" style="color: #f97316" />
              <div>
                <h3 class="modal-title">{{ $t('superAdmin.subscriptions.editModal.title') }}</h3>
                <span class="modal-sub">{{ billingModal.name }}</span>
              </div>
            </div>
            <button class="modal-close" @click="closeBilling">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">{{ $t('superAdmin.subscriptions.editModal.planLabel') }}</label>
              <select v-model="billingForm.plan" class="form-select">
                <option value="trial">{{ $t('superAdmin.subscriptions.editModal.planOption.trial') }}</option>
                <option value="starter">{{ $t('superAdmin.subscriptions.editModal.planOption.starter') }}</option>
                <option value="pro">{{ $t('superAdmin.subscriptions.editModal.planOption.pro') }}</option>
                <option value="expired">{{ $t('superAdmin.subscriptions.editModal.planOption.expired') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('superAdmin.subscriptions.editModal.billingTypeLabel') }}</label>
              <select v-model="billingForm.billing_type" class="form-select">
                <option value="manual">{{ $t('superAdmin.subscriptions.editModal.billingOption.manual') }}</option>
                <option value="lemonsqueezy">{{ $t('superAdmin.subscriptions.editModal.billingOption.lemonSqueezy') }}</option>
              </select>
            </div>
            <div class="form-group" v-if="billingForm.billing_type === 'manual'">
              <label class="form-label">{{ $t('superAdmin.subscriptions.editModal.expiresAtLabel') }}</label>
              <input v-model="billingForm.plan_expires_at" type="date" class="form-input" />
              <div class="form-hint">{{ $t('superAdmin.subscriptions.editModal.expiresAtHint') }}</div>
            </div>
            <div class="form-group" v-if="billingForm.billing_type === 'manual'">
              <div class="quick-dates">
                <span class="quick-label">{{ $t('superAdmin.subscriptions.editModal.quickSet') }}</span>
                <button class="quick-btn" @click="setExpiry(30)">{{ $t('superAdmin.subscriptions.editModal.plus30Days') }}</button>
                <button class="quick-btn" @click="setExpiry(90)">{{ $t('superAdmin.subscriptions.editModal.plus90Days') }}</button>
                <button class="quick-btn" @click="setExpiry(365)">{{ $t('superAdmin.subscriptions.editModal.plus1Year') }}</button>
                <button class="quick-btn danger" @click="billingForm.plan_expires_at = ''">
                  {{ $t('superAdmin.subscriptions.editModal.clear') }}
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeBilling">{{ $t('superAdmin.subscriptions.editModal.cancel') }}</button>
            <button class="btn-primary" :disabled="saving" @click="saveBilling">
              {{ saving ? $t('superAdmin.subscriptions.editModal.saving') : $t('superAdmin.subscriptions.editModal.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Mark expired confirm ──────────────────────── -->
    <Teleport to="body">
      <div v-if="expireTarget" class="modal-backdrop" @click.self="expireTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span v-html="icons.expire" style="color: #e11d48" />
              <h3 class="modal-title">{{ $t('superAdmin.subscriptions.expireModal.title') }}</h3>
            </div>
            <button class="modal-close" @click="expireTarget = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              {{ $t('superAdmin.subscriptions.expireModal.confirmText', { name: expireTarget.name }) }}
            </p>
            <div class="confirm-info danger">
              <span v-html="icons.info" />
              {{ $t('superAdmin.subscriptions.expireModal.infoText') }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="expireTarget = null">{{ $t('superAdmin.subscriptions.expireModal.cancel') }}</button>
            <button class="btn-danger" :disabled="saving" @click="confirmExpire">
              {{ saving ? $t('superAdmin.subscriptions.expireModal.saving') : $t('superAdmin.subscriptions.expireModal.confirm') }}
            </button>
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
const saving = ref(false)
const rows = ref([])

// ── Filters ────────────────────────────────────────────
const searchQ = ref('')
const planFilter = ref('all')
const billingFilter = ref('all')
const statusFilter = ref('all')

const planFilters = [
  { label: t('superAdmin.subscriptions.filter.allPlans'), value: 'all' },
  { label: t('superAdmin.subscriptions.filter.trial'), value: 'trial' },
  { label: t('superAdmin.subscriptions.filter.starter'), value: 'starter' },
  { label: t('superAdmin.subscriptions.filter.pro'), value: 'pro' },
  { label: t('superAdmin.subscriptions.filter.expired'), value: 'expired' },
]
const billingFilters = [
  { label: t('superAdmin.subscriptions.filter.allBilling'), value: 'all' },
  { label: t('superAdmin.subscriptions.filter.manual'), value: 'manual' },
  { label: t('superAdmin.subscriptions.filter.lemonSqueezy'), value: 'lemonsqueezy' },
]
const statusFilters = [
  { label: t('superAdmin.subscriptions.filter.allStatus'), value: 'all' },
  { label: t('superAdmin.subscriptions.filter.active'), value: 'active' },
  { label: t('superAdmin.subscriptions.filter.trial'), value: 'trial' },
  { label: t('superAdmin.subscriptions.filter.expiring'), value: 'expiring' },
  { label: t('superAdmin.subscriptions.filter.expired'), value: 'expired' },
]

// ── Status helpers ─────────────────────────────────────
function subStatus(r) {
  if (r.plan === 'expired') return 'expired'
  if (!r.plan || r.plan === 'trial') return 'trial'
  if (r.billing_type === 'lemonsqueezy') return 'active'
  if (r.plan_expires_at) {
    const d = daysUntil(r.plan_expires_at)
    if (d < 0) return 'expired'
    if (d <= 14) return 'expiring'
    return 'active'
  }
  return 'active'
}

function subStatusLabel(r) {
  const s = subStatus(r)
  if (s === 'expiring') return t('superAdmin.subscriptions.status.expiringSoon')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const filtered = computed(() => {
  return rows.value.filter((r) => {
    const q = searchQ.value.toLowerCase()
    const matchSearch = !q || r.name?.toLowerCase().includes(q)
    const matchPlan = planFilter.value === 'all' || (r.plan ?? 'trial') === planFilter.value
    const matchBilling =
      billingFilter.value === 'all' || (r.billing_type ?? 'manual') === billingFilter.value
    const matchStatus = statusFilter.value === 'all' || subStatus(r) === statusFilter.value
    return matchSearch && matchPlan && matchBilling && matchStatus
  })
})

const counts = computed(() => ({
  active: rows.value.filter((r) => subStatus(r) === 'active' || subStatus(r) === 'expiring').length,
  trial: rows.value.filter((r) => subStatus(r) === 'trial').length,
  expired: rows.value.filter((r) => subStatus(r) === 'expired').length,
}))

// ── Modals ─────────────────────────────────────────────
const detailsModal = ref(null)
const billingModal = ref(null)
const expireTarget = ref(null)
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
function openExpire(r) {
  expireTarget.value = r
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

    const idx = rows.value.findIndex((r) => r.id === billingModal.value.id)
    if (idx !== -1) rows.value[idx] = { ...rows.value[idx], ...updates }
    closeBilling()
  } catch (err) {
    console.error('Save billing error:', err)
    alert('Failed: ' + err.message)
    saving.value = false
  }
}

// ── Confirm expire ─────────────────────────────────────
async function confirmExpire() {
  if (!expireTarget.value) return
  saving.value = true
  try {
    const updates = {
      plan: 'expired',
      plan_updated_by: authStore.profile?.id ?? null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', expireTarget.value.id)

    if (error) throw error

    const idx = rows.value.findIndex((r) => r.id === expireTarget.value.id)
    if (idx !== -1) rows.value[idx] = { ...rows.value[idx], ...updates }
    expireTarget.value = null
  } catch (err) {
    console.error('Expire error:', err)
    alert('Failed: ' + err.message)
  } finally {
    saving.value = false
  }
}

// ── Quick expiry ───────────────────────────────────────
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
  if (d < 0) return t('superAdmin.subscriptions.daysLabel.expired')
  if (d === 0) return t('superAdmin.subscriptions.daysLabel.today')
  return t('superAdmin.subscriptions.daysLabel.daysLeft', { days: d })
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
    { label: t('superAdmin.subscriptions.details.restaurantId'), value: `<code>${r.id}</code>` },
    { label: t('superAdmin.subscriptions.details.name'), value: r.name },
    { label: t('superAdmin.subscriptions.details.plan'), value: r.plan ?? 'trial' },
    { label: t('superAdmin.subscriptions.details.billingType'), value: r.billing_type ?? 'manual' },
    { label: t('superAdmin.subscriptions.details.status'), value: subStatusLabel(r) },
    { label: t('superAdmin.subscriptions.details.trialEnds'), value: formatDate(r.trial_ends_at) },
    { label: t('superAdmin.subscriptions.details.planExpires'), value: formatDate(r.plan_expires_at) },
    { label: t('superAdmin.subscriptions.details.lsCustomerId'), value: r.lemonsqueezy_customer_id ?? '—' },
    { label: t('superAdmin.subscriptions.details.lsSubscriptionId'), value: r.lemonsqueezy_subscription_id ?? '—' },
    {
      label: t('superAdmin.subscriptions.details.customerPortalUrl'),
      value: r.customer_portal_url
        ? `<a href="${r.customer_portal_url}" target="_blank" style="color:#f97316">${t('superAdmin.subscriptions.details.openPortal')}</a>`
        : '—',
    },
    {
      label: t('superAdmin.subscriptions.details.lastUpdatedBy'),
      value: r.updater_name ?? (r.billing_type === 'lemonsqueezy' ? t('superAdmin.subscriptions.webhook') : '—'),
    },
    { label: t('superAdmin.subscriptions.details.updatedAt'), value: formatDate(r.updated_at) },
    { label: t('superAdmin.subscriptions.details.created'), value: formatDate(r.created_at) },
  ]
}

// ── Icons ──────────────────────────────────────────────
const icons = {
  search: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  expire: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  empty: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
}

// ── Fetch ──────────────────────────────────────────────
onMounted(async () => {
  try {
    // All restaurants with subscription fields
    const { data: rList, error: rErr } = await supabase
      .from('restaurants')
      .select(
        `
        id, name, slug, plan, billing_type,
        trial_ends_at, plan_expires_at, plan_updated_by,
        lemonsqueezy_customer_id, lemonsqueezy_subscription_id,
        customer_portal_url, created_at, updated_at
      `,
      )
      .order('updated_at', { ascending: false })

    if (rErr) throw rErr

    // Fetch updater names for manual plans (plan_updated_by references users.id)
    const updaterIds = [
      ...new Set(rList.filter((r) => r.plan_updated_by).map((r) => r.plan_updated_by)),
    ]

    let updaterMap = {}
    if (updaterIds.length > 0) {
      const { data: updaters } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', updaterIds)

      updaters?.forEach((u) => {
        updaterMap[u.id] = u.full_name || u.email || 'Unknown'
      })
    }

    rows.value = rList.map((r) => ({
      ...r,
      updater_name: r.plan_updated_by ? (updaterMap[r.plan_updated_by] ?? null) : null,
    }))
  } catch (err) {
    console.error('Subscriptions fetch error:', err)
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
  flex-wrap: wrap;
  gap: 12px;
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

.summary-pills {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.summary-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}
.summary-pill.active {
  background: #f0fdf4;
  color: #15803d;
}
.summary-pill.trial {
  background: #eff6ff;
  color: #2563eb;
}
.summary-pill.expired {
  background: #fff1f2;
  color: #e11d48;
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
  max-width: 280px;
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
  padding: 0 32px;
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
.s-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.s-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 14px;
  border-bottom: 1px solid #f0ede8;
  background: #fafaf9;
  white-space: nowrap;
}
.s-table tbody td {
  padding: 13px 14px;
  border-bottom: 1px solid #f8f7f4;
  vertical-align: middle;
  color: #3d3d3a;
}
.s-row:last-child td {
  border-bottom: none;
}
.s-row:hover td {
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
  min-width: 32px;
  border-radius: 9px;
  background: #f97316;
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
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

.td-muted {
  color: #a8a49e !important;
  font-size: 12px !important;
}
.td-expiry {
  font-size: 12.5px;
}

/* ── LS ID ──────────────────────────────────────────── */
.ls-id {
  font-size: 11.5px;
  font-family: monospace;
  color: #6b6963;
  background: #f3f1ee;
  padding: 2px 7px;
  border-radius: 5px;
}
.updater {
  font-size: 12.5px;
  color: #6b6963;
  font-weight: 500;
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

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.status-badge.active {
  background: #f0fdf4;
  color: #15803d;
}
.status-badge.trial {
  background: #eff6ff;
  color: #2563eb;
}
.status-badge.expiring {
  background: #fff7ed;
  color: #c2410c;
}
.status-badge.expired {
  background: #fff1f2;
  color: #e11d48;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* ── Expiry colors ──────────────────────────────────── */
.expiry-ok {
  color: #6b6963;
}
.expiry-warning {
  color: #c2410c;
  font-weight: 600;
}
.expiry-danger {
  color: #e11d48;
  font-weight: 700;
}
.expiry-expired {
  color: #a8a49e;
  text-decoration: line-through;
}
.expiry-tag {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0.8;
}

/* ── Actions ────────────────────────────────────────── */
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
.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
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
  gap: 10px;
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

/* ── Confirm ────────────────────────────────────────── */
.confirm-text {
  font-size: 13.5px;
  color: #3d3d3a;
  line-height: 1.6;
  margin: 0;
}
.confirm-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 12.5px;
  line-height: 1.5;
}
.confirm-info.danger {
  background: #fff1f2;
  color: #be123c;
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
.btn-danger:hover:not(:disabled) {
  background: #be123c;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
@media (max-width: 1024px) {
  .s-table {
    display: block;
    overflow-x: auto;
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
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
