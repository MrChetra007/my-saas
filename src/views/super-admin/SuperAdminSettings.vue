<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('superAdmin.settings.title') }}</h2>
        <p class="page-sub">{{ $t('superAdmin.settings.subtitle') }}</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- ── Profile ──────────────────────────────────── -->
      <div class="panel">
        <div class="panel-header">
          <span v-html="icons.user" class="panel-icon" />
          <div>
            <h3 class="panel-title">{{ $t('superAdmin.settings.profile.title') }}</h3>
            <p class="panel-desc">{{ $t('superAdmin.settings.profile.desc') }}</p>
          </div>
        </div>

        <div class="panel-body">
          <div class="avatar-row">
            <div class="big-avatar">{{ initials }}</div>
            <div>
              <div class="avatar-name">{{ authStore.profile?.full_name || $t('superAdmin.settings.profile.fallbackName') }}</div>
              <div class="avatar-email">{{ authStore.user?.email }}</div>
              <span class="super-badge">{{ $t('superAdmin.settings.profile.badge') }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.profile.displayNameLabel') }}</label>
            <input
              v-model="profileForm.full_name"
              class="form-input"
              :placeholder="$t('superAdmin.settings.profile.displayNamePlaceholder')"
              type="text"
            />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.profile.emailLabel') }}</label>
            <input
              v-model="profileForm.email"
              class="form-input"
              :placeholder="$t('superAdmin.settings.profile.emailPlaceholder')"
              type="email"
            />
            <div class="form-hint">{{ $t('superAdmin.settings.profile.emailHint') }}</div>
          </div>
        </div>

        <div class="panel-footer">
          <div v-if="profileMsg" class="save-msg" :class="profileMsg.type">
            <span v-html="profileMsg.type === 'success' ? icons.check : icons.error" />
            {{ profileMsg.text }}
          </div>
          <button class="btn-primary" :disabled="profileSaving" @click="saveProfile">
            {{ profileSaving ? $t('superAdmin.settings.profile.saving') : $t('superAdmin.settings.profile.save') }}
          </button>
        </div>
      </div>

      <!-- ── Password ──────────────────────────────────── -->
      <div class="panel">
        <div class="panel-header">
          <span v-html="icons.lock" class="panel-icon" />
          <div>
            <h3 class="panel-title">{{ $t('superAdmin.settings.password.title') }}</h3>
            <p class="panel-desc">{{ $t('superAdmin.settings.password.desc') }}</p>
          </div>
        </div>

        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.password.newPasswordLabel') }}</label>
            <div class="input-wrap">
              <input
                v-model="passwordForm.password"
                :type="showPw ? 'text' : 'password'"
                class="form-input"
                :placeholder="$t('superAdmin.settings.password.newPasswordPlaceholder')"
              />
              <button
                class="input-toggle"
                @click="showPw = !showPw"
                v-html="showPw ? icons.eyeOff : icons.eye"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.password.confirmLabel') }}</label>
            <div class="input-wrap">
              <input
                v-model="passwordForm.confirm"
                :type="showPwConfirm ? 'text' : 'password'"
                class="form-input"
                :placeholder="$t('superAdmin.settings.password.confirmPlaceholder')"
              />
              <button
                class="input-toggle"
                @click="showPwConfirm = !showPwConfirm"
                v-html="showPwConfirm ? icons.eyeOff : icons.eye"
              />
            </div>
          </div>
          <div
            v-if="
              passwordForm.password &&
              passwordForm.confirm &&
              passwordForm.password !== passwordForm.confirm
            "
            class="mismatch-warn"
          >
            <span v-html="icons.warn" /> {{ $t('superAdmin.settings.password.mismatch') }}
          </div>
        </div>

        <div class="panel-footer">
          <div v-if="passwordMsg" class="save-msg" :class="passwordMsg.type">
            <span v-html="passwordMsg.type === 'success' ? icons.check : icons.error" />
            {{ passwordMsg.text }}
          </div>
          <button
            class="btn-primary"
            :disabled="passwordSaving || !passwordValid"
            @click="savePassword"
          >
            {{ passwordSaving ? $t('superAdmin.settings.password.saving') : $t('superAdmin.settings.password.update') }}
          </button>
        </div>
      </div>

      <!-- ── Pricing config ────────────────────────────── -->
      <div class="panel panel-wide">
        <div class="panel-header">
          <span v-html="icons.dollar" class="panel-icon" />
          <div>
            <h3 class="panel-title">{{ $t('superAdmin.settings.pricing.title') }}</h3>
            <p class="panel-desc">
              {{ $t('superAdmin.settings.pricing.desc') }}
            </p>
          </div>
        </div>

        <div class="panel-body">
          <!-- Pricing table -->
          <div class="pricing-table">
            <!-- Header -->
            <div class="pricing-header">
              <div class="pricing-cell plan-col"></div>
              <div class="pricing-cell">
                <span class="billing-pill manual">{{ $t('superAdmin.settings.pricing.manualPill') }}</span>
                <p class="billing-desc">{{ $t('superAdmin.settings.pricing.manualDesc') }}</p>
              </div>
              <div class="pricing-cell">
                <span class="billing-pill ls">{{ $t('superAdmin.settings.pricing.lsPill') }}</span>
                <p class="billing-desc">{{ $t('superAdmin.settings.pricing.lsDesc') }}</p>
              </div>
            </div>

            <!-- Starter row -->
            <div class="pricing-row">
              <div class="pricing-cell plan-col">
                <span class="plan-pill starter">{{ $t('superAdmin.settings.pricing.starterPill') }}</span>
              </div>
              <div class="pricing-cell">
                <div class="input-prefix-wrap">
                  <span class="input-prefix input-prefix-text">{{ $t('superAdmin.settings.pricing.dollarPrefix') }}</span>
                  <input
                    v-model.number="appForm.starter_price_manual"
                    class="form-input with-prefix"
                    type="number"
                    min="0"
                    :placeholder="$t('superAdmin.settings.pricing.placeholder', { value: '15' })"
                  />
                  <span class="input-suffix">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span>
                </div>
              </div>
              <div class="pricing-cell">
                <div class="input-prefix-wrap">
                  <span class="input-prefix input-prefix-text">{{ $t('superAdmin.settings.pricing.dollarPrefix') }}</span>
                  <input
                    v-model.number="appForm.starter_price_ls"
                    class="form-input with-prefix"
                    type="number"
                    min="0"
                    :placeholder="$t('superAdmin.settings.pricing.placeholder', { value: '49' })"
                  />
                  <span class="input-suffix">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span>
                </div>
              </div>
            </div>

            <!-- Pro row -->
            <div class="pricing-row">
              <div class="pricing-cell plan-col">
                <span class="plan-pill pro">{{ $t('superAdmin.settings.pricing.proPill') }}</span>
              </div>
              <div class="pricing-cell">
                <div class="input-prefix-wrap">
                  <span class="input-prefix input-prefix-text">{{ $t('superAdmin.settings.pricing.dollarPrefix') }}</span>
                  <input
                    v-model.number="appForm.pro_price_manual"
                    class="form-input with-prefix"
                    type="number"
                    min="0"
                    :placeholder="$t('superAdmin.settings.pricing.placeholder', { value: '25' })"
                  />
                  <span class="input-suffix">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span>
                </div>
              </div>
              <div class="pricing-cell">
                <div class="input-prefix-wrap">
                  <span class="input-prefix input-prefix-text">{{ $t('superAdmin.settings.pricing.dollarPrefix') }}</span>
                  <input
                    v-model.number="appForm.pro_price_ls"
                    class="form-input with-prefix"
                    type="number"
                    min="0"
                    :placeholder="$t('superAdmin.settings.pricing.placeholder', { value: '99' })"
                  />
                  <span class="input-suffix">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview bar -->
          <div class="config-preview">
            <div class="preview-item">
              <span class="preview-label">{{ $t('superAdmin.settings.pricing.preview.starterManual') }}</span>
              <span class="preview-value"
                >{{ $t('superAdmin.settings.pricing.dollarPrefix') }}{{ appForm.starter_price_manual }}<span class="preview-unit">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span></span
              >
            </div>
            <div class="preview-divider" />
            <div class="preview-item">
              <span class="preview-label">{{ $t('superAdmin.settings.pricing.preview.proManual') }}</span>
              <span class="preview-value"
                >{{ $t('superAdmin.settings.pricing.dollarPrefix') }}{{ appForm.pro_price_manual }}<span class="preview-unit">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span></span
              >
            </div>
            <div class="preview-divider" />
            <div class="preview-item">
              <span class="preview-label">{{ $t('superAdmin.settings.pricing.preview.starterLs') }}</span>
              <span class="preview-value"
                >{{ $t('superAdmin.settings.pricing.dollarPrefix') }}{{ appForm.starter_price_ls }}<span class="preview-unit">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span></span
              >
            </div>
            <div class="preview-divider" />
            <div class="preview-item">
              <span class="preview-label">{{ $t('superAdmin.settings.pricing.preview.proLs') }}</span>
              <span class="preview-value"
                >{{ $t('superAdmin.settings.pricing.dollarPrefix') }}{{ appForm.pro_price_ls }}<span class="preview-unit">{{ $t('superAdmin.settings.pricing.perMonthSuffix') }}</span></span
              >
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <div v-if="pricingMsg" class="save-msg" :class="pricingMsg.type">
            <span v-html="pricingMsg.type === 'success' ? icons.check : icons.error" />
            {{ pricingMsg.text }}
          </div>
          <button class="btn-primary" :disabled="pricingSaving" @click="savePricing">
            {{ pricingSaving ? $t('superAdmin.settings.pricing.saving') : $t('superAdmin.settings.pricing.save') }}
          </button>
        </div>
      </div>

      <!-- ── App-wide settings ─────────────────────────── -->
      <div class="panel panel-wide">
        <div class="panel-header">
          <span v-html="icons.settings" class="panel-icon" />
          <div>
            <h3 class="panel-title">{{ $t('superAdmin.settings.appConfig.title') }}</h3>
            <p class="panel-desc">{{ $t('superAdmin.settings.appConfig.desc') }}</p>
          </div>
        </div>

        <div class="panel-body two-col">
          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.appConfig.trialDaysLabel') }}</label>
            <div class="input-prefix-wrap">
              <span class="input-prefix" v-html="icons.calendar" />
              <input
                v-model.number="appForm.trial_days"
                class="form-input with-prefix"
                type="number"
                min="1"
                max="365"
              />
            </div>
            <div class="form-hint">{{ $t('superAdmin.settings.appConfig.trialDaysHint') }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('superAdmin.settings.appConfig.warningDaysLabel') }}</label>
            <div class="input-prefix-wrap">
              <span class="input-prefix" v-html="icons.clock" />
              <input
                v-model.number="appForm.expiry_warning_days"
                class="form-input with-prefix"
                type="number"
                min="1"
                max="60"
              />
            </div>
            <div class="form-hint">{{ $t('superAdmin.settings.appConfig.warningDaysHint') }}</div>
          </div>
        </div>

        <div class="panel-footer">
          <div v-if="appMsg" class="save-msg" :class="appMsg.type">
            <span v-html="appMsg.type === 'success' ? icons.check : icons.error" />
            {{ appMsg.text }}
          </div>
          <button class="btn-primary" :disabled="appSaving" @click="saveAppSettings">
            {{ appSaving ? $t('superAdmin.settings.appConfig.saving') : $t('superAdmin.settings.appConfig.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

// ── Profile ────────────────────────────────────────────
const profileSaving = ref(false)
const profileMsg = ref(null)
const profileForm = ref({ full_name: '', email: '' })

// ── Password ───────────────────────────────────────────
const passwordSaving = ref(false)
const passwordMsg = ref(null)
const showPw = ref(false)
const showPwConfirm = ref(false)
const passwordForm = ref({ password: '', confirm: '' })
const passwordValid = computed(
  () =>
    passwordForm.value.password.length >= 8 &&
    passwordForm.value.password === passwordForm.value.confirm,
)

// ── Pricing + App settings ─────────────────────────────
// All stored in localStorage under one key
// To persist to DB later: swap localStorage calls for supabase.from('app_settings')
const pricingSaving = ref(false)
const pricingMsg = ref(null)
const appSaving = ref(false)
const appMsg = ref(null)

const APP_SETTINGS_KEY = 'sa_app_settings'

const appForm = ref({
  // Manual pricing (cash / bank transfer — you handle manually)
  starter_price_manual: 15,
  pro_price_manual: 25,
  // LemonSqueezy pricing (auto billing — customer pays online)
  starter_price_ls: 49,
  pro_price_ls: 99,
  // General
  trial_days: 14,
  expiry_warning_days: 14,
})

// ── Initials ───────────────────────────────────────────
const initials = computed(() => {
  const name = authStore.profile?.full_name || ''
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || t('superAdmin.settings.fallbackInitials')
  )
})

// ── Save profile ───────────────────────────────────────
async function saveProfile() {
  profileSaving.value = true
  profileMsg.value = null
  try {
    const { error: dbErr } = await supabase
      .from('users')
      .update({ full_name: profileForm.value.full_name })
      .eq('id', authStore.user.id)
    if (dbErr) throw dbErr

    if (profileForm.value.email !== authStore.user?.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: profileForm.value.email })
      if (emailErr) throw emailErr
      profileMsg.value = {
        type: 'success',
        text: t('superAdmin.settings.profile.successEmail'),
      }
    } else {
      profileMsg.value = { type: 'success', text: t('superAdmin.settings.profile.success') }
    }

    await authStore.fetchProfile()
    setTimeout(() => {
      profileMsg.value = null
    }, 4000)
  } catch (err) {
    profileMsg.value = { type: 'error', text: err.message }
  } finally {
    profileSaving.value = false
  }
}

// ── Save password ──────────────────────────────────────
async function savePassword() {
  if (!passwordValid.value) return
  passwordSaving.value = true
  passwordMsg.value = null
  try {
    const { error } = await supabase.auth.updateUser({ password: passwordForm.value.password })
    if (error) throw error
    passwordMsg.value = { type: 'success', text: t('superAdmin.settings.password.success') }
    passwordForm.value = { password: '', confirm: '' }
    setTimeout(() => {
      passwordMsg.value = null
    }, 4000)
  } catch (err) {
    passwordMsg.value = { type: 'error', text: err.message }
  } finally {
    passwordSaving.value = false
  }
}

// ── Save pricing ───────────────────────────────────────
async function savePricing() {
  pricingSaving.value = true
  pricingMsg.value = null
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appForm.value))
    pricingMsg.value = { type: 'success', text: t('superAdmin.settings.pricing.success') }
    setTimeout(() => {
      pricingMsg.value = null
    }, 3000)
  } catch {
    pricingMsg.value = { type: 'error', text: t('superAdmin.settings.pricing.error') }
  } finally {
    pricingSaving.value = false
  }
}

// ── Save app settings ──────────────────────────────────
async function saveAppSettings() {
  appSaving.value = true
  appMsg.value = null
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appForm.value))
    appMsg.value = { type: 'success', text: t('superAdmin.settings.appConfig.success') }
    setTimeout(() => {
      appMsg.value = null
    }, 3000)
  } catch {
    appMsg.value = { type: 'error', text: t('superAdmin.settings.appConfig.error') }
  } finally {
    appSaving.value = false
  }
}

// ── Load on mount ──────────────────────────────────────
onMounted(() => {
  profileForm.value.full_name = authStore.profile?.full_name || ''
  profileForm.value.email = authStore.user?.email || ''

  const saved = localStorage.getItem(APP_SETTINGS_KEY)
  if (saved) {
    try {
      Object.assign(appForm.value, JSON.parse(saved))
    } catch {}
  }
})

// ── Icons ──────────────────────────────────────────────
const icons = {
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  dollar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warn: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
  max-width: 900px;
}

/* ── Header ─────────────────────────────────────────── */
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1917;
  margin: 0 0 3px;
  letter-spacing: -0.3px;
}
.page-sub {
  font-size: 13px;
  color: #a8a49e;
  margin: 0;
}

/* ── Grid ───────────────────────────────────────────── */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── Panel ──────────────────────────────────────────── */
.panel {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-wide {
  grid-column: 1 / -1;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 0;
}
.panel-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: #fff7ed;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f97316;
}
.panel-title {
  font-size: 14px;
  font-weight: 650;
  color: #1a1917;
  margin: 0 0 3px;
}
.panel-desc {
  font-size: 12.5px;
  color: #a8a49e;
  margin: 0;
}

.panel-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}
.panel-body.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #f0ede8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Avatar row ─────────────────────────────────────── */
.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #fafaf9;
  border-radius: 10px;
  border: 1px solid #f0ede8;
}
.big-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 12px;
  background: #f97316;
  color: white;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-name {
  font-size: 14px;
  font-weight: 650;
  color: #1a1917;
  margin-bottom: 2px;
}
.avatar-email {
  font-size: 12px;
  color: #a8a49e;
  margin-bottom: 6px;
}
.super-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: #fff7ed;
  color: #c2410c;
}

/* ── Form ───────────────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #3d3d3a;
}
.form-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-family: inherit;
  color: #1a1917;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: #f97316;
}
.form-hint {
  font-size: 11.5px;
  color: #a8a49e;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #a8a49e;
  cursor: pointer;
  display: flex;
  padding: 0;
  transition: color 0.15s;
}
.input-toggle:hover {
  color: #6b6963;
}

.input-prefix-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-prefix {
  position: absolute;
  left: 11px;
  color: #a8a49e;
  display: flex;
  pointer-events: none;
}
.input-prefix-text {
  font-size: 14px;
  font-weight: 600;
  color: #a8a49e;
}
.input-suffix {
  position: absolute;
  right: 10px;
  font-size: 12px;
  color: #a8a49e;
  font-weight: 500;
  pointer-events: none;
}
.form-input.with-prefix {
  padding-left: 28px;
  padding-right: 36px;
}

/* ── Password mismatch ──────────────────────────────── */
.mismatch-warn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #e11d48;
  padding: 8px 10px;
  background: #fff1f2;
  border-radius: 8px;
}

/* ── Pricing table ──────────────────────────────────── */
.pricing-table {
  border: 1px solid #e8e6e1;
  border-radius: 12px;
  overflow: hidden;
}

.pricing-header {
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  background: #fafaf9;
  border-bottom: 1px solid #e8e6e1;
}

.pricing-row {
  display: grid;
  grid-template-columns: 120px 1fr 1fr;
  border-bottom: 1px solid #f0ede8;
}
.pricing-row:last-child {
  border-bottom: none;
}
.pricing-row:hover {
  background: #fafaf9;
}

.pricing-cell {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.plan-col {
  border-right: 1px solid #e8e6e1;
  background: #fafaf9;
}

.billing-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
}
.billing-pill.manual {
  background: #f0fdf4;
  color: #15803d;
}
.billing-pill.ls {
  background: #fff7ed;
  color: #c2410c;
}

.billing-desc {
  font-size: 11.5px;
  color: #a8a49e;
  margin: 0;
  line-height: 1.4;
}

.plan-pill {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-block;
  width: fit-content;
}
.plan-pill.starter {
  background: #eff6ff;
  color: #2563eb;
}
.plan-pill.pro {
  background: #fdf4ff;
  color: #9333ea;
}

/* ── Config preview ─────────────────────────────────── */
.config-preview {
  display: flex;
  align-items: center;
  gap: 0;
  background: #fafaf9;
  border: 1px solid #f0ede8;
  border-radius: 10px;
  overflow: hidden;
}
.preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 16px;
}
.preview-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.preview-value {
  font-size: 16px;
  font-weight: 750;
  color: #1a1917;
  letter-spacing: -0.3px;
}
.preview-unit {
  font-size: 11px;
  font-weight: 500;
  color: #a8a49e;
  margin-left: 1px;
}
.preview-divider {
  width: 1px;
  background: #f0ede8;
  align-self: stretch;
}

/* ── Save message ───────────────────────────────────── */
.save-msg {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 12px;
  border-radius: 8px;
  flex: 1;
}
.save-msg.success {
  background: #f0fdf4;
  color: #15803d;
}
.save-msg.error {
  background: #fff1f2;
  color: #e11d48;
}

/* ── Button ─────────────────────────────────────────── */
.btn-primary {
  height: 36px;
  padding: 0 18px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) {
  background: #ea6c10;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .panel-wide {
    grid-column: 1;
  }
  .panel-body.two-col {
    grid-template-columns: 1fr;
  }
  .config-preview {
    flex-direction: column;
  }
  .preview-divider {
    width: auto;
    height: 1px;
  }
  .pricing-header,
  .pricing-row {
    grid-template-columns: 90px 1fr 1fr;
  }
}
</style>
