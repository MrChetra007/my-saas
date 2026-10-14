<template>
  <div class="wall-shell">
    <div class="ambient-glow" aria-hidden="true" />
    <div class="noise" aria-hidden="true" />
    <div class="wall-grid" aria-hidden="true" />

    <div class="wall-content">
      <!-- Logo -->
      <div class="wall-logo">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="5" y="5" width="4" height="4" rx="0.5" fill="white" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="23" y="5" width="4" height="4" rx="0.5" fill="white" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="white" stroke-width="2" />
            <rect x="5" y="23" width="4" height="4" rx="0.5" fill="white" />
            <line
              x1="22"
              y1="21"
              x2="22"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="26"
              y1="21"
              x2="26"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="30"
              y1="21"
              x2="30"
              y2="30"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M22 21 Q22 25 26 27 Q30 25 30 21"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <span class="logo-wordmark">{{ $t('trialWall.logo') }}</span>
      </div>

      <!-- Main card -->
      <div class="wall-card">
        <div class="card-accent-line" />

        <!-- Expired icon -->
        <div class="expired-badge">
          <TimerOff :size="28" />
        </div>

        <h1 class="wall-title">{{ $t('trialWall.title') }}</h1>
        <p class="wall-subtitle">{{ $t('trialWall.subtitle') }}</p>

        <!-- Account pill -->
        <div class="account-pill" v-if="restaurantName">
          <Store :size="13" />
          <span class="pill-label">{{ $t('trialWall.accountLabel') }}</span>
          <span class="pill-sep">·</span>
          <span class="pill-value">{{ restaurantName }}</span>
        </div>

        <!-- Plans -->
        <div class="plans-grid">
          <!-- Starter -->
          <div class="plan-card">
            <div class="plan-top">
              <div class="plan-name">{{ $t('trialWall.starterName') }}</div>
              <div class="plan-price">
                <span class="price-dollar">$</span>
                <span class="price-amount">{{ prices.starter }}</span>
                <span class="price-mo">/mo</span>
              </div>
              <p class="plan-tagline">{{ $t('trialWall.starterTagline') }}</p>
            </div>

            <ul class="plan-features">
              <li v-for="f in starterFeatures" :key="f">
                <Check :size="13" class="check-icon" />{{ f }}
              </li>
            </ul>

            <button class="plan-btn plan-btn-secondary" @click="selectPlan('starter')">
              {{ $t('trialWall.starterCta') }}
            </button>
          </div>

          <!-- Pro -->
          <div class="plan-card plan-card-pro">
            <div class="pro-badge"><Star :size="10" /> {{ $t('trialWall.proBadge') }}</div>

            <div class="plan-top">
              <div class="plan-name plan-name-pro">{{ $t('trialWall.proName') }}</div>
              <div class="plan-price plan-price-pro">
                <span class="price-dollar">$</span>
                <span class="price-amount">{{ prices.pro }}</span>
                <span class="price-mo">/mo</span>
              </div>
              <p class="plan-tagline">{{ $t('trialWall.proTagline') }}</p>
            </div>

            <ul class="plan-features">
              <li v-for="f in proFeatures" :key="f">
                <Check :size="13" class="check-icon check-icon-pro" />{{ f }}
              </li>
            </ul>

            <button class="plan-btn plan-btn-primary" @click="selectPlan('pro')">
              {{ $t('trialWall.proCta') }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div class="wall-error" v-if="error" role="alert">
          <AlertCircle :size="14" />
          {{ error }}
        </div>

        <!-- Footer -->
        <div class="wall-footer">
          <button class="footer-link" @click="goToSettings">
            <Settings :size="13" /> {{ $t('trialWall.manageSubscription') }}
          </button>
          <span class="footer-divider" aria-hidden="true" />
          <button class="footer-link footer-link-danger" @click="signOut">
            <LogOut :size="13" /> {{ $t('trialWall.signOut') }}
          </button>
        </div>

        <SupportContact />
      </div>

      <p class="secure-note"><Lock :size="11" /> Bakong KHQR Secure Payment</p>
    </div>

    <!-- ── KHQR Payment Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showKhqrModal" class="tw-modal-backdrop">
          <div class="tw-modal">
            <button class="tw-modal-close" @click="closeKhqrModal">
              <X :size="20" />
            </button>

            <!-- Loading State -->
            <div v-if="generating" class="tw-modal-body tw-center">
              <span class="tw-spinner large" />
              <p class="tw-loading-text">Generating Bakong KHQR…</p>
            </div>

            <!-- Error State -->
            <div v-else-if="khqrError" class="tw-modal-body tw-center">
              <div class="tw-error-icon"><AlertCircle :size="36" /></div>
              <h3 class="tw-modal-title">Unable to generate QR</h3>
              <p class="tw-modal-desc">{{ khqrError }}</p>
              <button
                class="plan-btn plan-btn-primary"
                style="margin-top: 16px"
                @click="selectPlan(selectedPlanId, true)"
              >
                Try Again
              </button>
            </div>

            <!-- Paid Success State -->
            <div v-else-if="isPaid" class="tw-modal-body tw-center">
              <div class="tw-success-icon"><Check :size="40" /></div>
              <h3 class="tw-modal-title">Payment Confirmed!</h3>
              <p class="tw-modal-desc">
                Your subscription is now active. Redirecting to dashboard…
              </p>
              <button
                class="plan-btn plan-btn-primary"
                style="margin-top: 16px"
                @click="router.push('/app/dashboard')"
              >
                Go to Dashboard
              </button>
            </div>

            <!-- QR Display State -->
            <div v-else class="tw-modal-body">
              <div class="tw-modal-header">
                <div class="tw-plan-badge">{{ selectedPlanName }} Plan</div>
                <div class="tw-price-tag">
                  <span class="tw-dollar">$</span>{{ selectedPlanPrice
                  }}<span class="tw-mo">/mo</span>
                </div>
              </div>

              <div class="tw-qr-frame">
                <img
                  v-if="qrImageUrl"
                  :src="qrImageUrl"
                  alt="Bakong KHQR"
                  class="tw-qr-image"
                  @error="qrImageError = true"
                />
                <div v-else-if="qrImageError" class="tw-qr-fallback">
                  <AlertCircle :size="24" />
                  <span>QR unavailable</span>
                </div>
                <div v-else class="tw-spinner" />
              </div>

              <p class="tw-scan-hint">Scan with any Bakong-supported banking app (ABA, ACLEDA…)</p>

              <!-- Countdown -->
              <div v-if="countdown > 0" class="tw-countdown-pill">
                <TimerOff :size="12" />
                <span>Expires in {{ countdownLabel }}</span>
              </div>
              <div v-else class="tw-expired-row">
                <span>QR expired</span>
                <button class="tw-retry-link" @click="selectPlan(selectedPlanId, true)">
                  Generate new QR
                </button>
              </div>

              <!-- Polling indicator -->
              <div v-if="polling" class="tw-polling-indicator">
                <span class="tw-spinner-sm" />
                <span>Waiting for payment confirmation…</span>
              </div>

              <!-- Secondary Link -->
              <a
                v-if="checkoutUrl"
                :href="checkoutUrl"
                target="_blank"
                rel="noopener"
                class="tw-checkout-link"
              >
                Open checkout page
              </a>

              <button class="tw-btn-back" @click="closeKhqrModal">Back</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import SupportContact from '@/components/SupportContact.vue'

import {
  TimerOff,
  Store,
  Check,
  Star,
  AlertCircle,
  Settings,
  LogOut,
  Lock,
  X,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const restaurantName = ref('')
const error = ref('')
const prices = ref({ starter: 15, pro: 25 })

// Modal state
const showKhqrModal = ref(false)
const selectedPlanId = ref('starter')
const selectedPlanPrice = computed(() => prices.value[selectedPlanId.value] || 15)
const selectedPlanName = computed(() => (selectedPlanId.value === 'pro' ? 'Pro' : 'Starter'))

const qrImageUrl = ref('')
const qrImageError = ref(false)
const checkoutUrl = ref('')
const generating = ref(false)
const khqrError = ref('')
const isPaid = ref(false)

const countdown = ref(-1)
let countdownTimer = null
const polling = ref(false)
let pollTimer = null

const countdownLabel = computed(() => {
  if (countdown.value <= 0) return '0:00'
  const m = Math.floor(countdown.value / 60)
  const s = countdown.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const starterFeatures = [
  t('trialWall.feature.upTo15Tables'),
  t('trialWall.feature.upTo3Staff'),
  t('trialWall.feature.unlimitedOrders'),
  t('trialWall.feature.qrOrdering'),
  t('trialWall.feature.allStaffViews'),
  t('trialWall.feature.menuManagement'),
]

const proFeatures = [
  t('trialWall.feature.unlimitedTables'),
  t('trialWall.feature.upTo10Staff'),
  t('trialWall.feature.unlimitedOrders'),
  t('trialWall.feature.qrOrdering'),
  t('trialWall.feature.allStaffViews'),
  t('trialWall.feature.menuManagement'),
  t('trialWall.feature.analytics'),
  t('trialWall.feature.promotions'),
]

onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  if (authStore.profile?.restaurant_id) {
    const { data } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', authStore.profile.restaurant_id)
      .single()
    restaurantName.value = data?.name || ''
  }

  // Single source of truth: platform_settings.app_config override first, then public.plans
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('app_config')
      .eq('id', true)
      .maybeSingle()

    const cfg = settings?.app_config || {}
    const hasStarter =
      cfg.starter_price_manual !== undefined &&
      cfg.starter_price_manual !== null &&
      cfg.starter_price_manual !== ''
    const hasPro =
      cfg.pro_price_manual !== undefined &&
      cfg.pro_price_manual !== null &&
      cfg.pro_price_manual !== ''

    if (hasStarter) prices.value.starter = Number(cfg.starter_price_manual)
    if (hasPro) prices.value.pro = Number(cfg.pro_price_manual)

    if (!hasStarter || !hasPro) {
      const { data: plans } = await supabase.from('plans').select('id, monthly_fee')
      if (plans) {
        plans.forEach((p) => {
          if (p.id === 'starter' && !hasStarter && p.monthly_fee)
            prices.value.starter = Number(p.monthly_fee)
          if (p.id === 'pro' && !hasPro && p.monthly_fee) prices.value.pro = Number(p.monthly_fee)
        })
      }
    }
  } catch (e) {
    console.warn('Failed to load plans pricing', e)
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
        isPaid.value = true
        if (authStore.refreshRestaurant) {
          await authStore.refreshRestaurant()
        }
        setTimeout(() => {
          router.push('/app/dashboard')
        }, 2500)
      }
    } catch (err) {
      console.warn('Poll error:', err)
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

async function selectPlan(planId, forceNew = false) {
  selectedPlanId.value = planId
  showKhqrModal.value = true
  generating.value = true
  khqrError.value = ''
  isPaid.value = false

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
        plan_id: planId,
        period_start: periodStart,
        period_end: periodEnd,
        force_new: forceNew,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.error?.includes('token not configured')) {
        throw new Error('KHQR payment is being configured. Please contact platform admin.')
      }
      throw new Error(data.error || 'Failed to generate KHQR invoice')
    }

    qrImageUrl.value = data.qr_image_url || ''
    checkoutUrl.value = data.checkout_url || ''
    qrImageError.value = false

    const seconds = data.remaining_seconds != null ? data.remaining_seconds : 600
    startCountdown(seconds)

    const invoiceId = data.invoice?.id || data.invoice_id
    if (invoiceId) {
      startPolling(invoiceId)
    }
  } catch (err) {
    khqrError.value = err.message || 'Error generating KHQR'
  } finally {
    generating.value = false
  }
}

function closeKhqrModal() {
  stopCountdown()
  stopPolling()
  showKhqrModal.value = false
  khqrError.value = ''
  isPaid.value = false
}

function goToSettings() {
  router.push('/app/settings')
}

async function signOut() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Shell ── */
.wall-shell {
  min-height: 100vh;
  background: var(--color-bg-base);
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* ── Background ── */
.ambient-glow {
  position: fixed;
  top: -5%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(ellipse at center, var(--color-accent-muted) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
  filter: blur(10px);
}
.noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
.wall-grid {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, var(--color-border-subtle) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%);
}

/* ── Layout ── */
.wall-content {
  position: relative;
  z-index: 1;
  max-width: 740px;
  margin: 0 auto;
  padding: 44px 24px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

/* ── Logo ── */
.wall-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fade-down 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-accent);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
  flex-shrink: 0;
}
.logo-wordmark {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
}

/* ── Wall Card ── */
.wall-card {
  width: 100%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 40px 36px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow:
    0 0 0 1px var(--color-border-subtle),
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 60px -20px var(--color-accent-muted);
  animation: card-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.06s;
}

.expired-badge {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f87171;
}

.wall-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  text-align: center;
  margin-top: -8px;
}
.wall-subtitle {
  font-size: 15px;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 440px;
  line-height: 1.5;
  margin-top: -16px;
}

/* ── Account pill ── */
.account-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.pill-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

/* ── Plans grid ── */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
}

.plan-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.plan-card-pro {
  border-color: var(--color-accent);
  position: relative;
  background: linear-gradient(180deg, var(--color-bg-elevated) 0%, rgba(200, 115, 58, 0.05) 100%);
}

.pro-badge {
  position: absolute;
  top: -11px;
  right: 18px;
  background: var(--color-accent);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.plan-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}
.plan-price {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.price-dollar {
  font-size: 16px;
  font-weight: 600;
}
.price-mo {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.plan-tagline {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 auto;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.check-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.plan-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s;
  border: none;
}
.plan-btn-primary {
  background: var(--color-accent);
  color: white;
}
.plan-btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.plan-btn-secondary {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
}
.plan-btn-secondary:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-1px);
}

.wall-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 4px;
}
.footer-divider {
  width: 1px;
  height: 14px;
  background: var(--color-border-subtle);
  display: block;
}
.footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 13px;
  font-family: var(--font-body);
  color: var(--color-text-faint);
  cursor: pointer;
  padding: 0;
  transition: color 0.14s;
}
.footer-link:hover {
  color: var(--color-text-secondary);
}
.footer-link-danger:hover {
  color: #f87171;
}

/* ── Modal (KHQR Payment) ── */
.tw-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.tw-modal {
  position: relative;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  padding: 28px 24px 24px;
  animation: card-in 0.25s ease both;
}

.tw-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.14s;
}
.tw-modal-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-base);
}

.tw-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.tw-center {
  padding: 30px 10px;
}

.tw-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.tw-plan-badge {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent);
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  padding: 4px 12px;
  border-radius: 20px;
}

.tw-price-tag {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
}
.tw-dollar {
  font-size: 14px;
  font-weight: 600;
}
.tw-mo {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.tw-qr-frame {
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

.tw-qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tw-scan-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  line-height: 1.4;
}

.tw-countdown-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  font-size: 12px;
  color: var(--color-accent);
  margin-bottom: 12px;
}

.tw-expired-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #f87171;
  margin-bottom: 12px;
}
.tw-retry-link {
  background: none;
  border: none;
  color: var(--color-accent);
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
}

.tw-polling-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 14px;
}

.tw-checkout-link {
  font-size: 13px;
  color: var(--color-accent);
  text-decoration: underline;
  margin-bottom: 14px;
  display: block;
}

.tw-btn-back {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: 12px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s;
}
.tw-btn-back:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.tw-error-icon {
  color: #f87171;
  margin-bottom: 12px;
}
.tw-success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.tw-modal-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
.tw-modal-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Spinner */
.tw-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(200, 115, 58, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.tw-spinner.large {
  width: 36px;
  height: 36px;
  margin-bottom: 14px;
}
.tw-spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(200, 115, 58, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ── */
@media (max-width: 560px) {
  .wall-card {
    padding: 32px 20px 28px;
  }
  .plans-grid {
    grid-template-columns: 1fr;
  }
  .wall-title {
    font-size: 24px;
  }
  .wall-content {
    padding: 28px 16px 56px;
  }
  .wall-subtitle {
    font-size: 14px;
  }
}
</style>
