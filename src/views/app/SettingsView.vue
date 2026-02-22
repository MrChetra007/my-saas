<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your restaurant profile & preferences</p>
      </div>
      <button class="btn-save" @click="saveSettings" :disabled="saving || !isDirty">
        <span v-if="saving" class="spinner" />
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>

    <!-- Upgrade success banner -->
    <div v-if="showUpgradedBanner" class="upgrade-banner">
      <span class="banner-icon">🎉</span>
      <div>
        <strong>Welcome to {{ planDisplayName }}!</strong><br />
        Your subscription is now active.
      </div>
      <button class="banner-close" @click="showUpgradedBanner = false">×</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Loading settings…</span>
    </div>

    <template v-else>
      <!-- Restaurant Profile -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Restaurant Profile</h2>
          <p class="section-desc">This information appears on your customer ordering page.</p>
        </div>

        <div class="section-body">
          <!-- Logo -->
          <div class="logo-group">
            <div class="logo-preview">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="logo-img" />
              <div v-else class="logo-placeholder">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M3 7V5a2 2 0 012-2h6a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2V7m14 14h2a2 2 0 002-2V7"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <div class="logo-actions">
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  @change="handleLogoUpload"
                  :disabled="uploadingLogo"
                />
                <span v-if="uploadingLogo" class="spinner spinner-sm" />
                {{ uploadingLogo ? 'Uploading…' : form.logoUrl ? 'Replace Logo' : 'Upload Logo' }}
              </label>

              <button v-if="form.logoUrl" class="btn-remove" @click="removeLogo">Remove</button>

              <p class="logo-hint">Recommended: 512×512 PNG or JPG, max 2MB</p>
            </div>
          </div>

          <!-- Form fields -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Restaurant Name <span class="required">*</span></label>
              <input
                v-model="form.name"
                class="form-input"
                placeholder="e.g. Ember & Oak"
                @input="markDirty"
              />
            </div>

            <div class="form-group">
              <label class="form-label">URL Slug</label>
              <div class="slug-wrapper">
                <span class="slug-prefix">yourdomain.com/order/</span>
                <input
                  v-model="form.slug"
                  class="form-input slug-input"
                  placeholder="ember-oak"
                  @input="markDirty"
                />
              </div>
              <p class="form-hint warning">Changing this will break existing QR codes and links.</p>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Address</label>
              <input
                v-model="form.address"
                class="form-input"
                placeholder="e.g. 123 Riverside Blvd, Phnom Penh"
                @input="markDirty"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Settings -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Regional Settings</h2>
          <p class="section-desc">How prices, dates and times appear to customers.</p>
        </div>

        <div class="section-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-select" @change="markDirty">
                <option v-for="c in currencies" :key="c.code" :value="c.code">
                  {{ c.symbol }} {{ c.name }} ({{ c.code }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select v-model="form.timezone" class="form-select" @change="markDirty">
                <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                  {{ tz.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="preview-card">
            <span class="preview-label">Price Example</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
        </div>
      </div>

      <!-- Subscription & Billing -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Subscription & Billing</h2>
          <p class="section-desc">Manage your plan and billing details.</p>
        </div>

        <div class="section-body">
          <!-- Plan Status -->
          <div class="plan-card" :class="`plan-${planStatus}`">
            <div class="plan-left">
              <div class="plan-icon">{{ planIcon }}</div>
              <div>
                <div class="plan-name">{{ planDisplayName }}</div>
                <div class="plan-meta">{{ planMeta }}</div>
              </div>
            </div>
            <span class="plan-badge" :class="planStatus">{{ planBadgeLabel }}</span>
          </div>

          <!-- Trial Countdown (if applicable) -->
          <div v-if="isOnTrial" class="trial-card">
            <div class="trial-header">
              <span class="trial-title">Trial Period</span>
              <span class="trial-expires">Ends {{ formatDate(restaurant.trial_ends_at) }}</span>
            </div>

            <div class="trial-timer">
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.days }}</span>
                <span class="timer-unit">days</span>
              </div>
              <span class="timer-colon">:</span>
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.hours }}</span>
                <span class="timer-unit">hrs</span>
              </div>
              <span class="timer-colon">:</span>
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.minutes }}</span>
                <span class="timer-unit">min</span>
              </div>
            </div>

            <div class="trial-progress">
              <div class="progress-fill" :style="{ width: `${trialPercent}%` }" />
            </div>

            <div class="trial-labels">
              <span>Started</span>
              <span>{{ trialTotalDays }} / 14 days used</span>
              <span>Ends</span>
            </div>

            <button class="btn-upgrade" @click="showPlanPicker = true">Upgrade Now</button>
          </div>

          <!-- Expired -->
          <div v-else-if="planStatus === 'expired'" class="expired-card">
            <svg
              class="expired-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <div>
              <h3 class="expired-title">Trial Expired</h3>
              <p class="expired-text">
                Your trial ended on {{ formatDate(restaurant.trial_ends_at) }}.<br />
                Upgrade to continue using all features.
              </p>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">Choose a Plan</button>
          </div>

          <!-- Billing Details -->
          <div class="billing-details">
            <div class="billing-row">
              <span class="billing-key">Current Plan</span>
              <span class="billing-value">{{ planDisplayName }}</span>
            </div>

            <div class="billing-row" v-if="restaurant.trial_ends_at">
              <span class="billing-key">Trial Ends</span>
              <span class="billing-value">{{ formatDate(restaurant.trial_ends_at) }}</span>
            </div>

            <div class="billing-row" v-if="restaurant.lemonsqueezy_customer_id">
              <span class="billing-key">Customer ID</span>
              <span class="billing-value mono">{{ restaurant.lemonsqueezy_customer_id }}</span>
            </div>

            <div class="billing-row" v-if="restaurant.lemonsqueezy_subscription_id">
              <span class="billing-key">Subscription ID</span>
              <span class="billing-value mono">{{ restaurant.lemonsqueezy_subscription_id }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="billing-actions">
            <button
              v-if="!hasActiveSubscription"
              class="btn-upgrade"
              @click="showPlanPicker = true"
              :disabled="checkoutLoading"
            >
              <span v-if="checkoutLoading" class="spinner" />
              Upgrade Plan
            </button>

            <a
              v-if="hasActiveSubscription && restaurant.customer_portal_url"
              :href="restaurant.customer_portal_url"
              target="_blank"
              class="btn-portal"
            >
              Manage Billing →
            </a>
          </div>

          <div v-if="billingError" class="alert error">
            {{ billingError }}
          </div>
        </div>
      </div>

      <!-- Save Feedback -->
      <div v-if="saveError" class="alert error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="alert success">{{ saveSuccess }}</div>

      <!-- Sticky Bottom Bar -->
      <div class="bottom-bar" v-if="isDirty">
        <button class="btn-save" @click="saveSettings" :disabled="saving">
          <span v-if="saving" class="spinner" />
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
        <button class="btn-discard" @click="discardChanges">Discard</button>
      </div>
    </template>

    <!-- Plan Picker Modal -->
    <Teleport to="body">
      <div v-if="showPlanPicker" class="modal-backdrop" @click.self="showPlanPicker = false">
        <div class="modal modal-plan-picker">
          <div class="modal-header">
            <h2 class="modal-title">Choose Your Plan</h2>
            <button class="modal-close-btn" @click="showPlanPicker = false">×</button>
          </div>

          <p class="modal-subtitle">Secure checkout powered by Lemon Squeezy. Cancel anytime.</p>

          <div class="plan-options">
            <!-- Starter -->
            <div
              class="plan-option"
              :class="{ selected: selectedPlan === 'starter' }"
              @click="selectedPlan = 'starter'"
            >
              <div class="plan-header">
                <div>
                  <h3 class="plan-name">Starter</h3>
                  <div class="plan-price">$49<span>/mo</span></div>
                </div>
                <div v-if="selectedPlan === 'starter'" class="plan-selected">✓</div>
              </div>

              <ul class="plan-features">
                <li>Up to 15 tables</li>
                <li>Up to 3 staff accounts</li>
                <li>Unlimited orders</li>
                <li>Kitchen & waiter views</li>
                <li>QR code ordering</li>
                <li>Email support</li>
              </ul>
            </div>

            <!-- Pro (Featured) -->
            <div
              class="plan-option featured"
              :class="{ selected: selectedPlan === 'pro' }"
              @click="selectedPlan = 'pro'"
            >
              <div class="popular-badge">Most Popular</div>

              <div class="plan-header">
                <div>
                  <h3 class="plan-name">Pro</h3>
                  <div class="plan-price">$99<span>/mo</span></div>
                </div>
                <div v-if="selectedPlan === 'pro'" class="plan-selected">✓</div>
              </div>

              <ul class="plan-features">
                <li>Unlimited tables</li>
                <li>Up to 10 staff accounts</li>
                <li>Unlimited orders</li>
                <li>Full kitchen, cashier & waiter views</li>
                <li>Analytics & reports</li>
                <li>Promotions & discounts</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>

          <button
            class="btn-checkout"
            @click="goToCheckout"
            :disabled="!selectedPlan || checkoutLoading"
          >
            <span v-if="checkoutLoading" class="spinner" />
            Continue to Checkout →
          </button>

          <p class="secure-note">🔒 Secure payment • Cancel anytime</p>
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
  const { data } = await supabase.auth.getSession()
  console.log(data.session)
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

/*
async function goToCheckout() {
  if (!selectedPlan.value) return

  // Verify session before calling Edge Function
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    billingError.value = 'Your session has expired. Please log in again.'
    return
  }

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
      throw new Error('No checkout URL returned.')
    }
  } catch (err) {
    console.error('Checkout error:', err)
    billingError.value = 'Could not start checkout. Please try again.'
    checkoutLoading.value = false
  }
}
  */

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
  padding: 0 4px;
  max-width: 960px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.4px;
  margin: 0;
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.btn-save {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.16s;
  min-width: 140px;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Upgrade Banner */
.upgrade-banner {
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: var(--radius-panel);
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4ade80;
  font-size: 14px;
}

.banner-icon {
  font-size: 24px;
}

.banner-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #4ade80;
  font-size: 18px;
  cursor: pointer;
}

/* Loading */
.loading-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 3px;
}

/* Section Cards */
.section-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.section-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}

.section-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0;
}

.section-body {
  padding: 24px;
}

/* Logo Group */
.logo-group {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.logo-preview {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  border: 2px solid var(--color-border-medium);
  background: var(--color-bg-elevated);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  color: var(--color-text-muted);
  font-size: 40px;
}

.logo-actions {
  flex: 1;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s;
}

.btn-upload:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.btn-remove {
  margin-left: 12px;
  background: transparent;
  border: none;
  color: #ef4444;
  font-weight: 600;
  cursor: pointer;
}

.logo-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 8px;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 15px;
  transition: all 0.16s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.slug-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  overflow: hidden;
}

.slug-prefix {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  padding: 12px 14px;
  font-size: 14px;
  white-space: nowrap;
  border-right: 1px solid var(--color-border-medium);
}

.slug-input {
  flex: 1;
  border: none;
  border-radius: 0;
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
}

.warning {
  color: #facc15;
}

/* Preview */
.preview-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* Plan Card */
.plan-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.plan-card.plan-trial {
  border-color: var(--color-accent-border);
  background: var(--color-accent-muted);
}

.plan-card.plan-active {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
}

.plan-card.plan-expired {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.plan-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.plan-icon {
  font-size: 32px;
}

.plan-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.plan-meta {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.plan-badge {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
}

.plan-trial .plan-badge {
  background: var(--color-accent);
  color: white;
}
.plan-active .plan-badge {
  background: #4ade80;
  color: white;
}
.plan-expired .plan-badge {
  background: #ef4444;
  color: white;
}

/* Trial Card */
.trial-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-panel);
  padding: 20px;
  margin-bottom: 24px;
}

.trial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trial-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-accent);
}

.trial-expires {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.trial-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.timer-block {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 60px;
  text-align: center;
}

.timer-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.timer-unit {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.timer-colon {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.trial-progress {
  height: 8px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

.trial-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Expired Card */
.expired-card {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-panel);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.expired-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.expired-title {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
  margin: 0 0 4px;
}

.expired-text {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Billing Details */
.billing-details {
  margin-bottom: 24px;
}

.billing-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.billing-row:last-child {
  border-bottom: none;
}

.billing-key {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.billing-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.mono {
  font-family: monospace;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* Billing Actions */
.billing-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-upgrade {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
}

.btn-upgrade:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-portal {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.16s;
}

.btn-portal:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

/* Alerts */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.alert.success {
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.3);
  color: #4ade80;
}

/* Bottom Bar */
.bottom-bar {
  position: sticky;
  bottom: 0;
  background: var(--color-bg-base);
  border-top: 1px solid var(--color-border-subtle);
  padding: 16px 0;
  display: flex;
  gap: 12px;
  z-index: 10;
}

/* Plan Picker Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-plan-picker {
  background: var(--color-bg-surface);
  border-radius: var(--radius-panel);
  width: 100%;
  max-width: 620px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-float);
  overflow: hidden;
}

.modal-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: -12px 24px 24px;
}

.plan-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 0 24px 24px;
}

.plan-option {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
}

.plan-option:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-4px);
}

.plan-option.selected {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
}

.featured {
  border-color: var(--color-accent);
  background: rgba(200, 115, 58, 0.08);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.plan-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.plan-price {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
}

.plan-price span {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.plan-selected {
  width: 24px;
  height: 24px;
  background: var(--color-accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.plan-features li::before {
  content: '✓';
  color: var(--color-accent);
  margin-right: 8px;
  font-weight: 700;
}

.btn-checkout {
  width: 100%;
  margin: 0 24px 24px;
  padding: 14px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
}

.btn-checkout:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.secure-note {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
  margin: 0 24px 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid,
  .form-grid,
  .plan-options {
    grid-template-columns: 1fr;
  }

  .logo-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .bottom-bar {
    padding: 16px;
  }
}
</style>
