<template>
  <div class="onboarding-root">
    <!-- Background -->
    <div class="bg-grid" />

    <div class="onboarding-wrapper">
      <!-- Header -->
      <div class="onboarding-header">
        <div class="logo-mark">🍽️</div>
        <span class="logo-text">RestaurantOS</span>
      </div>

      <!-- Progress bar -->
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }" />
      </div>

      <!-- Step indicators -->
      <div class="step-indicators">
        <div
          v-for="i in totalSteps"
          :key="i"
          class="step-dot"
          :class="{
            'step-done': i < currentStep,
            'step-active': i === currentStep,
          }"
        >
          <span v-if="i < currentStep" class="dot-check">✓</span>
          <span v-else>{{ i }}</span>
        </div>
      </div>

      <!-- Card -->
      <transition name="slide" mode="out-in">
        <!-- ─── STEP 1: Restaurant Profile ─── -->
        <div v-if="currentStep === 1" key="step1" class="step-card">
          <div class="step-label">Step 1 of 3</div>
          <h1 class="step-title">Set up your restaurant</h1>
          <p class="step-sub">
            This is what your customers will see when they visit your menu page.
          </p>

          <div class="error-box" v-if="error">{{ error }}</div>

          <div class="fields">
            <!-- Logo upload -->
            <div class="field-group">
              <label class="field-label">Logo</label>
              <div
                class="logo-upload"
                @click="triggerLogoUpload"
                :class="{ 'has-logo': logoPreview }"
              >
                <img v-if="logoPreview" :src="logoPreview" class="logo-preview" />
                <div v-else class="logo-placeholder">
                  <span class="upload-icon">↑</span>
                  <span>Upload logo</span>
                  <span class="upload-hint">PNG or JPG, max 2MB</span>
                </div>
              </div>
              <input
                ref="logoInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleLogoChange"
              />
            </div>

            <!-- Restaurant name (pre-filled) -->
            <div class="field-group">
              <label class="field-label">Restaurant Name</label>
              <input
                v-model="step1.name"
                type="text"
                class="field-input"
                placeholder="Pizza Palace"
              />
            </div>

            <!-- Address -->
            <div class="field-group">
              <label class="field-label">Address <span class="optional">(optional)</span></label>
              <input
                v-model="step1.address"
                type="text"
                class="field-input"
                placeholder="123 Main St, New York, NY"
              />
            </div>

            <div class="field-row">
              <!-- Currency -->
              <div class="field-group">
                <label class="field-label">Currency</label>
                <select v-model="step1.currency" class="field-input">
                  <option value="USD">USD — $</option>
                  <option value="EUR">EUR — €</option>
                  <option value="GBP">GBP — £</option>
                  <option value="KHR">KHR — ៛</option>
                  <option value="THB">THB — ฿</option>
                  <option value="SGD">SGD — S$</option>
                  <option value="AUD">AUD — A$</option>
                  <option value="JPY">JPY — ¥</option>
                </select>
              </div>

              <!-- Timezone -->
              <div class="field-group">
                <label class="field-label">Timezone</label>
                <select v-model="step1.timezone" class="field-input">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Phnom_Penh">Phnom Penh (ICT)</option>
                  <option value="Asia/Bangkok">Bangkok (ICT)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>
            </div>
          </div>

          <button class="btn-next" :disabled="loading" @click="saveStep1">
            <span v-if="loading" class="btn-loading">Saving…</span>
            <span v-else>Continue →</span>
          </button>
        </div>

        <!-- ─── STEP 2: First Menu Item ─── -->
        <div v-else-if="currentStep === 2" key="step2" class="step-card">
          <div class="step-label">Step 2 of 3</div>
          <h1 class="step-title">Add your first menu item</h1>
          <p class="step-sub">
            Create a category and your first dish — your menu will feel alive right away.
          </p>

          <div class="error-box" v-if="error">{{ error }}</div>

          <div class="fields">
            <!-- Category -->
            <div class="field-group">
              <label class="field-label">Category Name</label>
              <div class="category-suggestions">
                <button
                  v-for="s in categorySuggestions"
                  :key="s"
                  class="suggestion-chip"
                  :class="{ active: step2.categoryName === s }"
                  @click="step2.categoryName = s"
                  type="button"
                >
                  {{ s }}
                </button>
              </div>
              <input
                v-model="step2.categoryName"
                type="text"
                class="field-input mt-2"
                placeholder="e.g. Starters, Mains, Drinks…"
              />
            </div>

            <div class="divider">
              <span>then add a dish</span>
            </div>

            <!-- Item name -->
            <div class="field-group">
              <label class="field-label">Dish Name</label>
              <input
                v-model="step2.itemName"
                type="text"
                class="field-input"
                placeholder="e.g. Margherita Pizza"
              />
            </div>

            <!-- Description -->
            <div class="field-group">
              <label class="field-label"
                >Description <span class="optional">(optional)</span></label
              >
              <textarea
                v-model="step2.itemDescription"
                class="field-input field-textarea"
                placeholder="A brief description of the dish…"
                rows="2"
              />
            </div>

            <!-- Price -->
            <div class="field-group">
              <label class="field-label">Price</label>
              <div class="price-input-wrap">
                <span class="currency-symbol">{{ currencySymbol }}</span>
                <input
                  v-model="step2.itemPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="field-input price-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn-back" @click="currentStep = 1">← Back</button>
            <button class="btn-next" :disabled="loading" @click="saveStep2">
              <span v-if="loading">Saving…</span>
              <span v-else>Continue →</span>
            </button>
          </div>
        </div>

        <!-- ─── STEP 3: First Table + QR ─── -->
        <div v-else-if="currentStep === 3" key="step3" class="step-card">
          <div class="step-label">Step 3 of 3</div>
          <h1 class="step-title">Create your first table</h1>
          <p class="step-sub">
            Each table gets a unique QR code. Customers scan it to order — no app needed.
          </p>

          <div class="error-box" v-if="error">{{ error }}</div>

          <div class="fields">
            <div class="field-group">
              <label class="field-label">Table Name</label>
              <div class="category-suggestions">
                <button
                  v-for="s in tableSuggestions"
                  :key="s"
                  class="suggestion-chip"
                  :class="{ active: step3.tableName === s }"
                  @click="step3.tableName = s"
                  type="button"
                >
                  {{ s }}
                </button>
              </div>
              <input
                v-model="step3.tableName"
                type="text"
                class="field-input mt-2"
                placeholder="e.g. Table 1, Bar Seat, VIP Room…"
              />
            </div>
          </div>

          <!-- QR Preview -->
          <div v-if="qrDataUrl" class="qr-preview-box">
            <div class="qr-label">Your QR Code</div>
            <img :src="qrDataUrl" class="qr-image" alt="QR Code" />
            <p class="qr-url">{{ orderUrl }}</p>
            <button class="btn-download" @click="downloadQr">⬇ Download QR</button>
          </div>

          <div class="btn-row">
            <button class="btn-back" @click="currentStep = 2">← Back</button>
            <button class="btn-next" :disabled="loading" @click="saveStep3">
              <span v-if="loading">Finishing up…</span>
              <span v-else>🎉 Open my dashboard</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

const router = useRouter()

const currentStep = ref(1)
const totalSteps = 3
const loading = ref(false)
const error = ref('')

// ── Step 1 ──────────────────────────────────────────────
const step1 = ref({ name: '', address: '', currency: 'USD', timezone: 'UTC' })
const logoInput = ref(null)
const logoFile = ref(null)
const logoPreview = ref('')

// ── Step 2 ──────────────────────────────────────────────
const step2 = ref({ categoryName: '', itemName: '', itemDescription: '', itemPrice: '' })

const categorySuggestions = ['Starters', 'Mains', 'Desserts', 'Drinks', 'Specials']

const currencySymbol = computed(() => {
  const map = { USD: '$', EUR: '€', GBP: '£', KHR: '៛', THB: '฿', SGD: 'S$', AUD: 'A$', JPY: '¥' }
  return map[step1.value.currency] || '$'
})

// ── Step 3 ──────────────────────────────────────────────
const step3 = ref({ tableName: 'Table 1' })
const tableSuggestions = ['Table 1', 'Table 2', 'Bar Seat', 'VIP Room', 'Terrace']
const qrDataUrl = ref('')
const restaurantSlug = ref('')
const newTableId = ref('')

const orderUrl = computed(
  () => `${window.location.origin}/order/${restaurantSlug.value}/${newTableId.value}`,
)

// Auto-generate QR preview as user types table name in step 3
watch([() => step3.value.tableName, newTableId], async () => {
  if (currentStep.value === 3 && restaurantSlug.value && newTableId.value) {
    await generateQr()
  }
})

// ── Logo ─────────────────────────────────────────────────
function triggerLogoUpload() {
  logoInput.value?.click()
}

function handleLogoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Logo must be under 2MB.'
    return
  }
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

// ── Step 1 Save ───────────────────────────────────────────
async function saveStep1() {
  error.value = ''
  if (!step1.value.name.trim()) {
    error.value = 'Please enter your restaurant name.'
    return
  }

  loading.value = true
  try {
    // Get current user & their restaurant
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    const restaurantId = profile.restaurant_id

    let logo_url = null

    // Upload logo if provided
    if (logoFile.value) {
      const ext = logoFile.value.name.split('.').pop()
      const path = `${restaurantId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('restaurant-assets')
        .upload(path, logoFile.value, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('restaurant-assets').getPublicUrl(path)
      logo_url = urlData.publicUrl
    }

    // Update restaurant profile
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        name: step1.value.name.trim(),
        address: step1.value.address.trim() || null,
        currency: step1.value.currency,
        timezone: step1.value.timezone,
        ...(logo_url && { logo_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurantId)

    if (updateError) throw updateError

    currentStep.value = 2
  } catch (err) {
    error.value = err.message || 'Failed to save. Please try again.'
  } finally {
    loading.value = false
  }
}

// ── Step 2 Save ───────────────────────────────────────────
async function saveStep2() {
  error.value = ''
  if (!step2.value.categoryName.trim()) {
    error.value = 'Please enter a category name.'
    return
  }
  if (!step2.value.itemName.trim()) {
    error.value = 'Please enter a dish name.'
    return
  }

  loading.value = true
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    const restaurantId = profile.restaurant_id

    // Create category
    const { data: category, error: catError } = await supabase
      .from('menu_categories')
      .insert({ restaurant_id: restaurantId, name: step2.value.categoryName.trim(), sort_order: 0 })
      .select()
      .single()

    if (catError) throw catError

    // Create menu item
    const { error: itemError } = await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: category.id,
      name: step2.value.itemName.trim(),
      description: step2.value.itemDescription.trim() || null,
      price: parseFloat(step2.value.itemPrice) || 0,
      sort_order: 0,
    })

    if (itemError) throw itemError

    // Fetch slug for QR generation later
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .single()

    restaurantSlug.value = restaurant.slug
    currentStep.value = 3

    // Pre-create the table row so we have an ID for QR
    await createTableRow(restaurantId)
  } catch (err) {
    error.value = err.message || 'Failed to save. Please try again.'
  } finally {
    loading.value = false
  }
}

// Creates the table row and sets newTableId (used for QR url)
async function createTableRow(restaurantId) {
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .insert({ restaurant_id: restaurantId, name: step3.value.tableName.trim() || 'Table 1' })
    .select()
    .single()

  if (tableError) throw tableError
  newTableId.value = table.id
  await generateQr()
}

// ── Step 3 Save ───────────────────────────────────────────
async function saveStep3() {
  error.value = ''
  if (!step3.value.tableName.trim()) {
    error.value = 'Please enter a table name.'
    return
  }

  loading.value = true
  try {
    if (newTableId.value) {
      const { error: updateError } = await supabase
        .from('tables')
        .update({ name: step3.value.tableName.trim() })
        .eq('id', newTableId.value)
      if (updateError) throw updateError
    }

    // ✅ Mark onboarding as done
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    await supabase
      .from('restaurants')
      .update({ onboarding_completed: true })
      .eq('id', profile.restaurant_id)

    router.push('/app/dashboard')
  } catch (err) {
    error.value = err.message || 'Failed to finish setup.'
  } finally {
    loading.value = false
  }
}

// ── QR Code ───────────────────────────────────────────────
async function generateQr() {
  if (!restaurantSlug.value || !newTableId.value) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(orderUrl.value, {
      width: 240,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
  } catch (err) {
    console.error('QR generation failed:', err)
  }
}

function downloadQr() {
  const link = document.createElement('a')
  link.download = `${step3.value.tableName || 'table'}-qr.png`
  link.href = qrDataUrl.value
  link.click()
}

// Load existing restaurant name into step 1 on mount
async function loadRestaurantData() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('users')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, address, currency, timezone, logo_url, slug')
    .eq('id', profile.restaurant_id)
    .single()
  if (restaurant) {
    step1.value.name = restaurant.name || ''
    step1.value.address = restaurant.address || ''
    step1.value.currency = restaurant.currency || 'USD'
    step1.value.timezone = restaurant.timezone || 'UTC'
    if (restaurant.logo_url) logoPreview.value = restaurant.logo_url
    restaurantSlug.value = restaurant.slug || ''
  }
}

loadRestaurantData()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.onboarding-root {
  min-height: 100vh;
  background: #faf8f5;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px 80px;
  position: relative;
}

.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
  z-index: 0;
}

.onboarding-wrapper {
  width: 100%;
  max-width: 520px;
  position: relative;
  z-index: 1;
}

/* Header */
.onboarding-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
}
.logo-mark {
  font-size: 22px;
}
.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

/* Progress */
.progress-track {
  height: 3px;
  background: #e8e3da;
  border-radius: 99px;
  margin-bottom: 20px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #c8733a;
  border-radius: 99px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Step dots */
.step-indicators {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
}
.step-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #e8e3da;
  color: #999;
  transition: all 0.3s ease;
}
.step-dot.step-active {
  background: #c8733a;
  color: white;
  box-shadow: 0 0 0 4px rgba(200, 115, 58, 0.15);
}
.step-dot.step-done {
  background: #2d6a4f;
  color: white;
}

/* Card */
.step-card {
  background: #ffffff;
  border: 1px solid #e8e3da;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

.step-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c8733a;
  margin-bottom: 8px;
}
.step-title {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin-bottom: 6px;
}
.step-sub {
  font-size: 14px;
  color: #888;
  line-height: 1.5;
  margin-bottom: 28px;
}

/* Error */
.error-box {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  margin-bottom: 20px;
}

/* Fields */
.fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 28px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}
.optional {
  font-weight: 400;
  color: #aaa;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2ddd6;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
  background: #fdfcfa;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  appearance: none;
}
.field-input:focus {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
  background: #fff;
}
.field-textarea {
  resize: vertical;
  min-height: 64px;
}
.mt-2 {
  margin-top: 8px;
}

/* Logo upload */
.logo-upload {
  width: 120px;
  height: 90px;
  border: 2px dashed #d6cfc4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  overflow: hidden;
  background: #fdfcfa;
}
.logo-upload:hover,
.logo-upload.has-logo {
  border-color: #c8733a;
  border-style: solid;
}
.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #aaa;
  text-align: center;
  padding: 8px;
}
.upload-icon {
  font-size: 18px;
  color: #c8733a;
}
.upload-hint {
  font-size: 10px;
  color: #ccc;
}
.hidden-input {
  display: none;
}

/* Suggestion chips */
.category-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.suggestion-chip {
  padding: 5px 12px;
  border-radius: 99px;
  border: 1.5px solid #e2ddd6;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  background: #fdfcfa;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.suggestion-chip:hover {
  border-color: #c8733a;
  color: #c8733a;
}
.suggestion-chip.active {
  border-color: #c8733a;
  background: #c8733a;
  color: white;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #bbb;
  font-size: 12px;
  font-weight: 500;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e3da;
}

/* Price input */
.price-input-wrap {
  display: flex;
  align-items: center;
}
.currency-symbol {
  padding: 10px 12px;
  background: #f4f0ea;
  border: 1.5px solid #e2ddd6;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}
.price-input {
  border-radius: 0 8px 8px 0 !important;
  border-left: none !important;
}
.price-input:focus {
  border-left: none !important;
}

/* QR preview */
.qr-preview-box {
  background: #fdfcfa;
  border: 1.5px solid #e8e3da;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}
.qr-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aaa;
}
.qr-image {
  width: 160px;
  height: 160px;
  border-radius: 4px;
}
.qr-url {
  font-size: 11px;
  color: #bbb;
  word-break: break-all;
  text-align: center;
  max-width: 280px;
}
.btn-download {
  padding: 8px 18px;
  border: 1.5px solid #c8733a;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #c8733a;
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.btn-download:hover {
  background: #c8733a;
  color: white;
}

/* Buttons */
.btn-next {
  width: 100%;
  padding: 13px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
}
.btn-next:hover:not(:disabled) {
  background: #c8733a;
}
.btn-next:active:not(:disabled) {
  transform: scale(0.99);
}
.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-row {
  display: flex;
  gap: 10px;
}
.btn-back {
  padding: 13px 20px;
  background: transparent;
  color: #888;
  border: 1.5px solid #e2ddd6;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-back:hover {
  border-color: #999;
  color: #444;
}
.btn-row .btn-next {
  flex: 1;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
