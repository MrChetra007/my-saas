<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('settings.title') }}</h1>
        <p class="page-subtitle">{{ $t('settings.subtitle') }}</p>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving || !isDirty">
        <Loader2 v-if="saving" :size="15" class="spin" />
        <Save v-else :size="15" />
        {{ saving ? $t('settings.saving') : $t('settings.save') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="32" class="spin" />
      <span>{{ $t('settings.loading') }}</span>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Upgrade success banner -->
      <div v-if="showUpgradedBanner" class="upgrade-banner">
        <PartyPopper :size="22" class="banner-icon" />
        <div>
          <strong>{{ $t('settings.welcomeUpgraded', { plan: planDisplayName }) }}</strong><br />
          {{ $t('settings.welcomeUpgraded', { plan: planDisplayName }) }}
        </div>
        <button class="banner-close" @click="showUpgradedBanner = false">
          <X :size="16" />
        </button>
      </div>

      <!-- Restaurant Profile -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <Store :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">{{ $t('settings.restaurantProfile') }}</h2>
              <p class="section-desc">{{ $t('settings.restaurantProfileDesc') }}</p>
            </div>
          </div>
        </div>
        <div class="section-body">
          <!-- Logo -->
          <div class="logo-group">
            <div class="logo-preview">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="logo-img" />
              <div v-else class="logo-placeholder"><ImageIcon :size="32" /></div>
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
                {{ uploadingLogo ? $t('settings.uploading') : (form.logoUrl ? $t('settings.replaceLogo') : $t('settings.uploadLogo')) }}
              </label>
              <button v-if="form.logoUrl" class="btn-remove" @click="removeLogo">
                <Trash2 :size="13" /> {{ $t('settings.removeLogo') }}
              </button>
              <p class="logo-hint">{{ $t('settings.logoHint') }}</p>
            </div>
          </div>

          <!-- Fields -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">{{ $t('settings.restaurantName') }} <span class="required">*</span></label>
              <input
                v-model="form.name"
                class="form-input"
                :placeholder="$t('settings.restaurantName')"
                @input="markDirty"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('settings.urlSlug') }}</label>
              <div class="slug-base-url">
                <span class="slug-row-label">{{ $t('settings.baseUrl') }}</span>
                <span class="slug-base-value">{{ appOrigin }}/order/</span>
              </div>
              <div class="slug-name-row">
                <span class="slug-row-label">{{ $t('settings.slugName') }}</span>
                <div class="slug-name-input-wrap" :class="{ 'slug-changed': slugChanged }">
                  <input
                    v-model="form.slug"
                    class="form-input slug-name-input"
                    :placeholder="$t('settings.slugName')"
                    @input="markDirty"
                  />
                  <span v-if="slugChanged" class="slug-changed-badge">{{ $t('settings.slugChanged') }}</span>
                </div>
              </div>
              <div class="slug-full-preview">
                {{ appOrigin }}/order/<strong>{{ form.slug || '…' }}</strong>
              </div>
              <p v-if="slugChanged" class="form-hint warning">
                <AlertTriangle :size="11" /> {{ $t('settings.slugWarning') }}
              </p>
              <p v-else class="form-hint">{{ $t('settings.slugPreview') }}</p>
            </div>

            <div class="form-group full-width">
              <label class="form-label">{{ $t('settings.address') }}</label>
              <input
                v-model="form.address"
                class="form-input"
                :placeholder="$t('settings.address')"
                @input="markDirty"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Settings -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <Globe :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">{{ $t('settings.regional') }}</h2>
              <p class="section-desc">{{ $t('settings.regionalDesc') }}</p>
            </div>
          </div>
        </div>
        <div class="section-body">
          <div class="form-grid">
            <!-- Language -->
            <div class="form-group">
              <label class="form-label">{{ $t('language.select') }}</label>
              <select v-model="selectedLanguage" class="form-select" @change="onLanguageChange">
                <option value="en">{{ $t('language.english') }}</option>
                <option value="kh">{{ $t('language.khmer') }}</option>
              </select>
            </div>

            <!-- Currency -->
            <div class="form-group">
              <label class="form-label">{{ $t('settings.currency') }}</label>
              <select v-model="form.currency" class="form-select" @change="onCurrencyChange">
                <option v-for="c in KNOWN_CURRENCIES" :key="c.code" :value="c.code">
                  {{ c.symbol }} {{ c.name }} ({{ c.code }})
                </option>
                <option value="OTHER">✏️ Other (custom)</option>
              </select>

              <!-- Custom currency input -->
              <div v-if="form.currency === 'OTHER'" class="custom-currency-wrap">
                <div class="custom-currency-field" :class="{ 'has-error': customCurrencyError }">
                  <input
                    v-model="customCurrency"
                    class="form-input custom-input"
                    placeholder="e.g. RM MYR"
                    @input="onCustomCurrencyInput"
                    @focus="tooltipVisible = true"
                    @blur="tooltipVisible = false"
                    autocomplete="off"
                  />
                  <transition name="tooltip-fade">
                    <div v-if="customCurrencyError && tooltipVisible" class="currency-tooltip">
                      <AlertCircle :size="12" />
                      {{ customCurrencyError }}
                      <div class="tooltip-arrow" />
                    </div>
                  </transition>
                </div>
                <p class="currency-format-hint">
                  Format: <strong>symbol · space · code</strong> — e.g.
                  <span class="hint-example">RM MYR</span>,
                  <span class="hint-example">R$ BRL</span>,
                  <span class="hint-example">₱ PHP</span>
                </p>
              </div>
            </div>

            <!-- Timezone -->
            <div class="form-group">
              <label class="form-label">{{ $t('settings.timezone') }}</label>
              <select v-model="form.timezone" class="form-select" @change="onTimezoneChange">
                <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                  {{ tz.label }}
                </option>
              </select>

              <!-- Warning when timezone is changed -->
              <div v-if="timezoneChanged" class="timezone-warning">
                <AlertTriangle :size="13" class="tz-warning-icon" />
                <div>
                  <strong>Heads up!</strong> Changing your timezone affects when your promotions and
                  happy hour discounts activate. Make sure your promotion time windows are still
                  correct after saving.
                </div>
              </div>

              <!-- Info hint when not changed -->
              <p v-else class="form-hint tz-info-hint">
                <Clock :size="11" />
                {{ $t('settings.timezoneInfo', { timezone: form.timezone }) }}
              </p>
            </div>
          </div>

          <!-- Price Preview -->
          <div class="preview-card">
            <span class="preview-label">{{ $t('settings.pricePreview') }}</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
        </div>
      </div>

      <!-- Subscription & Billing -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <CreditCard :size="18" class="section-icon" />
            <div>
              <h2 class="section-title">{{ $t('settings.subscription') }}</h2>
              <p class="section-desc">{{ $t('settings.subscriptionDesc') }}</p>
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
              <span class="trial-title"><Timer :size="14" /> {{ $t('settings.trialPeriod') }}</span>
              <span class="trial-expires">{{ $t('settings.ends') }} {{ formatDate(restaurant.trial_ends_at) }}</span>
            </div>
            <div class="trial-timer">
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.days }}</span>
                <span class="timer-unit">{{ $t('settings.days') }}</span>
              </div>
              <span class="timer-colon">:</span>
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.hours }}</span>
                <span class="timer-unit">{{ $t('settings.hrs') }}</span>
              </div>
              <span class="timer-colon">:</span>
              <div class="timer-block">
                <span class="timer-num">{{ trialTimeLeft.minutes }}</span>
                <span class="timer-unit">{{ $t('settings.min') }}</span>
              </div>
            </div>
            <div class="trial-progress">
              <div class="progress-fill" :style="{ width: `${trialPercent}%` }" />
            </div>
            <div class="trial-labels">
              <span>{{ $t('settings.started') }}</span>
              <span>{{ $t('settings.trialUsed', { used: trialTotalDays }) }}</span>
              <span>{{ $t('settings.ends') }}</span>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> {{ $t('settings.upgrade') }}
            </button>
          </div>

          <!-- Expired -->
          <div v-else-if="planStatus === 'expired'" class="expired-card">
            <div class="expired-icon-wrap"><AlertCircle :size="28" /></div>
            <div>
              <h3 class="expired-title">{{ $t('settings.planStatus.expired') }}</h3>
              <p class="expired-text">
                {{ $t('settings.planMeta.expired') }}<br />{{ $t('settings.choosePlan') }}
                to continue using Qrder.
              </p>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> {{ $t('settings.choosePlan') }}
            </button>
          </div>

          <!-- Starter upsell -->
          <div v-else-if="isStarterPlan" class="starter-card">
            <div class="starter-left">
              <div class="starter-icon-wrap"><Crown :size="18" /></div>
              <div>
                <div class="starter-title">{{ $t('settings.unlockPro') }}</div>
                <div class="starter-desc">{{ $t('settings.unlockProDesc') }}</div>
              </div>
            </div>
            <button class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" /> {{ $t('settings.upgradeToPro') }}
            </button>
          </div>

          <!-- Billing Details -->
          <div class="billing-details">
            <div class="billing-row">
              <span class="billing-key">{{ $t('settings.currentPlan') }}</span>
              <span class="billing-value">{{ planDisplayName }}</span>
            </div>
            <div class="billing-row" v-if="restaurant.trial_ends_at">
              <span class="billing-key">{{ $t('settings.trialEnds') }}</span>
              <span class="billing-value">{{ formatDate(restaurant.trial_ends_at) }}</span>
            </div>
            <div class="billing-row" v-if="restaurant.lemonsqueezy_customer_id">
              <span class="billing-key">{{ $t('settings.customerId') }}</span>
              <span class="billing-value mono">{{ restaurant.lemonsqueezy_customer_id }}</span>
            </div>
            <div class="billing-row" v-if="restaurant.lemonsqueezy_subscription_id">
              <span class="billing-key">{{ $t('settings.subscriptionId') }}</span>
              <span class="billing-value mono">{{ restaurant.lemonsqueezy_subscription_id }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="billing-actions">
            <button v-if="!isProPlan" class="btn-upgrade" @click="showPlanPicker = true">
              <Zap :size="14" />{{ isStarterPlan ? $t('settings.upgradeToPro') : $t('settings.choosePlan') }}
            </button>
            <a
              v-if="isProPlan && restaurant.customer_portal_url"
              :href="restaurant.customer_portal_url"
              target="_blank"
              class="btn-portal"
            >
              <ExternalLink :size="14" /> {{ $t('settings.manageBilling') }}
            </a>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="saveError" class="alert error"><AlertCircle :size="14" /> {{ saveError }}</div>
      <div v-if="saveSuccess" class="alert success">
        <CheckCircle2 :size="14" /> {{ saveSuccess }}
      </div>

      <!-- Sticky Bottom Bar -->
      <div class="bottom-bar" v-if="isDirty">
        <button class="btn-save" @click="handleSave" :disabled="saving">
          <Loader2 v-if="saving" :size="15" class="spin" />
          <Save v-else :size="15" />
          {{ saving ? $t('settings.saving') : $t('settings.save') }}
        </button>
        <button class="btn-discard" @click="discardChanges">
          <RotateCcw :size="14" /> {{ $t('settings.discard') }}
        </button>
      </div>
    </div>

    <!-- Plan Picker Modal -->
    <PlanPickerModal v-model="showPlanPicker" @checkout-error="(msg) => (saveError = msg)" />

    <!-- Slug Change Confirmation Modal -->
    <Teleport to="body">
      <div v-if="slugConfirmModal" class="modal-backdrop" @click.self="slugConfirmModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-header-icon"><AlertTriangle :size="20" /></div>
            <h2 class="modal-title">{{ $t('settings.slugConfirmTitle') }}</h2>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              {{ $t('settings.slugConfirmText', { old: savedSlug, new: form.slug }) }}
            </p>
            <div class="impact-list">
              <div class="impact-item">
                <span class="impact-icon impact-danger">✕</span>{{ $t('settings.slugImpact.qrStop') }}
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-danger">✕</span>{{ $t('settings.slugImpact.qrReprint') }}
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-ok">✓</span>{{ $t('settings.slugImpact.newQr') }}
              </div>
              <div class="impact-item">
                <span class="impact-icon impact-ok">✓</span>{{ $t('settings.slugImpact.history') }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="slugConfirmModal = false">{{ $t('settings.cancel') }}</button>
            <button class="btn-danger" @click="confirmAndSave">{{ $t('settings.yesChangeSlug') }}</button>
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
import { setLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'
import PlanPickerModal from '@/components/PlanPickerModal.vue'

const { t } = useI18n()

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

// ── Known currencies ─────────────────────────────────
const KNOWN_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
]
const KNOWN_CODES = KNOWN_CURRENCIES.map((c) => c.code)

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
const savedSlug = ref('')
const savedTimezone = ref('') // tracks the originally saved timezone
const appOrigin = window.location.origin
const selectedLanguage = ref('en')

// ── Custom currency ──────────────────────────────────
const customCurrency = ref('')
const customCurrencyError = ref('')
const tooltipVisible = ref(false)

function onCurrencyChange() {
  markDirty()
  if (form.value.currency !== 'OTHER') {
    customCurrency.value = ''
    customCurrencyError.value = ''
  } else {
    tooltipVisible.value = true
  }
}

function onLanguageChange() {
  markDirty()
}

function validateCustomCurrency(val) {
  const v = val.trim()
  if (!v) return 'Please enter your custom currency.'
  const spaceIndex = v.indexOf(' ')
  if (spaceIndex === -1) return 'Format: symbol · space · code — e.g. RM MYR'
  const symbol = v.slice(0, spaceIndex)
  const code = v.slice(spaceIndex + 1).trim()
  if (!symbol) return 'Symbol is missing — e.g. RM MYR'
  if (!code) return 'Currency code is missing — e.g. RM MYR'
  if (code !== code.toUpperCase())
    return `Code must be uppercase — use "${code.toUpperCase()}" not "${code}"`
  if (!/^[A-Z]{2,5}$/.test(code)) return 'Currency code must be 2–5 letters — e.g. MYR, BRL, PHP'
  return ''
}

function onCustomCurrencyInput() {
  customCurrencyError.value = validateCustomCurrency(customCurrency.value)
  tooltipVisible.value = !!customCurrencyError.value
  markDirty()
}

function parsedCustomSymbol(val) {
  const v = (val || customCurrency.value).trim()
  const spaceIndex = v.indexOf(' ')
  return spaceIndex !== -1 ? v.slice(0, spaceIndex) : v || '?'
}

const resolvedCurrency = computed(() => {
  if (form.value.currency === 'OTHER') return customCurrency.value.trim()
  return form.value.currency
})

// ── Timezone ──────────────────────────────────────────
const timezoneChanged = computed(() => form.value.timezone !== savedTimezone.value)

function onTimezoneChange() {
  markDirty()
}

// ── Snapshot / dirty ───────────────────────────────
let snapshot = ''
function takeSnapshot() {
  snapshot = JSON.stringify({
    form: form.value,
    customCurrency: customCurrency.value,
    language: selectedLanguage.value,
  })
  savedSlug.value = form.value.slug
  savedTimezone.value = form.value.timezone
}
function markDirty() {
  isDirty.value =
    JSON.stringify({
      form: form.value,
      customCurrency: customCurrency.value,
      language: selectedLanguage.value,
    }) !== snapshot
}

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
const planDisplayName = computed(
  () =>
    t(`settings.planStatus.${restaurant.value.plan}`) || t('settings.planStatus.expired'),
)
const planMeta = computed(() => {
  if (isProPlan.value) return t('settings.planMeta.pro')
  if (isStarterPlan.value) return t('settings.planMeta.starter')
  if (isOnTrial.value)
    return t('settings.planMeta.trial', {
      days: trialTimeLeft.value.days,
      hours: trialTimeLeft.value.hours,
    })
  return t('settings.planMeta.expired')
})
const planBadgeLabel = computed(() => {
  if (isProPlan.value) return t('settings.planStatus.pro')
  if (isStarterPlan.value) return t('settings.planStatus.starter')
  if (isOnTrial.value) return t('settings.planStatus.trial')
  return t('settings.planStatus.expired')
})

// ── Timezones ──────────────────────────────────────
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

// ── Currency preview ───────────────────────────────
const currencyPreview = computed(() => {
  const currency = form.value.currency
  if (currency === 'OTHER') {
    const err = validateCustomCurrency(customCurrency.value)
    if (err) return '—'
    const sym = parsedCustomSymbol()
    return `${sym} 1,234.50`
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(1234.5)
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
    const stored = data.currency || 'USD'

    form.value = {
      name: data.name || '',
      slug: data.slug || '',
      address: data.address || '',
      logoUrl: data.logo_url || '',
      timezone: data.timezone || 'UTC',
      currency: KNOWN_CODES.includes(stored) ? stored : 'OTHER',
    }

    if (!KNOWN_CODES.includes(stored)) {
      customCurrency.value = stored
    }
  }

  // Initialize language from user profile
  if (authStore.profile?.language) {
    selectedLanguage.value = authStore.profile.language
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
function handleSave() {
  if (!form.value.name.trim()) {
    saveError.value = 'Restaurant name is required.'
    return
  }

  if (form.value.currency === 'OTHER') {
    const err = validateCustomCurrency(customCurrency.value)
    if (err) {
      customCurrencyError.value = err
      tooltipVisible.value = true
      saveError.value = 'Please fix the currency format before saving.'
      return
    }
  }

  if (slugChanged.value) {
    slugConfirmModal.value = true
    return
  }
  saveSettings()
}

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
      currency: resolvedCurrency.value,
      timezone: form.value.timezone,
    })
    .eq('id', authStore.profile?.restaurant_id)

  if (error) {
    saveError.value = 'Failed to save: ' + error.message
  } else {
    // Save language preference to users table
    const { error: langError } = await supabase
      .from('users')
      .update({ language: selectedLanguage.value })
      .eq('id', authStore.profile?.id)

    if (langError) {
      console.error('Failed to save language:', langError)
    } else {
      setLocale(selectedLanguage.value)
      authStore.profile.language = selectedLanguage.value
    }

    const messages = []
    if (slugChanged.value) messages.push('Remember to reprint your QR codes!')
    if (timezoneChanged.value) messages.push('Check your promotion time windows are still correct.')
    saveSuccess.value = messages.length
      ? `Settings saved. ${messages.join(' ')}`
      : 'Settings saved successfully.'
    takeSnapshot()
    isDirty.value = false
    await authStore.fetchProfile()
    setTimeout(() => {
      saveSuccess.value = ''
    }, 5000)
  }
  saving.value = false
}

function discardChanges() {
  const snap = JSON.parse(snapshot)
  form.value = snap.form
  customCurrency.value = snap.customCurrency
  customCurrencyError.value = ''
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

/* Slug */
.slug-row-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  min-width: 72px;
  flex-shrink: 0;
}
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

/* ── Timezone warning ── */
.timezone-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 4px;
  padding: 12px 14px;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.25);
  border-radius: 8px;
  font-size: 13px;
  color: #facc15;
  line-height: 1.5;
}
.tz-warning-icon {
  flex-shrink: 0;
  margin-top: 1px;
}
.tz-info-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* ── Custom currency ── */
.custom-currency-wrap {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.custom-currency-field {
  position: relative;
}
.custom-input {
  width: 100%;
  box-sizing: border-box;
}
.custom-currency-field.has-error .custom-input {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
}
.currency-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-surface, #1e1e1e);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 50;
  pointer-events: none;
}
.tooltip-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: var(--color-bg-surface, #1e1e1e);
  border-right: 1px solid rgba(239, 68, 68, 0.4);
  border-bottom: 1px solid rgba(239, 68, 68, 0.4);
}
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
.currency-format-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}
.hint-example {
  font-family: monospace;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 11px;
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

/* ── Modal ── */
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
  .currency-tooltip {
    white-space: normal;
    max-width: 240px;
    text-align: center;
  }
}
</style>
