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

      <div v-if="savedBakongId && form.bakong_account_id" class="khqr-test-row">
        <span class="khqr-test-label">{{ $t('superAdmin.platformSettings.testQRLabel') }}</span>
        <button class="btn-secondary" @click="showTestQR = !showTestQR">
          {{ showTestQR ? $t('superAdmin.platformSettings.hideTestQR') : $t('superAdmin.platformSettings.showTestQR') }}
        </button>
      </div>

      <div v-if="showTestQR && testQRData" class="khqr-preview">
        <img :src="testQRData" alt="KHQR Test QR" class="khqr-img" />
        <div class="khqr-details">
          <div class="khqr-detail-row">
            <span class="khqr-detail-label">{{ $t('superAdmin.platformSettings.merchantName') }}</span>
            <span class="khqr-detail-value">{{ form.merchant_name || 'QRserve' }}</span>
          </div>
          <div class="khqr-detail-row">
            <span class="khqr-detail-label">{{ $t('superAdmin.platformSettings.accountId') }}</span>
            <span class="khqr-detail-value">{{ form.bakong_account_id }}</span>
          </div>
        </div>
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
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

const saving = ref(false)
const msg = ref(null)
const form = ref({ bakong_account_id: '', merchant_name: 'QRserve', merchant_city: 'Phnom Penh' })
const savedBakongId = ref('')
const showTestQR = ref(false)
const testQRData = ref(null)

watch(() => form.value.bakong_account_id, () => {
  showTestQR.value = false
  testQRData.value = null
})

async function saveSettings() {
  saving.value = true
  msg.value = null
  try {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        id: true,
        bakong_account_id: form.value.bakong_account_id.trim() || null,
        merchant_name: form.value.merchant_name.trim() || 'QRserve',
        merchant_city: form.value.merchant_city.trim() || 'Phnom Penh',
        updated_by: authStore.user?.id,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error
    savedBakongId.value = form.value.bakong_account_id.trim()
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
    .select('bakong_account_id, merchant_name, merchant_city')
    .eq('id', true)
    .single()

  if (!error && data) {
    form.value.bakong_account_id = data.bakong_account_id || ''
    form.value.merchant_name = data.merchant_name || 'QRserve'
    form.value.merchant_city = data.merchant_city || 'Phnom Penh'
    savedBakongId.value = data.bakong_account_id || ''
  }
}

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
</style>
