<template>
  <div class="invoice-panel">
    <div class="ip-header">
      <h4 class="ip-title">{{ $t('superAdmin.restaurantInvoice.title') }}</h4>
      <div class="ip-plan-badge" :class="restaurant.plan">
        {{ restaurant.plan || 'trial' }}
      </div>
    </div>

    <div class="ip-generate-row">
      <div class="ip-period-inputs">
        <div class="ip-field">
          <label class="ip-label">{{ $t('superAdmin.restaurantInvoice.periodStart') }}</label>
          <input v-model="periodStart" type="date" class="ip-input" />
        </div>
        <div class="ip-field">
          <label class="ip-label">{{ $t('superAdmin.restaurantInvoice.periodEnd') }}</label>
          <input v-model="periodEnd" type="date" class="ip-input" />
        </div>
      </div>
      <button class="btn-primary ip-gen-btn" :disabled="generating || !canGenerate" @click="generateInvoice">
        <span v-if="generating" class="ip-spinner" />
        {{ generating ? $t('superAdmin.restaurantInvoice.generating') : $t('superAdmin.restaurantInvoice.generate') }}
      </button>
    </div>

    <div v-if="errorMsg" class="ip-error">
      <span v-html="icons.error" /> {{ errorMsg }}
    </div>

    <div v-if="invoices.length === 0 && !loading" class="ip-empty">
      {{ $t('superAdmin.restaurantInvoice.noInvoices') }}
    </div>

    <div v-if="loading" class="ip-loading">
      <div class="ip-skeleton" v-for="i in 2" :key="i" />
    </div>

    <div v-for="inv in invoices" :key="inv.id" class="ip-invoice" :class="inv.status">
      <div class="ip-invoice-top">
        <div class="ip-invoice-period">
          <span class="ip-period-label">{{ $t('superAdmin.restaurantInvoice.period') }}</span>
          <span class="ip-period-dates">{{ formatDate(inv.period_start) }} – {{ formatDate(inv.period_end) }}</span>
        </div>
        <span class="ip-status-badge" :class="inv.status">{{ inv.status }}</span>
      </div>

      <div class="ip-invoice-body">
        <div class="ip-fee-row">
          <span>{{ $t('superAdmin.restaurantInvoice.baseFee') }}</span>
          <span>${{ inv.base_fee }}</span>
        </div>
        <div class="ip-fee-row">
          <span>{{ $t('superAdmin.restaurantInvoice.transactionFee') }} ({{ inv.transaction_fee_amount > 0 ? ((inv.transaction_fee_amount / (inv.base_fee + inv.transaction_fee_amount - inv.base_fee)) * 100).toFixed(1) : 0 }}%)</span>
          <span>${{ inv.transaction_fee_amount }}</span>
        </div>
        <div class="ip-fee-row ip-total">
          <span>{{ $t('superAdmin.restaurantInvoice.total') }}</span>
          <span>${{ inv.total_amount }}</span>
        </div>
        <div class="ip-fee-row">
          <span>{{ $t('superAdmin.restaurantInvoice.orderVolume') }}</span>
          <span>${{ inv.order_volume }}</span>
        </div>
      </div>

      <div v-if="inv.status === 'pending' || inv.status === 'pending_review' || inv.status === 'rejected'" class="ip-invoice-actions">
        <div v-if="inv.khqr_string" class="ip-khqr-section">
          <div class="ip-khqr-img-wrap">
            <img :src="`data:image/svg+xml;utf8,${encodeURIComponent(inv.khqr_string)}`" alt="KHQR" class="ip-khqr-img" />
          </div>
          <div class="ip-khqr-info">
            <div class="ip-khqr-row">
              <span class="ip-khqr-label">{{ $t('superAdmin.restaurantInvoice.amount') }}</span>
              <span class="ip-khqr-value">${{ inv.total_amount }}</span>
            </div>
            <div class="ip-khqr-row">
              <span class="ip-khqr-label">{{ $t('superAdmin.restaurantInvoice.md5') }}</span>
              <span class="ip-khqr-value ip-mono">{{ inv.khqr_md5?.slice(0, 16) }}...</span>
            </div>
            <p class="ip-khqr-hint">{{ $t('superAdmin.restaurantInvoice.scanHint') }}</p>
          </div>
        </div>

        <div v-if="inv.proof_url" class="ip-proof-row">
          <span class="ip-proof-label">{{ $t('superAdmin.restaurantInvoice.viewProof') }}</span>
          <button class="ip-proof-btn" @click="viewProof(inv.proof_url)">{{ $t('superAdmin.restaurantInvoice.viewProof') }}</button>
        </div>

        <div v-if="inv.status === 'pending_review'">
          <button class="btn-primary ip-paid-btn" :disabled="paying" @click="approveInvoice(inv)">
            {{ paying ? $t('superAdmin.restaurantInvoice.paying') : $t('superAdmin.restaurantInvoice.markPaid') }}
          </button>
        </div>

        <div v-if="inv.status === 'rejected' && inv.rejected_reason" class="ip-rejected-note">
          {{ $t('superAdmin.restaurantInvoice.rejected', { reason: inv.rejected_reason }) }}
        </div>
      </div>

      <div v-if="inv.status === 'paid'" class="ip-paid-info">
        <span v-html="icons.checkCircle" class="ip-paid-icon" />
        <div>
          <div class="ip-paid-label">{{ $t('superAdmin.restaurantInvoice.paidOn') }}</div>
          <div class="ip-paid-date">{{ formatDateTime(inv.paid_at) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  restaurant: { type: Object, required: true },
})

const authStore = useAuthStore()
const { t } = useI18n()

const invoices = ref([])
const loading = ref(false)
const generating = ref(false)
const paying = ref(false)
const errorMsg = ref('')
const periodStart = ref('')
const periodEnd = ref('')

const canGenerate = computed(() => periodStart.value && periodEnd.value)

function setDefaultPeriod() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  periodStart.value = start.toISOString().split('T')[0]
  periodEnd.value = end.toISOString().split('T')[0]
}

async function fetchInvoices() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('restaurant_id', props.restaurant.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    invoices.value = data || []
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}

async function generateInvoice() {
  if (!canGenerate.value) return
  generating.value = true
  errorMsg.value = ''
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-khqr-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: props.restaurant.id,
        plan_id: props.restaurant.plan || 'starter',
        period_start: periodStart.value,
        period_end: periodEnd.value,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to generate invoice')
    await fetchInvoices()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    generating.value = false
  }
}

async function approveInvoice(invoice) {
  paying.value = true
  errorMsg.value = ''
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const res = await fetch(`${supabaseUrl}/functions/v1/approve-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ invoice_id: invoice.id }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to approve invoice')
    await fetchInvoices()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    paying.value = false
  }
}

async function viewProof(proofUrl) {
  if (!proofUrl) return
  const token = (await supabase.auth.getSession()).data.session?.access_token
  const { data } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(proofUrl, 300)
  if (data?.signedUrl) {
    window.open(data.signedUrl, '_blank')
  }
}

function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

watch(() => props.restaurant.id, () => {
  setDefaultPeriod()
  fetchInvoices()
})

onMounted(() => {
  setDefaultPeriod()
  fetchInvoices()
})

const icons = {
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
}
</script>

<style scoped>
.invoice-panel {
  background: #fafaf9;
  border: 1px solid #e8e6e1;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}
.ip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ip-title {
  font-size: 14px;
  font-weight: 650;
  color: #1a1917;
  margin: 0;
}
.ip-plan-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  text-transform: capitalize;
}
.ip-plan-badge.starter { background: #eff6ff; color: #2563eb; }
.ip-plan-badge.pro { background: #fdf4ff; color: #9333ea; }
.ip-plan-badge.trial { background: #f0fdf4; color: #15803d; }
.ip-plan-badge.expired { background: #fff1f2; color: #e11d48; }

.ip-generate-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.ip-period-inputs {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 220px;
}
.ip-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.ip-label {
  font-size: 11px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ip-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1917;
  background: #fff;
  outline: none;
}
.ip-input:focus {
  border-color: #f97316;
}
.ip-gen-btn {
  height: 36px;
  white-space: nowrap;
}
.ip-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ipSpin 0.6s linear infinite;
}
@keyframes ipSpin { to { transform: rotate(360deg); } }

.ip-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #e11d48;
  padding: 8px 10px;
  background: #fff1f2;
  border-radius: 8px;
  margin-bottom: 12px;
}
.ip-empty {
  text-align: center;
  padding: 24px;
  color: #a8a49e;
  font-size: 13px;
}
.ip-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ip-skeleton {
  height: 100px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f3f1ee 25%, #e8e6e1 50%, #f3f1ee 75%);
  background-size: 200% 100%;
  animation: ipShimmer 1.4s infinite;
}
@keyframes ipShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.ip-invoice {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}
.ip-invoice.paid {
  border-color: #bbf7d0;
}
.ip-invoice-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f0ede8;
  background: #fafaf9;
}
.ip-invoice-period {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ip-period-label {
  font-size: 10px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ip-period-dates {
  font-size: 13px;
  font-weight: 600;
  color: #1a1917;
}
.ip-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}
.ip-status-badge.pending { background: #fff7ed; color: #c2410c; }
.ip-status-badge.pending_review { background: #fef3c7; color: #92400e; }
.ip-status-badge.paid { background: #f0fdf4; color: #15803d; }
.ip-status-badge.rejected { background: #fff1f2; color: #e11d48; }
.ip-status-badge.void { background: #f3f1ee; color: #6b6963; }

.ip-invoice-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ip-fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b6963;
}
.ip-fee-row.ip-total {
  font-size: 15px;
  font-weight: 700;
  color: #1a1917;
  padding-top: 6px;
  margin-top: 4px;
  border-top: 1px solid #f0ede8;
}

.ip-invoice-actions {
  padding: 12px 14px;
  border-top: 1px solid #f0ede8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ip-khqr-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.ip-khqr-img-wrap {
  width: 120px;
  height: 120px;
  min-width: 120px;
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ip-khqr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.ip-khqr-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ip-khqr-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ip-khqr-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ip-khqr-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1917;
}
.ip-mono {
  font-family: monospace;
  font-size: 12px;
  color: #6b6963;
}
.ip-khqr-hint {
  font-size: 11.5px;
  color: #a8a49e;
  margin: 4px 0 0;
  line-height: 1.4;
}
.ip-paid-btn {
  align-self: flex-end;
}
.ip-proof-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ip-proof-label {
  font-size: 12px;
  color: #6b6963;
}
.ip-proof-btn {
  font-size: 12px;
  font-weight: 600;
  color: #f97316;
  background: transparent;
  border: 1px solid #fed7aa;
  border-radius: 7px;
  padding: 4px 10px;
  cursor: pointer;
  font-family: inherit;
}
.ip-proof-btn:hover {
  background: #fff7ed;
}
.ip-rejected-note {
  font-size: 12px;
  color: #e11d48;
  background: #fff1f2;
  padding: 8px 10px;
  border-radius: 8px;
  font-style: italic;
}

.ip-paid-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-top: 1px solid #bbf7d0;
}
.ip-paid-icon {
  flex-shrink: 0;
  display: flex;
}
.ip-paid-label {
  font-size: 11px;
  font-weight: 600;
  color: #15803d;
}
.ip-paid-date {
  font-size: 13px;
  color: #166534;
  font-weight: 500;
}

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
.btn-primary:hover:not(:disabled) { background: #ea6c10; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
