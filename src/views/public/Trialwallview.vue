<template>
  <div class="wall-shell">
    <!-- Background texture -->
    <div class="wall-bg" />

    <div class="wall-content">
      <!-- Header -->
      <div class="wall-header">
        <div class="logo">
          <span class="logo-icon">🍽️</span>
          <span class="logo-text">RestaurantOS</span>
        </div>
      </div>

      <!-- Main card -->
      <div class="wall-card">
        <!-- Icon -->
        <div class="expired-badge">
          <span class="expired-icon">⏱</span>
        </div>

        <h1 class="wall-title">Your trial has ended</h1>
        <p class="wall-subtitle">
          Your 14-day free trial is over. Choose a plan to keep your restaurant running — orders,
          kitchen, staff, and everything else.
        </p>

        <!-- Trial info for this restaurant -->
        <div class="trial-info" v-if="restaurantName">
          <span class="trial-info-label">Account</span>
          <span class="trial-info-value">{{ restaurantName }}</span>
        </div>

        <!-- Plans -->
        <div class="plans-grid">
          <!-- Starter -->
          <div class="plan-card">
            <div class="plan-name">Starter</div>
            <div class="plan-price">
              <span class="price-amount">${{ pricing.starter }}</span>
              <span class="price-period">/mo</span>
            </div>
            <ul class="plan-features">
              <li>✓ Up to 3 staff accounts</li>
              <li>✓ Unlimited orders</li>
              <li>✓ QR ordering</li>
              <li>✓ Kitchen & cashier views</li>
              <li>✓ Email support</li>
            </ul>
            <button
              class="plan-btn plan-btn-secondary"
              @click="checkout('starter')"
              :disabled="loading"
            >
              <span v-if="loading === 'starter'" class="btn-spinner" />
              <span v-else>Get Starter</span>
            </button>
          </div>

          <!-- Pro (highlighted) -->
          <div class="plan-card plan-card-featured">
            <div class="plan-popular">Most Popular</div>
            <div class="plan-name">Pro</div>
            <div class="plan-price">
              <span class="price-amount">${{ pricing.pro }}</span>
              <span class="price-period">/mo</span>
            </div>
            <ul class="plan-features">
              <li>✓ Unlimited staff accounts</li>
              <li>✓ Unlimited orders</li>
              <li>✓ QR ordering</li>
              <li>✓ Kitchen & cashier views</li>
              <li>✓ Dashboard analytics</li>
              <li>✓ Priority support</li>
            </ul>
            <button class="plan-btn plan-btn-primary" @click="checkout('pro')" :disabled="loading">
              <span v-if="loading === 'pro'" class="btn-spinner" />
              <span v-else>Get Pro</span>
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div class="wall-error" v-if="error">{{ error }}</div>

        <!-- Footer actions -->
        <div class="wall-footer">
          <button class="footer-link" @click="goToSettings">
            ⚙ Manage subscription in Settings
          </button>
          <button class="footer-link" @click="signOut">⎋ Sign out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const restaurantName = ref('')
const loading = ref(null) // 'starter' | 'pro' | null
const error = ref('')

// ── Replace these with your real Stripe Price IDs ──
const pricing = {
  starter: 29,
  pro: 59,
}
const stripePriceIds = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER,
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO,
}

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
    // Call your Supabase Edge Function (Phase 3 - Step 4)
    // This will create a Stripe Checkout session and return the URL
    const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: stripePriceIds[plan],
        restaurantId: authStore.profile.restaurant_id,
        successUrl: `${window.location.origin}/app/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/trial-expired`,
      },
    })

    if (fnError) throw fnError
    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error('No checkout URL returned')
    }
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Shell ─────────────────────────────────────── */
.wall-shell {
  min-height: 100vh;
  background: #f5f3ef;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Subtle grain texture background */
.wall-bg {
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200, 115, 58, 0.08) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  background-size:
    cover,
    200px 200px;
  pointer-events: none;
  z-index: 0;
}

/* ── Layout ─────────────────────────────────────── */
.wall-content {
  position: relative;
  z-index: 1;
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

/* ── Header ─────────────────────────────────────── */
.wall-header {
  width: 100%;
  display: flex;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  font-size: 22px;
}

.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.3px;
}

/* ── Card ───────────────────────────────────────── */
.wall-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e8e2da;
  border-radius: 20px;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.06);
}

/* ── Expired badge ──────────────────────────────── */
.expired-badge {
  width: 64px;
  height: 64px;
  background: #fff7ed;
  border: 2px solid #fed7aa;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

/* ── Headings ───────────────────────────────────── */
.wall-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.5px;
  text-align: center;
  line-height: 1.2;
}

.wall-subtitle {
  font-size: 15px;
  color: #6b6460;
  line-height: 1.6;
  text-align: center;
  max-width: 440px;
}

/* ── Trial info ─────────────────────────────────── */
.trial-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f3ef;
  border: 1px solid #e8e2da;
  border-radius: 99px;
  font-size: 13px;
}

.trial-info-label {
  color: #9e9087;
  font-weight: 500;
}

.trial-info-value {
  color: #1c1917;
  font-weight: 600;
}

/* ── Plans grid ─────────────────────────────────── */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.plan-card {
  border: 1.5px solid #e8e2da;
  border-radius: 14px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  background: #faf9f7;
  transition: border-color 0.15s;
}

.plan-card:hover {
  border-color: #c8733a;
}

.plan-card-featured {
  background: #1c1917;
  border-color: #1c1917;
}

.plan-card-featured:hover {
  border-color: #c8733a;
}

.plan-popular {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: #c8733a;
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: 99px;
  white-space: nowrap;
}

.plan-name {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.2px;
}

.plan-card-featured .plan-name {
  color: #faf9f7;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-amount {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -1px;
  line-height: 1;
}

.plan-card-featured .price-amount {
  color: #faf9f7;
}

.price-period {
  font-size: 13px;
  color: #9e9087;
  font-weight: 500;
}

.plan-card-featured .price-period {
  color: rgba(250, 249, 247, 0.5);
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.plan-features li {
  font-size: 13px;
  color: #4a4440;
  line-height: 1.4;
}

.plan-card-featured .plan-features li {
  color: rgba(250, 249, 247, 0.75);
}

/* ── Buttons ────────────────────────────────────── */
.plan-btn {
  width: 100%;
  padding: 11px 16px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plan-btn-secondary {
  background: #1c1917;
  color: #faf9f7;
}

.plan-btn-secondary:hover:not(:disabled) {
  background: #2d2421;
}

.plan-btn-primary {
  background: #c8733a;
  color: white;
}

.plan-btn-primary:hover:not(:disabled) {
  background: #b5622e;
}

/* Spinner */
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Error ──────────────────────────────────────── */
.wall-error {
  width: 100%;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  color: #dc2626;
  text-align: center;
}

/* ── Footer links ───────────────────────────────── */
.wall-footer {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  background: none;
  border: none;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  color: #9e9087;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.footer-link:hover {
  color: #1c1917;
}

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 520px) {
  .wall-card {
    padding: 28px 20px;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .wall-title {
    font-size: 22px;
  }
}
</style>
