<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-pro-picker">
          <!-- ── Header ── -->
          <div class="picker-header">
            <div class="header-glow" />
            <button class="picker-close" @click="close">
              <X :size="20" />
            </button>
            <div class="header-icon">
              <Crown :size="24" />
            </div>
            <h2 class="picker-title">{{ $t('settings.upgradeToPro') }}</h2>
            <p class="picker-subtitle">
              <i18n-t keypath="plans.proFeatureDesc" tag="span">
                <template #feature
                  ><strong>{{ featureName }}</strong></template
                >
              </i18n-t>
            </p>
          </div>

          <!-- ── Body: Step 1: Feature Overview + Initiate KHQR ── -->
          <div v-if="step === 'plan'" class="picker-body">
            <ul class="feature-list">
              <li v-for="f in proFeatures" :key="f.label" class="feature-item">
                <div class="feature-icon-wrap">
                  <component :is="f.icon" :size="16" />
                </div>
                <div class="feature-text">
                  <div class="feature-label">{{ f.label }}</div>
                  <div class="feature-desc">{{ f.desc }}</div>
                </div>
              </li>
            </ul>

            <!-- Price -->
            <div class="price-row">
              <div class="price-amount">
                <span class="price-dollar">$</span>{{ proPrice }}<span class="price-mo">/mo</span>
              </div>
              <div class="price-note">{{ $t('plans.cancelAnytime') }}</div>
            </div>

            <!-- Error message if any -->
            <div v-if="errorMsg" class="alert-error">
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Upgrade with KHQR button -->
            <button class="btn-upgrade" :disabled="generating" @click="generateProKhqr">
              <span v-if="generating" class="spin-icon" />
              <Crown v-else :size="18" />
              <span>{{
                generating ? 'Generating KHQR…' : `Upgrade with KHQR ($${proPrice}/mo)`
              }}</span>
            </button>

            <!-- KHQR billing info fallback -->
            <div class="khqr-upgrade-info">
              <div class="khqr-upgrade-icon"><Crown :size="18" /></div>
              <div class="khqr-upgrade-text">
                <div class="khqr-upgrade-title">Fast & Secure Bakong Payment</div>
                <div class="khqr-upgrade-desc">
                  Scan instantly with ABA, ACLEDA, Sathapana or any Bakong banking app.
                </div>
              </div>
            </div>

            <SupportContact compact />

            <button class="btn-cancel" @click="close">{{ $t('plans.maybeLater') }}</button>
          </div>

          <!-- ── Body: Step 2: Show KHQR Code + Polling ── -->
          <div v-else-if="step === 'invoice'" class="picker-body">
            <div class="invoice-section">
              <div class="qr-container">
                <img
                  v-if="qrImageUrl"
                  :src="qrImageUrl"
                  alt="KHQR"
                  class="qr-image"
                  @error="qrImageError = true"
                />
                <div v-else-if="qrImageError" class="qr-error-box">
                  <span>QR code unavailable</span>
                </div>
                <span v-else class="spin-icon large" />
              </div>

              <div class="invoice-amount">${{ proPrice }}</div>
              <p class="invoice-hint">Scan with any Bakong-supported banking app</p>

              <!-- Countdown timer (KHQR.dev 10 min expiry) -->
              <div v-if="countdown > 0" class="countdown-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Expires in {{ countdownLabel }}</span>
              </div>
              <div v-else class="countdown-expired">
                <span>QR expired</span>
                <button class="link-btn" @click="generateProKhqr(true)">Generate new QR</button>
              </div>

              <!-- Polling status -->
              <div v-if="polling" class="polling-row">
                <span class="spin-icon sm" />
                <span>Waiting for payment confirmation…</span>
              </div>

              <!-- Secondary checkout link -->
              <a
                v-if="checkoutUrl"
                :href="checkoutUrl"
                target="_blank"
                rel="noopener"
                class="btn-secondary-link"
              >
                Open checkout page
              </a>

              <button class="btn-cancel" @click="step = 'plan'">Back</button>
            </div>
          </div>

          <!-- ── Body: Step 3: Success Confirmation ── -->
          <div v-else-if="step === 'paid'" class="picker-body">
            <div class="success-section">
              <div class="success-icon-wrap">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 class="success-title">Payment Confirmed!</h3>
              <p class="success-desc">
                Your restaurant has been successfully upgraded to the Pro plan.
              </p>
              <button class="btn-upgrade" @click="close">Awesome</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { X, Crown, Activity, Tag, Users, BarChart2, Infinity } from 'lucide-vue-next'
import SupportContact from '@/components/SupportContact.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  featureName: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const proPrice = ref(25)
const step = ref('plan') // 'plan' | 'invoice' | 'paid'
const generating = ref(false)
const errorMsg = ref('')

const qrImageUrl = ref('')
const qrImageError = ref(false)
const checkoutUrl = ref('')
const countdown = ref(-1)
let countdownTimer = null

const polling = ref(false)
let pollTimer = null

const proFeatures = [
  {
    icon: Infinity,
    label: t('trialWall.feature.unlimitedTables'),
    desc: t('plans.featureUnlimitedTablesDesc'),
  },
  {
    icon: Users,
    label: t('trialWall.feature.upTo10Staff'),
    desc: t('plans.featureUpTo10StaffDesc'),
  },
  {
    icon: BarChart2,
    label: t('trialWall.feature.allStaffViews'),
    desc: t('plans.featureAllStaffViewsDesc'),
  },
  {
    icon: Activity,
    label: t('trialWall.feature.analytics'),
    desc: t('plans.featureAnalyticsDesc'),
  },
  {
    icon: Tag,
    label: t('trialWall.feature.promotions'),
    desc: t('plans.featurePromotionsDesc'),
  },
]

const countdownLabel = computed(() => {
  if (countdown.value <= 0) return '0:00'
  const m = Math.floor(countdown.value / 60)
  const s = countdown.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

onMounted(async () => {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('app_config')
      .eq('id', true)
      .maybeSingle()
    const override = settings?.app_config?.pro_price_manual
    if (override !== undefined && override !== null && override !== '') {
      proPrice.value = Number(override)
      return
    }
    const { data: plan } = await supabase
      .from('plans')
      .select('monthly_fee')
      .eq('id', 'pro')
      .maybeSingle()
    if (plan?.monthly_fee) proPrice.value = plan.monthly_fee
  } catch (e) {
    console.warn('Failed to load Pro pricing', e)
  }
})

onUnmounted(() => {
  stopCountdown()
  stopPolling()
})

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

function startPolling(invoiceId) {
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
        if (authStore.refreshRestaurant) {
          await authStore.refreshRestaurant()
        }
        step.value = 'paid'
      }
    } catch (err) {
      console.warn('Pro polling error:', err)
    }
  }, 4000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  polling.value = false
}

async function generateProKhqr(forceNew = false) {
  generating.value = true
  errorMsg.value = ''

  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const rid = authStore.profile?.restaurant_id
    if (!rid) throw new Error('No restaurant found for current user')

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const periodStart = start.toISOString().split('T')[0]
    const periodEnd = end.toISOString().split('T')[0]

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const res = await fetch(`${supabaseUrl}/functions/v1/khqr-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        restaurant_id: rid,
        plan_id: 'pro',
        period_start: periodStart,
        period_end: periodEnd,
        force_new: forceNew,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.error?.includes('token not configured')) {
        throw new Error('KHQR payments are being set up. Please contact platform admin to upgrade.')
      }
      throw new Error(data.error || 'Failed to generate KHQR invoice')
    }

    // Unify display amount with server invoice amount (single source of truth)
    if (data.invoice?.total_amount != null) {
      proPrice.value = Number(data.invoice.total_amount)
    } else if (data.amount != null) {
      proPrice.value = Number(data.amount)
    }

    qrImageUrl.value = data.qr_image_url || ''
    checkoutUrl.value = data.checkout_url || ''
    qrImageError.value = false
    step.value = 'invoice'

    const seconds = data.remaining_seconds != null ? data.remaining_seconds : 600
    startCountdown(seconds)

    const invId = data.invoice?.id || data.invoice_id
    if (invId) {
      startPolling(invId)
    }
  } catch (err) {
    errorMsg.value = err.message || 'Unable to generate KHQR code. Please contact admin.'
  } finally {
    generating.value = false
  }
}

function close() {
  stopCountdown()
  stopPolling()
  step.value = 'plan'
  errorMsg.value = ''
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* ── Spinner ── */
.spin-icon {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.spin-icon.sm {
  width: 14px;
  height: 14px;
  border-color: rgba(200, 115, 58, 0.25);
  border-top-color: var(--color-accent);
}

.spin-icon.large {
  width: 32px;
  height: 32px;
  border-color: rgba(200, 115, 58, 0.25);
  border-top-color: var(--color-accent);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 12px;
}

/* ── Modal ── */
.modal-pro-picker {
  background: var(--color-bg-surface);
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 24px);
  border: 1px solid var(--color-border-subtle);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.picker-header {
  position: relative;
  padding: 28px 20px 20px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
  flex-shrink: 0;
}

.header-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(200, 115, 58, 0.18) 0%, transparent 70%);
  pointer-events: none;
}

.picker-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.14s;
  z-index: 1;
}

.picker-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
  position: relative;
  z-index: 1;
}

.picker-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 6px;
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

.picker-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  position: relative;
  z-index: 1;
}

.picker-subtitle strong {
  color: var(--color-accent);
}

/* ── Body (scrollable) ── */
.picker-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* ── Feature list ── */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text {
  flex: 1;
  min-width: 0;
}

.feature-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  line-height: 1.3;
}

.feature-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* ── Price ── */
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  margin-bottom: 16px;
}

.price-amount {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  color: var(--color-accent);
  letter-spacing: -1px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  gap: 1px;
}

.price-dollar {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}

.price-mo {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  margin-bottom: 4px;
}

.price-note {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;
  text-align: right;
}

/* ── KHQR Upgrade Box ── */
.khqr-upgrade-info {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  text-align: left;
}

.khqr-upgrade-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.khqr-upgrade-text {
  flex: 1;
}

.khqr-upgrade-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.khqr-upgrade-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* ── Error ── */
.alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* ── Buttons ── */
.btn-upgrade {
  width: 100%;
  padding: 14px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.btn-upgrade:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-upgrade:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: 14px;
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.14s;
}

.btn-cancel:hover {
  border-color: var(--color-accent-border);
  color: var(--color-text-secondary);
}

/* ── Invoice Section ── */
.invoice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0;
}

.qr-container {
  width: 280px;
  height: 280px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border-subtle);
  margin-bottom: 14px;
  padding: 10px;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-error-box {
  font-size: 12px;
  color: var(--color-text-muted);
}

.invoice-amount {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.invoice-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 12px;
}

.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 12px;
}

.countdown-expired {
  font-size: 12px;
  color: #f87171;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

.polling-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.btn-secondary-link {
  display: block;
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: underline;
  margin-bottom: 14px;
}

/* ── Success Section ── */
.success-section {
  text-align: center;
  padding: 20px 10px;
}

.success-icon-wrap {
  margin-bottom: 16px;
}

.success-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
}

/* ── Transition ── */
.modal-enter-active {
  transition: opacity 0.2s;
}
.modal-leave-active {
  transition: opacity 0.18s;
}
.modal-enter-active .modal-pro-picker {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s;
}
.modal-leave-active .modal-pro-picker {
  transition:
    transform 0.18s ease-in,
    opacity 0.18s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-pro-picker {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}
.modal-leave-to .modal-pro-picker {
  transform: scale(0.97);
  opacity: 0;
}
</style>
