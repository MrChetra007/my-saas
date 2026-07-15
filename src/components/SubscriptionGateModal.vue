<template>
  <Teleport to="body">
    <div v-if="visible" class="sg-overlay">
      <div class="sg-modal">
        <!-- Header -->
        <div class="sg-header">
          <div class="sg-header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 class="sg-title">{{ $t('subscriptionGate.title') }}</h2>
          <p class="sg-sub">{{ $t('subscriptionGate.subtitle') }}</p>
        </div>

        <!-- Step 1: Generate invoice -->
        <div v-if="step === 'generate'" class="sg-body">
          <p class="sg-desc">{{ $t('subscriptionGate.generateDesc') }}</p>
          <div class="sg-summary">
            <div class="sg-summary-row">
              <span>{{ $t('subscriptionGate.yourPlan') }}</span>
              <span class="sg-badge">{{ planName }}</span>
            </div>
            <div class="sg-summary-row">
              <span>{{ $t('subscriptionGate.monthlyFee') }}</span>
              <span class="sg-badge" style="color:#1a1917">${{ planPrice }}</span>
            </div>
            <div class="sg-summary-row" v-if="errorMsg">
              <span class="sg-error" v-html="errorMsg" />
            </div>
          </div>
          <button class="sg-btn-primary" :disabled="generating" @click="generateInvoice">
            <span v-if="generating" class="sg-spinner" />
            {{ generating ? $t('subscriptionGate.generating') : $t('subscriptionGate.generateAndPay') }}
          </button>
        </div>

        <!-- Step 2: Show KHQR + upload proof -->
        <div v-else-if="step === 'invoice'" class="sg-body">
          <div v-if="invoiceLoading" class="sg-invoice">
            <span class="sg-spinner" style="border-top-color:#f97316;border-color:rgba(249,115,22,0.25)" />
          </div>
          <div v-else-if="invoice" class="sg-invoice">
            <template v-if="invoice.qr_image">
              <div class="sg-khqr-wrap">
                <img :src="invoice.qr_image" alt="KHQR" class="sg-khqr-img" />
              </div>
              <div class="sg-amount">${{ invoice.total_amount }}</div>
              <div class="sg-khqr-hint">{{ $t('subscriptionGate.scanAndPay') }}</div>
            </template>
            <template v-else>
              <div class="sg-no-khqr">
                <div class="sg-amount">${{ invoice.total_amount }}</div>
                <p class="sg-bank-info">{{ $t('subscriptionGate.bankTransfer') }}</p>
                <p class="sg-bank-detail">{{ $t('subscriptionGate.bankAccount') }}</p>
              </div>
            </template>
          </div>

          <div class="sg-upload">
  <label class="sg-upload-label">{{ $t('subscriptionGate.uploadProofLabel') }}</label>
  <label class="sg-upload-dropzone" :class="{ 'sg-has-file': selectedFile }">
    <input type="file" accept="image/*" class="sg-upload-input" @change="onFileChange" />
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <span v-if="!selectedFile" class="sg-upload-placeholder">{{ $t('subscriptionGate.chooseFile') || 'Choose a screenshot to upload' }}</span>
    <span v-else class="sg-file-name">{{ selectedFile.name }}</span>
  </label>
</div>

          <div v-if="errorMsg" class="sg-error">{{ errorMsg }}</div>

          <button class="sg-btn-primary" :disabled="submitting || !selectedFile" @click="submitProof">
            <span v-if="submitting" class="sg-spinner" />
            {{ submitting ? $t('subscriptionGate.submitting') : $t('subscriptionGate.submitProof') }}
          </button>
        </div>

        <!-- Step 3: Submitted / rejected -->
        <div v-else-if="step === 'submitted'" class="sg-body">
  <div class="sg-success-icon">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.8" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  </div>
  <h3 class="sg-success-title">{{ $t('subscriptionGate.submittedTitle') }}</h3>
  <p class="sg-success-desc">{{ $t('subscriptionGate.submittedDesc', { date: graceDate }) }}</p>
  <button class="sg-btn-primary" @click="closeModal">
    {{ $t('common.done') || 'Done' }}
  </button>
</div>
        <div v-else-if="step === 'rejected'" class="sg-body">
          <div class="sg-rejected-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h3 class="sg-rejected-title">{{ $t('subscriptionGate.rejectedTitle') }}</h3>
          <p v-if="rejectedReason" class="sg-rejected-reason">{{ $t('subscriptionGate.rejectedReason') }} "{{ rejectedReason }}"</p>
          <p class="sg-rejected-desc">{{ $t('subscriptionGate.rejectedDesc') }}</p>
          <button class="sg-btn-primary" @click="retry">
            {{ $t('subscriptionGate.retry') }}
          </button>
        </div>

        <!-- Footer -->
        <div class="sg-footer">
          <p class="sg-footer-text">{{ $t('subscriptionGate.footer') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useBillingStatus } from '@/composables/useBillingStatus'

const authStore = useAuthStore()
const { t } = useI18n()
const { billingStatus, planName, planPrice, graceEndsAt } = useBillingStatus()

const visible = computed(() => billingStatus.value === 'blocked' && !dismissed.value)


const step = ref('generate')
const errorMsg = ref('')
const generating = ref(false)
const submitting = ref(false)
const invoiceLoading = ref(false)
const selectedFile = ref(null)
const invoice = ref(null)
const rejectedReason = ref('')
const graceDate = ref('')
const dismissed = ref(false)


function closeModal() {
  dismissed.value = true
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Calls the edge function for the CURRENT open period, always returning a
// fresh qr_image. The edge function's own dedup logic decides whether to
// reuse an existing invoice row or create a new one, and always computes
// qr_image on the fly since that field is never stored in the DB.
async function fetchInvoiceViaFunction() {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  const rid = authStore.profile?.restaurant_id
  if (!rid) throw new Error('No restaurant ID')
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const periodStart = start.toISOString().split('T')[0]
  const periodEnd = end.toISOString().split('T')[0]
  const rawPlan = authStore._restaurant?.plan || 'starter'
  const planId = (rawPlan === 'expired' || rawPlan === 'trial') ? 'starter' : rawPlan

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-khqr-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      restaurant_id: rid,
      plan_id: planId,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load invoice')
  return data.invoice
}

async function generateInvoice() {
  generating.value = true
  errorMsg.value = ''
  try {
    invoice.value = await fetchInvoiceViaFunction()
    step.value = 'invoice'
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    generating.value = false
  }
}

// Loads an already-open invoice (pending / pending_review) for display,
// always going through the edge function so qr_image gets computed —
// never reads the subscription_invoices row directly for this purpose.
async function loadOpenInvoice() {
  invoiceLoading.value = true
  errorMsg.value = ''
  try {
    invoice.value = await fetchInvoiceViaFunction()
    step.value = invoice.value?.status === 'pending_review' ? 'submitted' : 'invoice'
  } catch (err) {
    errorMsg.value = err.message
    step.value = 'generate'
  } finally {
    invoiceLoading.value = false
  }
}

function onFileChange(e) {
  selectedFile.value = e.target.files[0] || null
}

async function submitProof() {
  if (!selectedFile.value || !invoice.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const rid = authStore.profile?.restaurant_id
    const ext = selectedFile.value.name.split('.').pop()
    const filePath = `${rid}/${invoice.value.id}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, selectedFile.value, {
        cacheControl: '3600',
        upsert: true,
      })
    if (uploadError) throw uploadError

    const proofUrl = filePath

    const res = await fetch(`${supabaseUrl}/functions/v1/submit-payment-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoice_id: invoice.value.id,
        proof_url: proofUrl,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to submit proof')

    if (authStore.refreshRestaurant) {
      await authStore.refreshRestaurant()
    }

    graceDate.value = data.grace_period_ends_at
      ? new Date(data.grace_period_ends_at).toLocaleDateString()
      : ''
    step.value = 'submitted'
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    submitting.value = false
  }
}

function retry() {
  step.value = 'invoice'
  selectedFile.value = null
  errorMsg.value = ''
}

// Watch for rejected invoice updates
watch(() => billingStatus.value, (val) => {
  if (val === 'blocked') {
    const r = authStore._restaurant
    if (r?.plan === 'expired' || (r?.plan_expires_at && new Date(r.plan_expires_at) < new Date())) {
      // Rejected-invoice lookup is read-only display info (reason text),
      // no QR involved, so a direct table read is fine here.
      supabase
        .from('subscription_invoices')
        .select('*')
        .eq('restaurant_id', authStore.profile?.restaurant_id)
        .eq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            rejectedReason.value = data[0].rejected_reason || ''
            step.value = 'rejected'
          } else {
            supabase
              .from('subscription_invoices')
              .select('id, status')
              .eq('restaurant_id', authStore.profile?.restaurant_id)
              .in('status', ['pending', 'pending_review'])
              .order('created_at', { ascending: false })
              .limit(1)
              .then(({ data: openInv }) => {
                if (openInv && openInv.length > 0) {
                  loadOpenInvoice()
                } else {
                  step.value = 'generate'
                }
              })
          }
        })
    }
  }
})

onMounted(() => {
  if (visible.value) {
    // Only check id/status here — never read khqr_string/qr fields
    // directly, since qr_image is computed by the edge function and is
    // never persisted to the DB.
    supabase
      .from('subscription_invoices')
      .select('id, status, rejected_reason')
      .eq('restaurant_id', authStore.profile?.restaurant_id)
      .in('status', ['pending', 'pending_review', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const inv = data[0]
          if (inv.status === 'rejected') {
            rejectedReason.value = inv.rejected_reason || ''
            step.value = 'rejected'
          } else {
            loadOpenInvoice()
          }
        }
      })
  }
})
</script>

<style scoped>
.sg-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sg-upload-label {
  font-size: 12px;
  font-weight: 600;
  color: #3d3d3a;
}
.sg-upload-dropzone {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1.5px dashed #e0ddd6;
  border-radius: 10px;
  background: #fafaf9;
  color: #a8a49e;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.sg-upload-dropzone:hover {
  border-color: #f97316;
  background: #fff8f2;
  color: #f97316;
}
.sg-upload-dropzone.sg-has-file {
  border-style: solid;
  border-color: #f97316;
  background: #fff8f2;
  color: #1a1917;
}
.sg-upload-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.sg-upload-placeholder {
  font-size: 13px;
}
.sg-file-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1917;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.sg-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: sgIn 0.25s ease;
}
@keyframes sgIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.sg-header {
  text-align: center;
  padding: 28px 24px 16px;
}
.sg-header-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: #fff1f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e11d48;
}
.sg-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1917;
  margin: 0 0 4px;
}
.sg-sub {
  font-size: 13px;
  color: #6b6963;
  margin: 0;
  line-height: 1.5;
}
.sg-body {
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sg-desc {
  font-size: 13px;
  color: #6b6963;
  margin: 0;
  line-height: 1.5;
}
.sg-summary {
  background: #fafaf9;
  border: 1px solid #f0ede8;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sg-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #3d3d3a;
}
.sg-badge {
  font-weight: 600;
  text-transform: capitalize;
  color: #f97316;
}
.sg-btn-primary {
  height: 44px;
  padding: 0 20px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}
.sg-btn-primary:hover:not(:disabled) { background: #ea6c10; }
.sg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.sg-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: sgSpin 0.6s linear infinite;
}
@keyframes sgSpin { to { transform: rotate(360deg); } }
.sg-error {
  font-size: 12.5px;
  color: #e11d48;
  background: #fff1f2;
  padding: 8px 10px;
  border-radius: 8px;
}
.sg-invoice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #fafaf9;
  border: 1px solid #f0ede8;
  border-radius: 12px;
}
.sg-khqr-wrap {
  width: 140px;
  height: 140px;
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sg-khqr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.sg-amount {
  font-size: 22px;
  font-weight: 700;
  color: #1a1917;
}
.sg-khqr-hint {
  font-size: 12px;
  color: #a8a49e;
  text-align: center;
}
.sg-no-khqr {
  text-align: center;
}
.sg-bank-info {
  font-size: 13px;
  color: #6b6963;
  margin: 8px 0 0;
  line-height: 1.5;
}
.sg-bank-detail {
  font-size: 14px;
  font-weight: 600;
  color: #1a1917;
  margin: 4px 0 0;
}
.sg-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sg-upload-label {
  font-size: 12px;
  font-weight: 600;
  color: #3d3d3a;
}
.sg-upload-input {
  font-size: 13px;
  font-family: inherit;
  padding: 8px 0;
}
.sg-file-name {
  font-size: 12px;
  color: #6b6963;
}
.sg-success-icon,
.sg-rejected-icon {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.sg-success-title {
  font-size: 16px;
  font-weight: 700;
  color: #15803d;
  text-align: center;
  margin: 0;
}
.sg-success-desc {
  font-size: 13px;
  color: #6b6963;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}
.sg-rejected-title {
  font-size: 16px;
  font-weight: 700;
  color: #e11d48;
  text-align: center;
  margin: 0;
}
.sg-rejected-reason {
  font-size: 13px;
  color: #e11d48;
  text-align: center;
  margin: 0;
  font-style: italic;
}
.sg-rejected-desc {
  font-size: 13px;
  color: #6b6963;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}
.sg-footer {
  text-align: center;
  padding: 12px 24px 20px;
}
.sg-footer-text {
  font-size: 11px;
  color: #a8a49e;
  margin: 0;
  line-height: 1.4;
}
</style>
