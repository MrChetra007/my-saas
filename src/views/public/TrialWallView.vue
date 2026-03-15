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
        <span class="logo-wordmark">Qrder</span>
      </div>

      <!-- Main card -->
      <div class="wall-card">
        <div class="card-accent-line" />

        <!-- Expired icon -->
        <div class="expired-badge">
          <TimerOff :size="28" />
        </div>

        <h1 class="wall-title">Your trial has ended</h1>
        <p class="wall-subtitle">
          Your 14-day free trial is over. Choose a plan to keep your restaurant running — orders,
          kitchen, staff, and everything in between.
        </p>

        <!-- Account pill -->
        <div class="account-pill" v-if="restaurantName">
          <Store :size="13" />
          <span class="pill-label">Account</span>
          <span class="pill-sep">·</span>
          <span class="pill-value">{{ restaurantName }}</span>
        </div>

        <!-- Plans -->
        <div class="plans-grid">
          <!-- Starter -->
          <div class="plan-card">
            <div class="plan-top">
              <div class="plan-name">Starter</div>
              <div class="plan-price">
                <span class="price-dollar">$</span>
                <span class="price-amount">49</span>
                <span class="price-mo">/mo</span>
              </div>
              <p class="plan-tagline">Perfect for small restaurants getting started.</p>
            </div>

            <ul class="plan-features">
              <li v-for="f in starterFeatures" :key="f">
                <Check :size="13" class="check-icon" />{{ f }}
              </li>
            </ul>

            <button
              class="plan-btn plan-btn-secondary"
              @click="checkout('starter')"
              :disabled="!!loading"
            >
              <Loader2 v-if="loading === 'starter'" :size="15" class="spin" />
              <span v-else>Get Starter</span>
            </button>
          </div>

          <!-- Pro -->
          <div class="plan-card plan-card-pro">
            <div class="pro-badge"><Star :size="10" /> Recommended</div>

            <div class="plan-top">
              <div class="plan-name plan-name-pro">Pro</div>
              <div class="plan-price plan-price-pro">
                <span class="price-dollar">$</span>
                <span class="price-amount">99</span>
                <span class="price-mo">/mo</span>
              </div>
              <p class="plan-tagline">For restaurants running their full operation digitally.</p>
            </div>

            <ul class="plan-features">
              <li v-for="f in proFeatures" :key="f">
                <Check :size="13" class="check-icon check-icon-pro" />{{ f }}
              </li>
            </ul>

            <button
              class="plan-btn plan-btn-primary"
              @click="checkout('pro')"
              :disabled="!!loading"
            >
              <Loader2 v-if="loading === 'pro'" :size="15" class="spin" />
              <span v-else>Get Pro</span>
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
            <Settings :size="13" /> Manage subscription in Settings
          </button>
          <span class="footer-divider" aria-hidden="true" />
          <button class="footer-link footer-link-danger" @click="signOut">
            <LogOut :size="13" /> Sign out
          </button>
        </div>
      </div>

      <p class="secure-note">
        <Lock :size="11" /> Payments secured by Lemon Squeezy · Cancel anytime · No hidden fees
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

import {
  TimerOff,
  Store,
  Check,
  Star,
  Loader2,
  AlertCircle,
  Settings,
  LogOut,
  Lock,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const restaurantName = ref('')
const loading = ref(null)
const error = ref('')

const starterFeatures = [
  'Up to 15 tables',
  'Up to 3 staff accounts',
  'Unlimited orders',
  'QR code ordering',
  'All staff role views',
  'Menu management',
]

const proFeatures = [
  'Unlimited tables',
  'Up to 10 staff accounts',
  'Unlimited orders',
  'QR code ordering',
  'All staff role views',
  'Menu management',
  'Analytics & charts',
  'Promotions & discounts',
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
})

async function checkout(plan) {
  error.value = ''
  loading.value = plan
  try {
    const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        plan,
        restaurantId: authStore.profile.restaurant_id,
        successUrl: `${window.location.origin}/app/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/trial-expired`,
      },
    })
    if (fnError) throw fnError
    if (data?.url) {
      window.location.href = data.url
    } else throw new Error('No checkout URL returned')
  } catch (err) {
    console.error('Checkout error:', err)
    error.value = 'Could not start checkout. Please try again or contact support.'
  } finally {
    loading.value = null
  }
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
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.975);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-accent-line {
  width: 40%;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--color-accent-border), transparent);
  border-radius: 999px;
  margin-bottom: 4px;
}

/* ── Expired badge ── */
.expired-badge {
  width: 62px;
  height: 62px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

/* ── Text ── */
.wall-title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.6px;
  text-align: center;
  line-height: 1.15;
}
.wall-subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  line-height: 1.65;
  text-align: center;
  max-width: 460px;
}

/* ── Account pill ── */
.account-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-pill);
  font-size: 13px;
}
.account-pill svg {
  color: var(--color-accent);
  flex-shrink: 0;
}
.pill-label {
  color: var(--color-text-faint);
  font-weight: 500;
}
.pill-sep {
  color: var(--color-text-faint);
}
.pill-value {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* ── Plans grid ── */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

/* ── Plan card ── */
.plan-card {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-subtle);
  border-radius: 16px;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  transition:
    border-color 0.18s,
    transform 0.18s;
}
.plan-card:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}
.plan-card-pro {
  border-color: var(--color-accent-border);
  background: rgba(200, 115, 58, 0.04);
  box-shadow: 0 0 36px -12px var(--color-accent-muted);
}
.plan-card-pro:hover {
  border-color: var(--color-accent);
}

/* Pro badge */
.pro-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: var(--shadow-glow);
}

/* Plan top */
.plan-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.plan-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.plan-name-pro {
  color: var(--color-accent);
}

.plan-price {
  display: flex;
  align-items: flex-start;
  line-height: 1;
  gap: 0;
}
.price-dollar {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-top: 6px;
}
.price-amount {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -2px;
  line-height: 1;
}
.plan-price-pro .price-amount {
  color: var(--color-accent);
}
.plan-price-pro .price-dollar {
  color: var(--color-accent-hover);
}
.price-mo {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-faint);
  align-self: flex-end;
  margin-bottom: 6px;
  margin-left: 3px;
}
.plan-tagline {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.45;
}

/* Features */
.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  padding: 0;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}
.check-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}
.check-icon-pro {
  color: var(--color-accent);
}

/* Buttons */
.plan-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.plan-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
}

.plan-btn-secondary {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
}
.plan-btn-secondary:hover:not(:disabled) {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
  background: var(--color-accent-muted);
}

.plan-btn-primary {
  background: var(--color-accent);
  color: white;
  box-shadow: var(--shadow-glow);
}
.plan-btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

/* Spinner */
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Error ── */
.wall-error {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-card);
  font-size: 13px;
  color: #f87171;
}

/* ── Footer ── */
.wall-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
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

/* ── Secure note ── */
.secure-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-faint);
  text-align: center;
}
.secure-note svg {
  color: var(--color-accent);
  flex-shrink: 0;
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
