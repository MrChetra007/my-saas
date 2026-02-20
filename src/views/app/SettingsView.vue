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

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 3" :key="n" class="skeleton-block"></div>
    </div>

    <template v-else>
      <!-- ── Section: Restaurant Profile ── -->
      <div class="section">
        <h2 class="section-title">Restaurant Profile</h2>
        <p class="section-desc">This information is shown to customers on the ordering page.</p>

        <div class="section-body">
          <!-- Logo Upload -->
          <div class="logo-row">
            <div class="logo-preview">
              <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="logo-img" />
              <span v-else class="logo-placeholder">🍽️</span>
            </div>
            <div class="logo-actions">
              <p class="logo-label">Restaurant Logo</p>
              <p class="logo-hint">PNG or JPG, max 2MB. Shown on the customer ordering page.</p>
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style="display: none"
                  @change="handleLogoUpload"
                  :disabled="uploadingLogo"
                />
                <span v-if="uploadingLogo" class="spinner spinner--dark"></span>
                {{ uploadingLogo ? 'Uploading...' : 'Upload Logo' }}
              </label>
              <button v-if="form.logoUrl" class="btn-remove-logo" @click="removeLogo">
                Remove
              </button>
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
              <p class="form-hint">Changing this will break existing QR codes.</p>
            </div>

            <div class="form-group form-group--full">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                class="form-input form-textarea"
                placeholder="A short description shown on the customer ordering page..."
                rows="3"
                @input="markDirty"
              ></textarea>
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

          <!-- Currency Preview -->
          <div class="preview-box">
            <span class="preview-label">Preview</span>
            <span class="preview-value">{{ currencyPreview }}</span>
          </div>
        </div>
      </div>

      <!-- ── Section: Opening Hours ── -->
      <div class="section">
        <h2 class="section-title">Opening Hours</h2>
        <p class="section-desc">Optional. Displayed on the customer ordering page.</p>

        <div class="section-body">
          <div class="hours-grid">
            <div v-for="day in days" :key="day.key" class="hours-row">
              <div class="hours-day">
                <label class="toggle">
                  <input type="checkbox" v-model="form.hours[day.key].open" @change="markDirty" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="day-name" :class="{ 'day--closed': !form.hours[day.key].open }">{{
                  day.label
                }}</span>
              </div>
              <template v-if="form.hours[day.key].open">
                <input
                  type="time"
                  v-model="form.hours[day.key].from"
                  class="form-input time-input"
                  @change="markDirty"
                />
                <span class="hours-sep">to</span>
                <input
                  type="time"
                  v-model="form.hours[day.key].to"
                  class="form-input time-input"
                  @change="markDirty"
                />
              </template>
              <span v-else class="closed-label">Closed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="saveError" class="alert alert--error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="alert alert--success">{{ saveSuccess }}</div>

      <!-- Bottom Save -->
      <div class="bottom-bar">
        <button class="btn-save" @click="saveSettings" :disabled="saving || !isDirty">
          <span v-if="saving" class="spinner"></span>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button v-if="isDirty" class="btn-discard" @click="discardChanges">Discard</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const isDirty = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

// ─── Default Hours Structure ──────────────────────────────────────────────────
const defaultHours = () => ({
  mon: { open: true, from: '09:00', to: '22:00' },
  tue: { open: true, from: '09:00', to: '22:00' },
  wed: { open: true, from: '09:00', to: '22:00' },
  thu: { open: true, from: '09:00', to: '22:00' },
  fri: { open: true, from: '09:00', to: '23:00' },
  sat: { open: true, from: '10:00', to: '23:00' },
  sun: { open: false, from: '10:00', to: '21:00' },
})

const days = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

// ─── Form ─────────────────────────────────────────────────────────────────────
const form = ref({
  name: '',
  slug: '',
  description: '',
  address: '',
  logoUrl: '',
  currency: 'USD',
  timezone: 'UTC',
  hours: defaultHours(),
})

// Keep a snapshot to detect changes and allow discard
let snapshot = ''
function takeSnapshot() {
  snapshot = JSON.stringify(form.value)
}
function markDirty() {
  isDirty.value = JSON.stringify(form.value) !== snapshot
}

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

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchSettings() {
  loading.value = true
  const restaurantId = authStore.profile?.restaurant_id

  const { data, error } = await supabase
    .from('restaurants')
    .select('name, slug, description, address, logo_url, currency, timezone, opening_hours')
    .eq('id', restaurantId)
    .single()

  if (!error && data) {
    form.value = {
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      address: data.address || '',
      logoUrl: data.logo_url || '',
      currency: data.currency || 'USD',
      timezone: data.timezone || 'UTC',
      hours: data.opening_hours || defaultHours(),
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
    saveError.value = 'Logo upload failed: ' + uploadErr.message
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
      description: form.value.description.trim() || null,
      address: form.value.address.trim() || null,
      logo_url: form.value.logoUrl || null,
      currency: form.value.currency,
      timezone: form.value.timezone,
      opening_hours: form.value.hours,
    })
    .eq('id', restaurantId)

  if (error) {
    saveError.value = 'Failed to save: ' + error.message
  } else {
    saveSuccess.value = '✅ Settings saved successfully.'
    takeSnapshot()
    isDirty.value = false

    // Refresh auth store profile so currency updates propagate app-wide
    await authStore.fetchProfile()

    setTimeout(() => {
      saveSuccess.value = ''
    }, 3000)
  }

  saving.value = false
}

function discardChanges() {
  const snap = JSON.parse(snapshot)
  form.value = snap
  isDirty.value = false
  saveError.value = ''
  saveSuccess.value = ''
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(fetchSettings)
</script>

<style scoped>
.settings-page {
  padding: 2rem;
  max-width: 860px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
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
  height: 180px;
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
  width: 72px;
  height: 72px;
  border-radius: 12px;
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
  font-size: 2rem;
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
  margin-left: 0.5rem;
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

/* ── Form Grid ── */
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
.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
.form-hint {
  font-size: 0.72rem;
  color: #f59e0b;
  margin-top: 0.3rem;
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
  margin-top: 0.25rem;
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

/* ── Hours ── */
.hours-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.hours-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.hours-day {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 160px;
  flex-shrink: 0;
}
.day-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}
.day--closed {
  color: #9ca3af;
}
.closed-label {
  font-size: 0.78rem;
  color: #9ca3af;
}
.hours-sep {
  font-size: 0.78rem;
  color: #9ca3af;
  flex-shrink: 0;
}
.time-input {
  width: 120px;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  flex-shrink: 0;
}

/* ── Toggle ── */
.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  left: 3px;
  top: 3px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle input:checked + .toggle-slider {
  background: #6366f1;
}
.toggle input:checked + .toggle-slider::before {
  transform: translateX(16px);
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
  .hours-row {
    flex-wrap: wrap;
  }
  .hours-day {
    width: 100%;
  }
  .time-input {
    width: 100px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
