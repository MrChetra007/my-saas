<template>
  <div class="panel panel-wide">
    <div class="panel-header">
      <span v-html="icons.khqr" class="panel-icon" />
      <div>
        <h3 class="panel-title">{{ $t('superAdmin.platformSettings.title') }}</h3>
        <p class="panel-desc">{{ $t('superAdmin.platformSettings.desc') }}</p>
      </div>
    </div>

    <div class="panel-body">
      <div class="form-group">
        <label class="form-label">{{ $t('superAdmin.platformSettings.bakongIdLabel') }}</label>
        <div class="input-prefix-wrap">
          <span class="input-prefix input-prefix-text">@</span>
          <input
            v-model="form.bakong_account_id"
            class="form-input with-prefix"
            :placeholder="$t('superAdmin.platformSettings.bakongIdPlaceholder')"
            type="text"
          />
        </div>
        <div class="form-hint">{{ $t('superAdmin.platformSettings.bakongIdHint') }}</div>
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('superAdmin.platformSettings.merchantNameLabel') }}</label>
        <input
          v-model="form.merchant_name"
          class="form-input"
          :placeholder="$t('superAdmin.platformSettings.merchantNamePlaceholder')"
          type="text"
        />
      </div>

      <div class="form-group">
        <label class="form-label">{{ $t('superAdmin.platformSettings.merchantCityLabel') }}</label>
        <input
          v-model="form.merchant_city"
          class="form-input"
          :placeholder="$t('superAdmin.platformSettings.merchantCityPlaceholder')"
          type="text"
        />
      </div>

      <!-- KHQR.dev section separator -->
      <div class="section-divider">
        <span>KHQR.dev Automated Payment</span>
      </div>

      <!-- KHQR.dev API Token -->
      <div class="form-group">
        <label class="form-label">KHQR.dev API Token <span class="badge-required">required</span></label>
        <div class="input-secret-wrap">
          <input
            v-model="form.khqrdev_token"
            :type="showToken ? 'text' : 'password'"
            class="form-input"
            placeholder="Paste your KHQR.dev Bearer token…"
            autocomplete="off"
          />
          <button type="button" class="input-eye-btn" @click="showToken = !showToken">
            <svg v-if="!showToken" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
        <div class="form-hint">From your KHQR.dev store dashboard → API tab. Starts with <code>RBK_</code></div>
      </div>

      <!-- KHQR.dev Webhook Secret -->
      <div class="form-group">
        <label class="form-label">KHQR.dev Webhook Secret <span class="badge-required">required</span></label>
        <div class="input-secret-wrap">
          <input
            v-model="form.khqrdev_webhook_secret"
            :type="showWebhookSecret ? 'text' : 'password'"
            class="form-input"
            placeholder="Paste your KHQR.dev Webhook Secret…"
            autocomplete="off"
          />
          <button type="button" class="input-eye-btn" @click="showWebhookSecret = !showWebhookSecret">
            <svg v-if="!showWebhookSecret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
        <div class="form-hint">From your KHQR.dev store dashboard → Webhook tab.</div>
      </div>

      <!-- Webhook URL (read-only, copy) -->
      <div class="form-group">
        <label class="form-label">Your Webhook URL <span class="badge-info">set this in KHQR.dev dashboard</span></label>
        <div class="webhook-url-row">
          <code class="webhook-url-code">{{ webhookUrl }}</code>
          <button type="button" class="btn-copy" @click="copyWebhookUrl">
            <svg v-if="!copied" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <div class="form-hint">Paste this URL as your store's Webhook URL in the KHQR.dev dashboard.</div>
      </div>
    </div>

    <div class="panel-footer">
      <div v-if="msg" class="save-msg" :class="msg.type">
        <span v-html="msg.type === 'success' ? icons.check : icons.error" />
        {{ msg.text }}
      </div>
      <button class="btn-primary" :disabled="saving" @click="saveSettings">
        {{ saving ? $t('superAdmin.platformSettings.saving') : $t('superAdmin.platformSettings.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

const saving = ref(false)
const msg = ref(null)
const form = ref({
  bakong_account_id: '',
  merchant_name: 'QRserve',
  merchant_city: 'Phnom Penh',
  khqrdev_token: '',
  khqrdev_webhook_secret: '',
})
const savedBakongId = ref('')
const showToken = ref(false)
const showWebhookSecret = ref(false)
const copied = ref(false)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const webhookUrl = `${supabaseUrl}/functions/v1/khqr-webhook`

async function copyWebhookUrl() {
  try {
    await navigator.clipboard.writeText(webhookUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

async function saveSettings() {
  saving.value = true
  msg.value = null
  try {
    const upsertData = {
      id: true,
      bakong_account_id: form.value.bakong_account_id.trim() || null,
      merchant_name: form.value.merchant_name.trim() || 'QRserve',
      merchant_city: form.value.merchant_city.trim() || 'Phnom Penh',
      updated_by: authStore.user?.id,
      updated_at: new Date().toISOString(),
    }
    // Only include token/secret if filled in (don't overwrite with empty string)
    if (form.value.khqrdev_token.trim()) {
      upsertData.khqrdev_token = form.value.khqrdev_token.trim()
    }
    if (form.value.khqrdev_webhook_secret.trim()) {
      upsertData.khqrdev_webhook_secret = form.value.khqrdev_webhook_secret.trim()
    }

    const { error } = await supabase.from('platform_settings').upsert(upsertData)
    if (error) throw error
    savedBakongId.value = form.value.bakong_account_id.trim()
    // Clear secret fields after save (write-only UX)
    form.value.khqrdev_token = ''
    form.value.khqrdev_webhook_secret = ''
    msg.value = { type: 'success', text: t('superAdmin.platformSettings.success') }
    setTimeout(() => { msg.value = null }, 3000)
  } catch (err) {
    msg.value = { type: 'error', text: err.message }
  } finally {
    saving.value = false
  }
}

async function loadSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    // Note: khqrdev_token and khqrdev_webhook_secret are write-only in the UI —
    // we load a boolean indicator of whether they are set, not the values.
    .select('bakong_account_id, merchant_name, merchant_city, khqrdev_token, khqrdev_webhook_secret')
    .eq('id', true)
    .single()

  if (!error && data) {
    form.value.bakong_account_id = data.bakong_account_id || ''
    form.value.merchant_name = data.merchant_name || 'QRserve'
    form.value.merchant_city = data.merchant_city || 'Phnom Penh'
    savedBakongId.value = data.bakong_account_id || ''
    // Don't pre-fill token/secret — write-only UX (clear after save)
    // We do track if they're configured for the status indicator
    tokenConfigured.value = !!data.khqrdev_token
    webhookSecretConfigured.value = !!data.khqrdev_webhook_secret
  }
}

const tokenConfigured = ref(false)
const webhookSecretConfigured = ref(false)

onMounted(loadSettings)

const icons = {
  khqr: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
}
</script>

<style scoped>
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
.panel-footer {
  padding: 14px 20px;
  border-top: 1px solid #f0ede8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}
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
.form-input.with-prefix {
  padding-left: 28px;
  padding-right: 36px;
}
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
.btn-secondary {
  height: 34px;
  padding: 0 14px;
  background: transparent;
  color: #6b6963;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-secondary:hover {
  background: #f3f1ee;
  color: #1a1917;
}
.khqr-test-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fafaf9;
  border-radius: 9px;
  border: 1px solid #f0ede8;
}
.khqr-test-label {
  font-size: 12px;
  color: #6b6963;
}
.khqr-preview {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px;
  background: #fafaf9;
  border: 1px solid #e8e6e1;
  border-radius: 10px;
}
.khqr-img {
  width: 120px;
  height: 120px;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  padding: 6px;
  background: #fff;
}
.khqr-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.khqr-detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.khqr-detail-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.khqr-detail-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a1917;
}
.section-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a8a49e;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 4px 0;
}
.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #f0ede8;
}
.input-secret-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #a8a49e;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.input-eye-btn:hover { color: #f97316; }
.badge-required {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  background: #fff7ed;
  color: #f97316;
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 6px;
  vertical-align: middle;
}
.badge-info {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 6px;
  vertical-align: middle;
}
.webhook-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafaf9;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
}
.webhook-url-code {
  flex: 1;
  font-size: 11.5px;
  color: #3d3d3a;
  font-family: ui-monospace, monospace;
  word-break: break-all;
  background: none;
}
.btn-copy {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid #e8e6e1;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: #6b6963;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-copy:hover { border-color: #f97316; color: #f97316; }
</style>

