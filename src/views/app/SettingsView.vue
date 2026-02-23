<template>
  <div class="settings-page">
    <!-- ── Header ─────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your restaurant profile & preferences</p>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving || !isDirty">
        <Loader2 v-if="saving" :size="15" class="spin" />
        <Save v-else :size="15" />
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>

    <!-- ── Upgrade success banner ─────────────────── -->
    <div v-if="showUpgradedBanner" class="upgrade-banner">
      <PartyPopper :size="22" class="banner-icon" />
      <div>
        <strong>Welcome to {{ planDisplayName }}!</strong><br />
        Your subscription is now active. Enjoy full access.
      </div>
      <button class="banner-close" @click="showUpgradedBanner = false">
        <X :size="16" />
      </button>
    </div>

    <!-- ── Loading ────────────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="32" class="spin" />
      <span>Loading settings…</span>
    </div>

    <template v-else>
      <!-- ── Restaurant Profile ─────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <Store :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">Restaurant Profile</h2>
              <p class="section-desc">This information appears on your customer ordering page.</p>
            </div>
          </div>
        </div>

        <div class="section-body">
          <!-- Logo -->
          <div class="logo-group">
            <div class="logo-preview">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="logo-img" />
              <div v-else class="logo-placeholder">
                <ImageIcon :size="32" />
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
                <Loader2 v-if="uploadingLogo" :size="14" class="spin" />
                <Upload v-else :size="14" />
                {{ uploadingLogo ? 'Uploading…' : form.logoUrl ? 'Replace Logo' : 'Upload Logo' }}
              </label>
              <button v-if="form.logoUrl" class="btn-remove" @click="removeLogo">
                <Trash2 :size="13" /> Remove
              </button>
              <p class="logo-hint">Recommended: 512×512 PNG or JPG, max 2MB</p>
            </div>
          </div>

          <!-- Fields -->
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

              <!-- Read-only base URL row -->
              <div class="slug-base-url">
                <span class="slug-row-label">Base URL</span>
                <span class="slug-base-value">{{ appOrigin }}/order/</span>
              </div>

              <!-- Editable slug name row -->
              <div class="slug-name-row">
                <span class="slug-row-label">Slug name</span>
                <div class="slug-name-input-wrap" :class="{ 'slug-changed': slugChanged }">
                  <input
                    v-model="form.slug"
                    class="form-input slug-name-input"
                    placeholder="ember-oak"
                    @input="markDirty"
                  />
                  <span v-if="slugChanged" class="slug-changed-badge">changed</span>
                </div>
              </div>

              <!-- Full preview -->
              <div class="slug-full-preview">
                {{ appOrigin }}/order/<strong>{{ form.slug || '…' }}</strong>
              </div>

              <p v-if="slugChanged" class="form-hint warning">
                <AlertTriangle :size="11" />
                This will break all existing QR codes — you'll need to reprint them.
              </p>
              <p v-else class="form-hint">Customers reach your menu at this URL.</p>
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

      <!-- ── Regional Settings ──────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <Globe :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">Regional Settings</h2>
              <p class="section-desc">How prices, dates and times appear to customers.</p>
            </div>
          </div>
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
            <span class="preview-label">Price Preview</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
        </div>
      </div>

      <!-- ── Subscription & Billing ─────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <CreditCard :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">Subscription & Billing</h2>
              <p class="section-desc">Manage your plan and billing details.</p>
            </div>
          </div>
        </div>

        <div class="section-body">
          <!-- Plan Status Card -->
          <div class="plan-card" :class="`plan-${planStatus}`">
            <div class="plan-left">
              <div class="plan-icon-wrap">
                <Star v-if="isProPlan" :size="20" />
                <Clock v-else-if="isOnTrial" :size="20" />
                <LockIcon v-else :size="20" />
              </div>
              <div>
                <div class="plan-name">{{ planDisplayName }}</div>
                <div class="plan-meta">{{ planMeta }}</div>
              </div>
            </div>
            <span class="plan-badge" :class="planStatus">{{ planBadgeLabel }}</span>
          </div>

          <!-- Trial Countdown -->
          <div v-if="isOnTrial" class="trial-card">
            <div class="trial-header">
              <span class="trial-title"><Timer :size="14" /> Trial Period</span>
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
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> Upgrade Now
            </button>
          </div>

          <!-- Expired -->
          <div v-else-if="planStatus === 'expired'" class="expired-card">
            <div class="expired-icon-wrap"><AlertCircle :size="28" /></div>
            <div>
              <h3 class="expired-title">Trial Expired</h3>
              <p class="expired-text">
                Your trial ended on {{ formatDate(restaurant.trial_ends_at) }}.<br />
                Choose a plan to continue using Qrder.
              </p>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> Choose a Plan
            </button>
          </div>

          <!-- Starter upsell -->
          <div v-else-if="isStarterPlan" class="starter-card">
            <div class="starter-left">
              <div class="starter-icon-wrap"><Crown :size="18" /></div>
              <div>
                <div class="starter-title">Unlock Pro Features</div>
                <div class="starter-desc">Get Analytics, Promotions, unlimited tables & more.</div>
              </div>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> Upgrade to Pro
            </button>
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
            <button v-if="!isProPlan" class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" />
              {{ isStarterPlan ? 'Upgrade to Pro' : 'Choose a Plan' }}
            </button>
            <a
              v-if="isProPlan && restaurant.customer_portal_url"
              :href="restaurant.customer_portal_url"
              target="_blank"
              class="btn-portal"
            >
              <ExternalLink :size="14" /> Manage Billing
            </a>
          </div>
        </div>
      </div>

      <!-- ── Alerts ─────────────────────────────── -->
      <div v-if="saveError" class="alert error"><AlertCircle :size="14" /> {{ saveError }}</div>
      <div v-if="saveSuccess" class="alert success">
        <CheckCircle2 :size="14" /> {{ saveSuccess }}
      </div>

      <!-- ── Sticky Bottom Bar ───────────────────── -->
      <div class="bottom-bar" v-if="isDirty">
        <button class="btn-save" @click="handleSave" :disabled="saving">
          <Loader2 v-if="saving" :size="15" class="spin" />
          <Save v-else :size="15" />
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
        <button class="btn-discard" @click="discardChanges">
          <RotateCcw :size="14" /> Discard
        </button>
      </div>
    </template>

    <!-- ── Plan Picker Modal ───────────────────── -->
    <PlanPickerModal v-model="showPlanPicker" @checkout-error="(msg) => (saveError = msg)" />

    <!-- ── Slug Change Confirmation Modal ─────── -->
    <Teleport to="body">
      <div v-if="slugConfirmModal" class="modal-backdrop" @click.self="slugConfirmModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-header-icon">
              <AlertTriangle :size="20" />
            </div>
            <h2 class="modal-title">Change URL Slug?</h2>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              You're changing the slug from
              <code class="code-inline">{{ savedSlug }}</code> to
              <code class="code-inline code-new">{{ form.slug }}</code
              >.
            </p>
            <div class="impact-list">
              <div class="impact-item">
                <span class="impact-icon impact-danger">✕</span>
                All existing QR codes will stop working immediately
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-danger">✕</span>
                Any printed QR codes will need to be reprinted
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-ok">✓</span>
                New QR codes will be generated with the new URL
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-ok">✓</span>
                Order history remains intact
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="slugConfirmModal = false">Cancel</button>
            <button class="btn-danger" @click="confirmAndSave">Yes, change slug & save</button>
          </div>
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
import PlanPickerModal from '@/components/PlanPickerModal.vue'

import {
  Save,
  Loader2,
  X,
  PartyPopper,
  Store,
  ImageIcon,
  Upload,
  Trash2,
  Globe,
  CreditCard,
  Star,
  Clock,
  Lock,
  Crown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Timer,
  Zap,
  ExternalLink,
  RotateCcw,
} from 'lucide-vue-next'

const LockIcon = Lock

const authStore = useAuthStore()
const route = useRoute()

// ── UI state ───────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const isDirty = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const showPlanPicker = ref(false)
const showUpgradedBanner = ref(false)
const slugConfirmModal = ref(false)

const restaurant = ref({})
const form = ref({ name: '', slug: '', address: '', logoUrl: '', currency: 'USD', timezone: 'UTC' })

// Tracks the slug that is actually saved in the DB
const savedSlug = ref('')

// Dynamic origin so the slug prefix is always correct regardless of environment
const appOrigin = window.location.origin

// ── Snapshot / dirty ───────────────────────────────
let snapshot = ''
function takeSnapshot() {
  snapshot = JSON.stringify(form.value)
  // Always sync savedSlug when we take a fresh snapshot
  savedSlug.value = form.value.slug
}
function markDirty() {
  isDirty.value = JSON.stringify(form.value) !== snapshot
}

// True only when the slug field has been changed from its saved value
const slugChanged = computed(() => form.value.slug.trim() !== savedSlug.value.trim())

// ── Timer ──────────────────────────────────────────
const now = ref(new Date())
let timerInterval = null
function startTimer() {
  timerInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
}

// ── Plan computed ──────────────────────────────────
const isProPlan = computed(() => restaurant.value.plan === 'pro')
const isStarterPlan = computed(() => restaurant.value.plan === 'starter')
const isOnTrial = computed(() => {
  if (restaurant.value.plan !== 'trial') return false
  if (!restaurant.value.trial_ends_at) return false
  return new Date(restaurant.value.trial_ends_at) > now.value
})

const trialMsLeft = computed(() =>
  Math.max(0, new Date(restaurant.value.trial_ends_at) - now.value),
)
const trialTimeLeft = computed(() => {
  const t = trialMsLeft.value
  return {
    days: String(Math.floor(t / 86400000)).padStart(2, '0'),
    hours: String(Math.floor((t % 86400000) / 3600000)).padStart(2, '0'),
    minutes: String(Math.floor((t % 3600000) / 60000)).padStart(2, '0'),
  }
})
const trialTotalDays = computed(() => {
  if (!restaurant.value.trial_ends_at || !restaurant.value.created_at) return 0
  return Math.min(14, Math.floor((now.value - new Date(restaurant.value.created_at)) / 86400000))
})
const trialPercent = computed(() => Math.min(100, Math.round((trialTotalDays.value / 14) * 100)))

const planStatus = computed(() => {
  if (isProPlan.value) return 'active'
  if (isStarterPlan.value) return 'starter'
  if (isOnTrial.value) return 'trial'
  return 'expired'
})

const planDisplayName = computed(() => {
  const map = { trial: 'Trial', starter: 'Starter', pro: 'Pro' }
  return map[restaurant.value.plan] || 'Free'
})

const planMeta = computed(() => {
  if (isProPlan.value) return 'Full access — all features unlocked'
  if (isStarterPlan.value) return 'Limited access — upgrade to unlock all Pro features'
  if (isOnTrial.value)
    return `${trialTimeLeft.value.days}d ${trialTimeLeft.value.hours}h left in your trial`
  return 'Your trial has ended — choose a plan to continue'
})

const planBadgeLabel = computed(() => {
  if (isProPlan.value) return 'Pro'
  if (isStarterPlan.value) return 'Starter'
  if (isOnTrial.value) return 'Trial'
  return 'Expired'
})

// ── Static data ────────────────────────────────────
const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
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

// ── Fetch ──────────────────────────────────────────
async function fetchSettings() {
  loading.value = true
  const { data, error } = await supabase
    .from('restaurants')
    .select(
      'name, slug, address, logo_url, currency, timezone, plan, trial_ends_at, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, customer_portal_url, created_at',
    )
    .eq('id', authStore.profile?.restaurant_id)
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

// ── Logo upload ────────────────────────────────────
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
  const path = `${restaurantId}/logo.${file.name.split('.').pop()}`

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

// ── Save flow ──────────────────────────────────────
// If the slug changed, show the confirmation modal first.
// Otherwise save immediately.
function handleSave() {
  if (!form.value.name.trim()) {
    saveError.value = 'Restaurant name is required.'
    return
  }
  if (slugChanged.value) {
    slugConfirmModal.value = true
    return
  }
  saveSettings()
}

// Called from the confirmation modal "Yes" button
function confirmAndSave() {
  slugConfirmModal.value = false
  saveSettings()
}

async function saveSettings() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = ''

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
    .eq('id', authStore.profile?.restaurant_id)

  if (error) {
    saveError.value = 'Failed to save: ' + error.message
  } else {
    saveSuccess.value = slugChanged.value
      ? 'Settings saved. Remember to reprint your QR codes!'
      : 'Settings saved successfully.'
    takeSnapshot()
    isDirty.value = false
    await authStore.fetchProfile()
    setTimeout(() => {
      saveSuccess.value = ''
    }, 4000)
  }
  saving.value = false
}

function discardChanges() {
  form.value = JSON.parse(snapshot)
  isDirty.value = false
  saveError.value = ''
  saveSuccess.value = ''
}

// ── Lifecycle ──────────────────────────────────────
onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  await fetchSettings()
  startTimer()
  if (route.query.upgraded === 'true') {
    showUpgradedBanner.value = true
    await fetchSettings()
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

.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Header ── */
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

/* ── Buttons ── */
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
  justify-content: center;
}
.btn-save:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-discard {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-discard:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 11px 22px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-upgrade:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-portal {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 11px 22px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.16s;
}
.btn-portal:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-danger:hover {
  background: #dc2626;
}

/* ── Banner ── */
.upgrade-banner {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: var(--radius-panel);
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #4ade80;
  font-size: 14px;
}
.banner-icon {
  flex-shrink: 0;
}
.banner-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #4ade80;
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.14s;
}
.banner-close:hover {
  opacity: 1;
}

/* ── Loading ── */
.loading-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  gap: 16px;
}

/* ── Section Cards ── */
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
.section-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.section-icon {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 3px;
}
.section-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 3px;
}
.section-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin: 0;
}
.section-body {
  padding: 24px;
}

/* ── Logo ── */
.logo-group {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-subtle);
}
.logo-preview {
  width: 96px;
  height: 96px;
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
}
.logo-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-pill);
  font-size: 13px;
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  opacity: 0.8;
  transition: opacity 0.14s;
}
.btn-remove:hover {
  opacity: 1;
}
.logo-hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ── Form ── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
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
  padding: 11px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  transition: all 0.16s;
  font-family: inherit;
}
.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

/* Slug field — split into two rows */
.slug-row-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  min-width: 72px;
  flex-shrink: 0;
}

/* Row 1: read-only base URL */
.slug-base-url {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  margin-bottom: 8px;
}
.slug-base-value {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: monospace;
  word-break: break-all;
}

/* Row 2: editable slug name */
.slug-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.slug-name-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  overflow: hidden;
  transition:
    border-color 0.16s,
    box-shadow 0.16s;
}
.slug-name-input-wrap:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}
.slug-name-input-wrap.slug-changed {
  border-color: #facc15;
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.12);
}
.slug-name-input {
  flex: 1;
  border: none !important;
  box-shadow: none !important;
  background: transparent;
}
.slug-name-input:focus {
  outline: none;
  box-shadow: none !important;
}
.slug-changed-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #facc15;
  background: rgba(250, 204, 21, 0.12);
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  margin-right: 8px;
  flex-shrink: 0;
}

/* Full URL preview */
.slug-full-preview {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: monospace;
  word-break: break-all;
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border-subtle);
}
.slug-full-preview strong {
  color: var(--color-accent);
}

.form-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.warning {
  color: #facc15;
}

/* ── Preview ── */
.preview-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 11px 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.preview-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* ── Plan Card ── */
.plan-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.plan-card.plan-trial {
  border-color: var(--color-accent-border);
  background: var(--color-accent-muted);
}
.plan-card.plan-active {
  border-color: rgba(74, 222, 128, 0.35);
  background: rgba(74, 222, 128, 0.07);
}
.plan-card.plan-starter {
  border-color: rgba(200, 115, 58, 0.25);
  background: rgba(200, 115, 58, 0.05);
}
.plan-card.plan-expired {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.07);
}
.plan-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.plan-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--color-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  flex-shrink: 0;
  border: 1px solid var(--color-border-subtle);
}
.plan-card.plan-active .plan-icon-wrap {
  color: #4ade80;
}
.plan-card.plan-expired .plan-icon-wrap {
  color: #ef4444;
}
.plan-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 3px;
}
.plan-meta {
  color: var(--color-text-secondary);
  font-size: 13px;
}
.plan-badge {
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.03em;
}
.plan-badge.trial {
  background: var(--color-accent);
  color: white;
}
.plan-badge.active {
  background: #4ade80;
  color: #052e16;
}
.plan-badge.starter {
  background: rgba(200, 115, 58, 0.15);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-border);
}
.plan-badge.expired {
  background: #ef4444;
  color: white;
}

/* ── Trial Card ── */
.trial-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-panel);
  padding: 20px;
  margin-bottom: 20px;
}
.trial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.trial-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent);
}
.trial-expires {
  font-size: 12px;
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
  padding: 8px 14px;
  min-width: 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.timer-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}
.timer-unit {
  font-size: 10px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 3px;
}
.timer-colon {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-muted);
}
.trial-progress {
  height: 6px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.5s ease;
}
.trial-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

/* ── Expired card ── */
.expired-card {
  background: rgba(239, 68, 68, 0.07);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-panel);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.expired-icon-wrap {
  color: #ef4444;
  flex-shrink: 0;
}
.expired-title {
  font-size: 17px;
  font-weight: 700;
  color: #ef4444;
  margin: 0 0 4px;
}
.expired-text {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* ── Starter upsell ── */
.starter-card {
  background: rgba(200, 115, 58, 0.05);
  border: 1px solid var(--color-accent-border);
  border-radius: var(--radius-panel);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.starter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.starter-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.starter-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}
.starter-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ── Billing ── */
.billing-details {
  margin-bottom: 20px;
}
.billing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}
.billing-row:last-child {
  border-bottom: none;
}
.billing-key {
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
}
.billing-value {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 14px;
}
.mono {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-text-muted);
}
.billing-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Alerts ── */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 16px;
}
.alert.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}
.alert.success {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.25);
  color: #4ade80;
}

/* ── Bottom bar ── */
.bottom-bar {
  position: sticky;
  bottom: 0;
  background: var(--color-bg-base);
  border-top: 1px solid var(--color-border-subtle);
  padding: 14px 0;
  display: flex;
  gap: 10px;
  z-index: 10;
}

/* ── Slug Confirm Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  background: var(--color-bg-surface);
  border-radius: var(--radius-panel);
  width: 100%;
  max-width: 460px;
  box-shadow: var(--shadow-float);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
}
.modal-sm {
  max-width: 420px;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: rgba(250, 204, 21, 0.06);
  border-bottom-color: rgba(250, 204, 21, 0.18);
}
.modal-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.modal-body {
  padding: 24px;
}
.modal-text {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.code-inline {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 5px;
  padding: 2px 7px;
  font-family: monospace;
  font-size: 13px;
  color: var(--color-text-primary);
}
.code-new {
  color: var(--color-accent);
  border-color: var(--color-accent-border);
}

/* Impact list */
.impact-list {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.impact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.impact-icon {
  font-size: 13px;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-style: normal;
}
.impact-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.impact-ok {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .logo-group {
    flex-direction: column;
    align-items: flex-start;
  }
  .expired-card {
    flex-direction: column;
  }
  .starter-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .slug-prefix {
    font-size: 11px;
  }
}
</style>
