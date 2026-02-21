<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="header-sub">Manage your restaurant</p>
        <h1 class="header-title">Settings</h1>
      </div>
      <button class="btn-save" @click="saveSettings" :disabled="saving || !isDirty">
        <span v-if="saving" class="spinner"></span>
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <!-- Upgrade success banner -->
    <div v-if="showUpgradedBanner" class="upgrade-banner">
      🎉 Welcome to {{ planDisplayName }}! Your subscription is now active.
      <button class="banner-close" @click="showUpgradedBanner = false">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 3" :key="n" class="skeleton-block"></div>
    </div>

    <template v-else>
      <!-- ── Section: Restaurant Profile ── -->
      <div class="section">
        <h2 class="section-title">Restaurant Profile</h2>
        <p class="section-desc">Shown to customers on the ordering page.</p>

        <div class="section-body">
          <!-- Logo -->
          <div class="logo-row">
            <div class="logo-preview">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="Restaurant Logo" class="logo-img" />
              <span v-else class="logo-placeholder">🍽️</span>
            </div>
            <div class="logo-actions">
              <p class="logo-label">Restaurant Logo</p>
              <p class="logo-hint" v-if="form.logoUrl">
                ✅ Logo uploaded — you can replace it below.
              </p>
              <p class="logo-hint" v-else>No logo yet. PNG or JPG, max 2MB.</p>
              <div class="logo-btns">
                <label class="btn-upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style="display: none"
                    @change="handleLogoUpload"
                    :disabled="uploadingLogo"
                  />
                  <span v-if="uploadingLogo" class="spinner spinner--dark"></span>
                  {{
                    uploadingLogo ? 'Uploading...' : form.logoUrl ? 'Replace Logo' : 'Upload Logo'
                  }}
                </label>
                <button v-if="form.logoUrl" class="btn-remove-logo" @click="removeLogo">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Restaurant Name <span class="required">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Pizza Palace"
                @input="markDirty"
              />
            </div>

            <div class="form-group">
              <label class="form-label">URL Slug</label>
              <div class="input-with-prefix">
                <span class="input-prefix">/order/</span>
                <input
                  v-model="form.slug"
                  type="text"
                  class="form-input input-suffixed"
                  placeholder="pizza-palace"
                  @input="markDirty"
                />
              </div>
              <p class="form-hint">⚠️ Changing this will break existing QR codes.</p>
            </div>

            <div class="form-group form-group--full">
              <label class="form-label">Address</label>
              <input
                v-model="form.address"
                type="text"
                class="form-input"
                placeholder="123 Main St, City, Country"
                @input="markDirty"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section: Regional Settings ── -->
      <div class="section">
        <h2 class="section-title">Regional Settings</h2>
        <p class="section-desc">Controls how prices and times are displayed across the app.</p>

        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-input" @change="markDirty">
                <option v-for="c in currencies" :key="c.code" :value="c.code">
                  {{ c.symbol }} {{ c.name }} ({{ c.code }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select v-model="form.timezone" class="form-input" @change="markDirty">
                <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                  {{ tz.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="preview-box">
            <span class="preview-label">Price Preview</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
        </div>
      </div>

      <!-- ── Section: Subscription & Billing ── -->
      <div class="section">
        <h2 class="section-title">Subscription & Billing</h2>
        <p class="section-desc">Your current plan and billing status.</p>

        <div class="section-body">
          <!-- Plan Status Card -->
          <div class="plan-card" :class="`plan-card--${planStatus}`">
            <div class="plan-card-left">
              <div class="plan-icon">{{ planIcon }}</div>
              <div>
                <p class="plan-name">{{ planDisplayName }}</p>
                <p class="plan-meta">{{ planMeta }}</p>
              </div>
            </div>
            <span class="plan-badge" :class="`badge--${planStatus}`">{{ planBadgeLabel }}</span>
          </div>

          <!-- Trial Countdown -->
          <div v-if="isOnTrial" class="trial-countdown">
            <div class="countdown-header">
              <span class="countdown-title">⏳ Trial Period</span>
              <span class="countdown-expires"
                >Expires {{ formatDate(restaurant.trial_ends_at) }}</span
              >
            </div>
            <div class="countdown-days-row">
              <div class="countdown-day-block">
                <span class="countdown-number">{{ trialTimeLeft.days }}</span>
                <span class="countdown-unit">days</span>
              </div>
              <span class="countdown-colon">:</span>
              <div class="countdown-day-block">
                <span class="countdown-number">{{ trialTimeLeft.hours }}</span>
                <span class="countdown-unit">hours</span>
              </div>
              <span class="countdown-colon">:</span>
              <div class="countdown-day-block">
                <span class="countdown-number">{{ trialTimeLeft.minutes }}</span>
                <span class="countdown-unit">mins</span>
              </div>
              <span class="countdown-colon">:</span>
              <div class="countdown-day-block">
                <span class="countdown-number">{{ trialTimeLeft.seconds }}</span>
                <span class="countdown-unit">secs</span>
              </div>
            </div>
            <div class="trial-progress-bar">
              <div class="trial-progress-fill" :style="{ width: `${trialPercent}%` }"></div>
            </div>
            <div class="trial-progress-labels">
              <span>Day 1</span>
              <span>{{ trialTotalDays }} days used of 14</span>
              <span>Day 14</span>
            </div>
          </div>

          <!-- Expired Notice -->
          <div v-else-if="planStatus === 'expired'" class="expired-notice">
            <span class="expired-icon">🔒</span>
            <div>
              <p class="expired-title">Trial ended on {{ formatDate(restaurant.trial_ends_at) }}</p>
              <p class="expired-sub">Upgrade to restore full access to your restaurant.</p>
            </div>
          </div>

          <!-- Billing Info rows -->
          <div class="billing-info">
            <div class="billing-row">
              <span class="billing-key">Plan</span>
              <span class="billing-val">{{ planDisplayName }}</span>
            </div>
            <div class="billing-row" v-if="restaurant.trial_ends_at">
              <span class="billing-key">Trial Ends</span>
              <span class="billing-val">{{ formatDate(restaurant.trial_ends_at) }}</span>
            </div>
            <!-- FIX: was stripe_customer_id / stripe_subscription_id -->
            <div class="billing-row" v-if="restaurant.lemonsqueezy_customer_id">
              <span class="billing-key">Customer ID</span>
              <span class="billing-val billing-val--mono">{{
                restaurant.lemonsqueezy_customer_id
              }}</span>
            </div>
            <div class="billing-row" v-if="restaurant.lemonsqueezy_subscription_id">
              <span class="billing-key">Subscription ID</span>
              <span class="billing-val billing-val--mono">{{
                restaurant.lemonsqueezy_subscription_id
              }}</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="billing-actions">
            <!-- Upgrade button — shown when not subscribed -->
            <button
              v-if="!hasActiveSubscription"
              class="btn-upgrade"
              @click="showPlanPicker = true"
              :disabled="checkoutLoading"
            >
              <span v-if="checkoutLoading" class="spinner"></span>
              <span v-else>⚡ Upgrade Plan</span>
            </button>

            <!-- FIX: was checking restaurant.stripe_customer_id
                 LS portal URL is stored directly in customer_portal_url — no Edge Function needed -->
            <a
              v-if="hasActiveSubscription && restaurant.customer_portal_url"
              :href="restaurant.customer_portal_url"
              target="_blank"
              class="btn-portal"
            >
              Manage Billing →
            </a>
          </div>

          <!-- Billing error -->
          <div v-if="billingError" class="alert alert--error" style="margin-top: 1rem">
            {{ billingError }}
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="saveError" class="alert alert--error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="alert alert--success">{{ saveSuccess }}</div>

      <!-- Bottom Bar -->
      <div class="bottom-bar">
        <button class="btn-save" @click="saveSettings" :disabled="saving || !isDirty">
          <span v-if="saving" class="spinner"></span>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button v-if="isDirty" class="btn-discard" @click="discardChanges">Discard</button>
      </div>
    </template>

    <!-- ── Plan Picker Modal ── -->
    <Teleport to="body">
      <div v-if="showPlanPicker" class="modal-overlay" @click.self="showPlanPicker = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Choose a Plan</h2>
            <button class="modal-close" @click="showPlanPicker = false">✕</button>
          </div>
          <!-- FIX: was "Stripe's secure checkout page" -->
          <p class="modal-subtitle">You'll be taken to Lemon Squeezy's secure checkout page.</p>

          <div class="modal-plans">
            <!-- Starter -->
            <div
              class="modal-plan"
              :class="{ 'modal-plan--selected': selectedPlan === 'starter' }"
              @click="selectedPlan = 'starter'"
            >
              <div class="modal-plan-top">
                <div>
                  <div class="modal-plan-name">Starter</div>
                  <!-- FIX: was $29 -->
                  <div class="modal-plan-price">$49<span>/mo</span></div>
                </div>
                <div class="modal-plan-check" v-if="selectedPlan === 'starter'">✓</div>
              </div>
              <!-- FIX: updated features to match decided plan -->
              <ul class="modal-plan-features">
                <li>Up to 15 tables</li>
                <li>Up to 3 staff accounts</li>
                <li>Unlimited orders</li>
                <li>Kitchen, cashier & waiter views</li>
                <li>QR code ordering</li>
                <li>Email support</li>
              </ul>
            </div>

            <!-- Pro -->
            <div
              class="modal-plan modal-plan--featured"
              :class="{ 'modal-plan--selected': selectedPlan === 'pro' }"
              @click="selectedPlan = 'pro'"
            >
              <div class="modal-plan-popular">Most Popular</div>
              <div class="modal-plan-top">
                <div>
                  <div class="modal-plan-name">Pro</div>
                  <!-- FIX: was $59 -->
                  <div class="modal-plan-price">$99<span>/mo</span></div>
                </div>
                <div class="modal-plan-check" v-if="selectedPlan === 'pro'">✓</div>
              </div>
              <!-- FIX: updated features — was "Unlimited staff accounts", missing promotions -->
              <ul class="modal-plan-features">
                <li>Unlimited tables</li>
                <li>Up to 10 staff accounts</li>
                <li>Unlimited orders</li>
                <li>Kitchen, cashier & waiter views</li>
                <li>Analytics & revenue charts</li>
                <li>Promotions & discount codes</li>
                <li>Priority email support</li>
              </ul>
            </div>
          </div>

          <button
            class="modal-checkout-btn"
            @click="goToCheckout"
            :disabled="!selectedPlan || checkoutLoading"
          >
            <span v-if="checkoutLoading" class="spinner"></span>
            <span v-else>Continue to Checkout →</span>
          </button>

          <!-- FIX: was "Powered by Stripe" -->
          <p class="modal-secure">🔒 Powered by Lemon Squeezy. Cancel anytime.</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const isDirty = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const checkoutLoading = ref(false)
const billingError = ref('')

// FIX: removed portalLoading — portal is now a plain <a> link, no loading state needed

// Plan picker modal
const showPlanPicker = ref(false)
const selectedPlan = ref('pro') // default to Pro

// Upgrade success banner (shown when returning from Lemon Squeezy with ?upgraded=true)
const showUpgradedBanner = ref(false)

// Raw restaurant row — used for read-only billing display
const restaurant = ref({})

// Editable form fields only
const form = ref({
  name: '',
  slug: '',
  address: '',
  logoUrl: '',
  currency: 'USD',
  timezone: 'UTC',
})

// ─── Snapshot for dirty detection + discard ───────────────────────────────────
let snapshot = ''
function takeSnapshot() {
  snapshot = JSON.stringify(form.value)
}
function markDirty() {
  isDirty.value = JSON.stringify(form.value) !== snapshot
}

// ─── Live Countdown Timer ─────────────────────────────────────────────────────
const now = ref(new Date())
let timerInterval = null

function startTimer() {
  timerInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
}

const isOnTrial = computed(() => {
  if (!restaurant.value.trial_ends_at) return false
  return new Date(restaurant.value.trial_ends_at) > now.value
})

const hasActiveSubscription = computed(() => {
  const plan = restaurant.value.plan
  return plan && plan !== 'trial' && plan !== 'expired' && plan !== 'free' && plan !== null
})

const trialMsLeft = computed(() => {
  if (!restaurant.value.trial_ends_at) return 0
  return Math.max(0, new Date(restaurant.value.trial_ends_at) - now.value)
})

const trialTimeLeft = computed(() => {
  const total = trialMsLeft.value
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
})

const trialTotalDays = computed(() => {
  if (!restaurant.value.trial_ends_at || !restaurant.value.created_at) return 0
  const elapsed = now.value - new Date(restaurant.value.created_at)
  return Math.min(14, Math.floor(elapsed / (1000 * 60 * 60 * 24)))
})

const trialPercent = computed(() => {
  return Math.min(100, Math.round((trialTotalDays.value / 14) * 100))
})

const planStatus = computed(() => {
  if (hasActiveSubscription.value) return 'active'
  if (isOnTrial.value) return 'trial'
  return 'expired'
})

const planDisplayName = computed(() => {
  const plan = restaurant.value.plan
  if (!plan || plan === 'free') return 'Free'
  if (plan === 'trial') return 'Trial'
  if (plan === 'pro') return 'Pro'
  if (plan === 'starter') return 'Starter'
  if (plan === 'expired') return 'Expired'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
})

const planMeta = computed(() => {
  if (hasActiveSubscription.value) return 'Full access — all features unlocked'
  if (isOnTrial.value)
    return `${trialTimeLeft.value.days}d ${trialTimeLeft.value.hours}h left in your trial`
  return 'Your trial has ended — upgrade to continue'
})

const planIcon = computed(() => {
  if (hasActiveSubscription.value) return '⭐'
  if (isOnTrial.value) return '⏳'
  return '🔒'
})

const planBadgeLabel = computed(() => {
  if (hasActiveSubscription.value) return 'Active'
  if (isOnTrial.value) return 'Trial'
  return 'Expired'
})

// ─── Static Data ──────────────────────────────────────────────────────────────
const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
]

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia (Brazil)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris / Berlin / Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Mumbai / New Delhi' },
  { value: 'Asia/Bangkok', label: 'Bangkok / Jakarta' },
  { value: 'Asia/Phnom_Penh', label: 'Phnom Penh / Ho Chi Minh' },
  { value: 'Asia/Singapore', label: 'Singapore / Kuala Lumpur' },
  { value: 'Asia/Shanghai', label: 'Beijing / Shanghai' },
  { value: 'Asia/Tokyo', label: 'Tokyo / Seoul' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
]

const currencyPreview = computed(() => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: form.value.currency,
    }).format(1234.5)
  } catch {
    return '—'
  }
})

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchSettings() {
  loading.value = true
  const restaurantId = authStore.profile?.restaurant_id

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'name, slug, address, logo_url, currency, timezone, plan, trial_ends_at, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, customer_portal_url, created_at',
    )
    .eq('id', restaurantId)
    .single()

  if (!error && data) {
    restaurant.value = data
    form.value = {
      name: data.name || '',
      slug: data.slug || '',
      address: data.address || '',
      logoUrl: data.logo_url || '',
      currency: data.currency || 'USD',
      timezone: data.timezone || 'UTC',
    }
  }

  takeSnapshot()
  loading.value = false
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────
async function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    saveError.value = 'Logo must be under 2MB.'
    return
  }

  uploadingLogo.value = true
  saveError.value = ''

  const restaurantId = authStore.profile?.restaurant_id
  const ext = file.name.split('.').pop()
  const path = `${restaurantId}/logo.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('restaurant-assets')
    .upload(path, file, { upsert: true })

  if (uploadErr) {
    saveError.value = 'Upload failed: ' + uploadErr.message
    uploadingLogo.value = false
    return
  }

  const { data: urlData } = supabase.storage.from('restaurant-assets').getPublicUrl(path)
  form.value.logoUrl = urlData.publicUrl
  markDirty()
  uploadingLogo.value = false
}

function removeLogo() {
  form.value.logoUrl = ''
  markDirty()
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function saveSettings() {
  if (!form.value.name.trim()) {
    saveError.value = 'Restaurant name is required.'
    return
  }

  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  const restaurantId = authStore.profile?.restaurant_id

  const { error } = await supabase
    .from('restaurants')
    .update({
      name: form.value.name.trim(),
      slug: form.value.slug.trim(),
      address: form.value.address.trim() || null,
      logo_url: form.value.logoUrl || null,
      currency: form.value.currency,
      timezone: form.value.timezone,
    })
    .eq('id', restaurantId)

  if (error) {
    saveError.value = 'Failed to save: ' + error.message
  } else {
    saveSuccess.value = '✅ Settings saved successfully.'
    takeSnapshot()
    isDirty.value = false
    await authStore.fetchProfile()
    setTimeout(() => {
      saveSuccess.value = ''
    }, 3000)
  }

  saving.value = false
}

function discardChanges() {
  form.value = JSON.parse(snapshot)
  isDirty.value = false
  saveError.value = ''
  saveSuccess.value = ''
}

// ─── Lemon Squeezy: Checkout ──────────────────────────────────────────────────
// FIX: body now only sends { plan } — Edge Function authenticates the user
// itself via the auth token and handles redirect URLs via APP_URL env var.
// Removed: restaurantId, successUrl, cancelUrl from body.
async function goToCheckout() {
  if (!selectedPlan.value) return
  billingError.value = ''
  checkoutLoading.value = true

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan: selectedPlan.value },
    })

    if (error) throw error

    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error('No checkout URL returned from Edge Function.')
    }
  } catch (err) {
    console.error('Checkout error:', err)
    billingError.value = 'Could not start checkout. Please try again or contact support.'
    checkoutLoading.value = false
  }

  // Note: don't set checkoutLoading = false on success — page is redirecting
}

// FIX: goToPortal() removed entirely.
// Lemon Squeezy portal is a plain URL stored in restaurant.customer_portal_url.
// The <a> tag in the template handles this directly — no Edge Function needed.

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchSettings()
  startTimer()

  // Show success banner if returning from Lemon Squeezy Checkout
  if (route.query.upgraded === 'true') {
    showUpgradedBanner.value = true
    // Refetch so plan/billing fields update immediately
    await fetchSettings()
    // Clean the query param from URL without navigation
    window.history.replaceState({}, '', '/app/settings')
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.settings-page {
  padding: 2rem;
  max-width: 820px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
}

/* ── Upgrade Banner ── */
.upgrade-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #15803d;
  margin-bottom: 1.5rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-close {
  background: none;
  border: none;
  color: #15803d;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.banner-close:hover {
  opacity: 1;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}
.header-sub {
  font-size: 0.78rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}
.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* ── Skeleton ── */
.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.skeleton-block {
  height: 200px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── Section ── */
.section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  padding: 1.25rem 1.5rem 0;
}
.section-desc {
  font-size: 0.8rem;
  color: #9ca3af;
  padding: 0.25rem 1.5rem 0;
  margin: 0;
}
.section-body {
  padding: 1.25rem 1.5rem 1.5rem;
}

/* ── Logo ── */
.logo-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}
.logo-preview {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-placeholder {
  font-size: 2.25rem;
}
.logo-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.2rem;
}
.logo-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.6rem;
}
.logo-btns {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  border: 1px solid #e5e7eb;
}
.btn-upload:hover {
  background: #e5e7eb;
}
.btn-remove-logo {
  background: none;
  border: none;
  font-size: 0.78rem;
  color: #e11d48;
  cursor: pointer;
  font-weight: 600;
}
.btn-remove-logo:hover {
  text-decoration: underline;
}

/* ── Form ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-group--full {
  grid-column: 1 / -1;
}
.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
}
.required {
  color: #e11d48;
}
.form-hint {
  font-size: 0.72rem;
  color: #f59e0b;
  margin-top: 0.3rem;
}
.form-input {
  padding: 0.65rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  font-size: 0.85rem;
  color: #111827;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #6366f1;
}
.input-with-prefix {
  display: flex;
  align-items: center;
}
.input-prefix {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-right: none;
  padding: 0.65rem 0.75rem;
  border-radius: 9px 0 0 9px;
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
}
.input-suffixed {
  border-radius: 0 9px 9px 0;
}

/* ── Currency Preview ── */
.preview-box {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 9px;
  padding: 0.6rem 1rem;
  margin-top: 0.75rem;
}
.preview-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #16a34a;
}
.preview-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
}

/* ── Plan Card ── */
.plan-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid;
  margin-bottom: 1.25rem;
}
.plan-card--active {
  background: #f0fdf4;
  border-color: #86efac;
}
.plan-card--trial {
  background: #fffbeb;
  border-color: #fde68a;
}
.plan-card--expired {
  background: #fff1f2;
  border-color: #fecdd3;
}
.plan-card-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.plan-icon {
  font-size: 1.75rem;
  line-height: 1;
}
.plan-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111827;
  margin-bottom: 0.15rem;
}
.plan-meta {
  font-size: 0.78rem;
  color: #6b7280;
}
.plan-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}
.badge--active {
  background: #d1fae5;
  color: #059669;
}
.badge--trial {
  background: #fef3c7;
  color: #d97706;
}
.badge--expired {
  background: #fee2e2;
  color: #dc2626;
}

/* ── Trial Countdown ── */
.trial-countdown {
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}
.countdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.countdown-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #92400e;
}
.countdown-expires {
  font-size: 0.75rem;
  color: #d97706;
}
.countdown-days-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.countdown-day-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  min-width: 64px;
}
.countdown-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #d97706;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.countdown-unit {
  font-size: 0.65rem;
  font-weight: 600;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.2rem;
}
.countdown-colon {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fbbf24;
  margin-bottom: 1rem;
}
.trial-progress-bar {
  height: 7px;
  background: #fef3c7;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}
.trial-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 999px;
  transition: width 1s linear;
}
.trial-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #d97706;
}

/* ── Expired Notice ── */
.expired-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #fff1f2;
  border: 1.5px solid #fecdd3;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}
.expired-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}
.expired-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e11d48;
  margin-bottom: 0.2rem;
}
.expired-sub {
  font-size: 0.78rem;
  color: #9ca3af;
}

/* ── Billing Info ── */
.billing-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 1.25rem;
}
.billing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.83rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.billing-row:last-child {
  border-bottom: none;
}
.billing-key {
  color: #6b7280;
  font-weight: 500;
}
.billing-val {
  color: #111827;
  font-weight: 600;
}
.billing-val--mono {
  font-family: monospace;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ── Billing Actions ── */
.billing-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
.btn-upgrade {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-upgrade:hover:not(:disabled) {
  background: #4338ca;
}
.btn-upgrade:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* FIX: btn-portal is now an <a> tag — styled identically but as a link */
.btn-portal {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-portal:hover {
  background: #e5e7eb;
}

/* ── Alerts ── */
.alert {
  padding: 0.85rem 1.1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;
}
.alert--error {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}
.alert--success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* ── Bottom Bar ── */
.bottom-bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) {
  background: #374151;
}
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-discard {
  padding: 0.7rem 1.2rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.12s;
}
.btn-discard:hover {
  background: #f9fafb;
  color: #374151;
}

/* ── Spinners ── */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}
.spinner--dark {
  border-color: rgba(0, 0, 0, 0.12);
  border-top-color: #374151;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Plan Picker Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: #fff;
  border-radius: 18px;
  padding: 32px 28px;
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideUp 0.2s ease;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.3px;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s;
}
.modal-close:hover {
  color: #374151;
}

.modal-subtitle {
  font-size: 13.5px;
  color: #6b7280;
  margin: -12px 0 0;
}

.modal-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-plan {
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 16px;
  cursor: pointer;
  position: relative;
  background: #fafafa;
  transition:
    border-color 0.15s,
    background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-plan:hover {
  border-color: #a5b4fc;
  background: #f5f3ff;
}

.modal-plan--selected {
  border-color: #4f46e5 !important;
  background: #eef2ff !important;
}

.modal-plan--featured {
  background: #1c1917;
  border-color: #1c1917;
}

.modal-plan--featured:hover {
  background: #2d2421;
  border-color: #c8733a;
}

.modal-plan--featured.modal-plan--selected {
  border-color: #c8733a !important;
  background: #1c1917 !important;
}

.modal-plan-popular {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #c8733a;
  color: white;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 99px;
  white-space: nowrap;
}

.modal-plan-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-plan-name {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.modal-plan--featured .modal-plan-name {
  color: #faf8f5;
}

.modal-plan-price {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -1px;
  line-height: 1;
}

.modal-plan--featured .modal-plan-price {
  color: #faf8f5;
}

.modal-plan-price span {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 0;
}

.modal-plan--featured .modal-plan-price span {
  color: rgba(250, 248, 245, 0.45);
}

.modal-plan-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-plan--featured .modal-plan-check {
  background: #c8733a;
}

.modal-plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.modal-plan-features li {
  font-size: 12.5px;
  color: #4b5563;
  padding-left: 14px;
  position: relative;
  line-height: 1.4;
}

.modal-plan-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4f46e5;
  font-weight: 700;
  font-size: 11px;
}

.modal-plan--featured .modal-plan-features li {
  color: rgba(250, 248, 245, 0.65);
}
.modal-plan--featured .modal-plan-features li::before {
  color: #c8733a;
}

.modal-checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-checkout-btn:hover:not(:disabled) {
  background: #4338ca;
}
.modal-checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-secure {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin: -8px 0 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .settings-page {
    padding: 1rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-group--full {
    grid-column: 1;
  }
  .logo-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .plan-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .countdown-day-block {
    min-width: 52px;
    padding: 0.5rem 0.6rem;
  }
  .countdown-number {
    font-size: 1.35rem;
  }
  .modal-plans {
    grid-template-columns: 1fr;
  }
  .modal {
    padding: 24px 20px;
  }
}
</style>
