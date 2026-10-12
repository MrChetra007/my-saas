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

        <!-- Step 1: Confirm plan + generate QR -->
        <div v-if="step === 'generate'" class="sg-body">
          <p class="sg-desc">{{ $t('subscriptionGate.generateDesc') }}</p>
          <div class="sg-summary">
            <div class="sg-summary-row">
              <span>{{ $t('subscriptionGate.yourPlan') }}</span>
              <span class="sg-badge">{{ planName }}</span>
            </div>
            <div class="sg-summary-row">
              <span>{{ $t('subscriptionGate.monthlyFee') }}</span>
              <span class="sg-badge" style="color:#1a1917">${{ planPrice }}/mo</span>
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

        <!-- Step 2: Show KHQR QR image + polling -->
        <div v-else-if="step === 'invoice'" class="sg-body">
          <div v-if="invoiceLoading" class="sg-invoice">
            <span class="sg-spinner" style="border-top-color:#f97316;border-color:rgba(249,115,22,0.25)" />
          </div>
          <div v-else-if="invoice" class="sg-invoice">
            <!-- KHQR.dev QR image (served from api.khqr.dev, no token needed) -->
            <div class="sg-khqr-wrap">
              <img
                v-if="qrImageUrl"
                :src="qrImageUrl"
                alt="KHQR"
                class="sg-khqr-img"
                @error="qrImageError = true"
              />
              <div v-else-if="qrImageError" class="sg-qr-fallback">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a8a49e" stroke-width="1.5"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/><circle cx="12" cy="12" r="10"/></svg>
                <span>QR unavailable</span>
              </div>
              <span v-else class="sg-spinner" style="border-top-color:#f97316;border-color:rgba(249,115,22,0.25)" />
            </div>

            <div class="sg-amount">${{ invoice.total_amount }}</div>
            <div class="sg-khqr-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4m0-4h.01"/></svg>
              {{ $t('subscriptionGate.scanAndPay') }}
            </div>

            <!-- Countdown timer (KHQR.dev QR expires in 10 min) -->
            <div v-if="countdown > 0" class="sg-countdown">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ $t('subscriptionGate.expiresIn') || 'Expires in' }} {{ countdownLabel }}
            </div>
            <div v-else-if="countdown === 0" class="sg-expired-hint">
              {{ $t('subscriptionGate.qrExpired') || 'QR expired' }}
              <button class="sg-link-btn" @click="regenerate">{{ $t('subscriptionGate.generateNew') || 'Generate new' }}</button>
            </div>

            <!-- Waiting for payment indicator -->
            <div v-if="polling" class="sg-polling">
              <span class="sg-spinner-sm" />
              {{ $t('subscriptionGate.waitingForPayment') || 'Waiting for payment confirmation…' }}
            </div>
          </div>

          <div v-if="errorMsg" class="sg-error">{{ errorMsg }}</div>

          <!-- Fallback: open KHQR.dev checkout page in new tab -->
          <a
            v-if="invoice?.khqrdev_checkout_url"
            :href="invoice.khqrdev_checkout_url"
            target="_blank"
            rel="noopener"
            class="sg-btn-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            {{ $t('subscriptionGate.openCheckout') || 'Open full checkout page' }}
          </a>
        </div>

        <!-- Step 3: Payment confirmed (webhook received) -->
        <div v-else-if="step === 'paid'" class="sg-body">
          <div class="sg-success-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="1.8" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 class="sg-success-title">{{ $t('subscriptionGate.paidTitle') || 'Payment confirmed!' }}</h3>
          <p class="sg-success-desc">{{ $t('subscriptionGate.paidDesc') || 'Your subscription has been renewed. Enjoy QRserve!' }}</p>
          <button class="sg-btn-primary" @click="closeModal">
            {{ $t('common.done') || 'Done' }}
          </button>
        </div>

        <!-- Step 4: Submitted proof (old manual flow, kept for backwards compat) -->
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

        <!-- Footer -->
        <div class="sg-footer">
          <p class="sg-footer-text">{{ $t('subscriptionGate.footer') }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { useBillingStatus } from '@/composables/useBillingStatus'

const authStore = useAuthStore()
const { t } = useI18n()
const { billingStatus, planName, planPrice } = useBillingStatus()

const visible = computed(() => billingStatus.value === 'blocked' && !dismissed.value)

const step = ref('generate')
const errorMsg = ref('')
const generating = ref(false)
const invoiceLoading = ref(false)
const invoice = ref(null)
const qrImageUrl = ref(null)
const qrImageError = ref(false)
const dismissed = ref(false)
const graceDate = ref('')

// KHQR.dev QR countdown: expires in 10 minutes (600 seconds)
const countdown = ref(-1) // -1 = not started, 0 = expired, >0 = seconds left
let countdownTimer = null

const countdownLabel = computed(() => {
  if (countdown.value <= 0) return ''
  const m = Math.floor(countdown.value / 60)
  const s = countdown.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

// Polling for payment confirmation
const polling = ref(false)
let pollTimer = null
const POLL_INTERVAL_MS = 4000 // poll every 4 seconds

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

function closeModal() {
  dismissed.value = true
  stopPolling()
  stopCountdown()
}

function startCountdown(seconds = 600) {
  countdown.value = seconds
  stopCountdown()
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 0
      stopCountdown()
      stopPolling()
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// Poll the invoice status via Supabase directly (no edge function needed for status reads)
async function startPolling(invoiceId) {
  polling.value = true
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('subscription_invoices')
        .select('status')
        .eq('id', invoiceId)
        .single()

      if (data?.status === 'paid') {
        stopPolling()
        stopCountdown()
        polling.value = false
        // Refresh restaurant data so billingStatus flips to 'active'
        if (authStore.refreshRestaurant) {
          await authStore.refreshRestaurant()
        }
        step.value = 'paid'
        // Dismiss after short delay so user sees the success screen
        setTimeout(() => { dismissed.value = true }, 4000)
      }
    } catch (err) {
      console.warn('Poll error:', err)
    }
  }, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  polling.value = false
}

async function callKhqrPayment(forceNew = false) {
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

  const res = await fetch(`${supabaseUrl}/functions/v1/khqr-payment`, {
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
      force_new: forceNew,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create payment')
  return data
}

async function generateInvoice(forceNew = false) {
  generating.value = true
  errorMsg.value = ''
  try {
    const result = await callKhqrPayment(forceNew)
    invoice.value = result.invoice
    qrImageUrl.value = result.qr_image_url || null
    qrImageError.value = false
    step.value = 'invoice'
    // Start 10-min countdown for the KHQR.dev QR
    startCountdown(600)
    // Start polling for payment confirmation
    if (invoice.value?.id) {
      startPolling(invoice.value.id)
    }
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    generating.value = false
  }
}

async function loadOpenInvoice() {
  invoiceLoading.value = true
  errorMsg.value = ''
  try {
    const result = await callKhqrPayment()
    invoice.value = result.invoice
    qrImageUrl.value = result.qr_image_url || null
    qrImageError.value = false
    step.value = 'invoice'
    startCountdown(600)
    if (invoice.value?.id) {
      startPolling(invoice.value.id)
    }
  } catch (err) {
    errorMsg.value = err.message
    step.value = 'generate'
  } finally {
    invoiceLoading.value = false
  }
}

async function regenerate() {
  // Force a fresh QR by going back to generate step (the old invoice will be expired by the edge fn)
  invoice.value = null
  qrImageUrl.value = null
  qrImageError.value = false
  countdown.value = -1
  step.value = 'generate'
  stopPolling()
  await generateInvoice(true)
}

watch(() => billingStatus.value, (val) => {
  if (val === 'active' || val === 'grace') {
    stopPolling()
    stopCountdown()
  }
  if (val === 'blocked') {
    dismissed.value = false
    // Check for existing open invoice
    supabase
      .from('subscription_invoices')
      .select('id, status')
      .eq('restaurant_id', authStore.profile?.restaurant_id)
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          loadOpenInvoice()
        } else {
          step.value = 'generate'
        }
      })
  }
})

onMounted(() => {
  if (visible.value) {
    supabase
      .from('subscription_invoices')
      .select('id, status')
      .eq('restaurant_id', authStore.profile?.restaurant_id)
      .in('status', ['pending', 'pending_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          loadOpenInvoice()
        }
      })
  }
})

onUnmounted(() => {
  stopPolling()
  stopCountdown()
})
</script>

<style scoped>
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
  text-decoration: none;
}
.sg-btn-primary:hover:not(:disabled) { background: #ea6c10; }
.sg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.sg-btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  background: transparent;
  border: 1.5px solid #e0ddd6;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #3d3d3a;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.sg-btn-secondary:hover { border-color: #f97316; color: #f97316; }
.sg-link-btn {
  background: none;
  border: none;
  color: #f97316;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.sg-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: sgSpin 0.6s linear infinite;
  flex-shrink: 0;
}
.sg-spinner-sm {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(249,115,22,0.25);
  border-top-color: #f97316;
  border-radius: 50%;
  animation: sgSpin 0.6s linear infinite;
  flex-shrink: 0;
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
  width: 280px;
  height: 280px;
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sg-khqr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}
.sg-qr-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #a8a49e;
  font-size: 12px;
}
.sg-amount {
  font-size: 24px;
  font-weight: 700;
  color: #1a1917;
  letter-spacing: -0.5px;
}
.sg-khqr-hint {
  font-size: 12px;
  color: #a8a49e;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sg-countdown {
  font-size: 11.5px;
  color: #f97316;
  display: flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}
.sg-expired-hint {
  font-size: 12px;
  color: #e11d48;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sg-polling {
  font-size: 12px;
  color: #6b6963;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: sgFade 1.5s ease-in-out infinite;
}
@keyframes sgFade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
