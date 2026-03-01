<template>
  <div class="onboarding-root">
    <!-- Ambient background -->
    <div class="bg-noise" />
    <div class="bg-glow" />

    <div class="onboarding-wrapper">
      <!-- Header -->
      <div class="onboarding-header">
        <div class="logo-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
          </svg>
        </div>
        <span class="logo-text">QRserve</span>
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
          :class="{ 'step-done': i < currentStep, 'step-active': i === currentStep }"
        >
          <svg
            v-if="i < currentStep"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
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

          <div class="error-box" v-if="error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ error }}
          </div>

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
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
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

            <!-- Restaurant name -->
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
                <select v-model="step1.currency" class="field-input" @change="onCurrencyChange">
                  <option v-for="c in KNOWN_CURRENCIES" :key="c.code" :value="c.code">
                    {{ c.symbol }} {{ c.code }}
                  </option>
                  <option value="OTHER">✏️ Other (custom)</option>
                </select>

                <!-- Custom currency input -->
                <div v-if="step1.currency === 'OTHER'" class="custom-currency-wrap">
                  <div class="custom-currency-field" :class="{ 'has-error': customCurrencyError }">
                    <input
                      v-model="customCurrency"
                      type="text"
                      class="field-input custom-input"
                      placeholder="e.g. RM MYR"
                      @input="onCustomCurrencyInput"
                      @focus="tooltipVisible = true"
                      @blur="tooltipVisible = false"
                      autocomplete="off"
                    />
                    <!-- Floating tooltip -->
                    <transition name="tooltip-fade">
                      <div v-if="customCurrencyError && tooltipVisible" class="currency-tooltip">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
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
            <span v-if="loading" class="loading-state">
              <svg
                class="spinner"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                />
              </svg>
              Saving…
            </span>
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

          <div class="error-box" v-if="error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ error }}
          </div>

          <div class="fields">
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

            <div class="section-divider"><span>then add a dish</span></div>

            <!-- ── Dish photo upload ── -->
            <div class="field-group">
              <label class="field-label">Photo <span class="optional">(optional)</span></label>
              <div
                class="image-upload-area"
                @click="triggerItemImageUpload"
                :class="{ 'has-image': step2.imagePreview }"
              >
                <img v-if="step2.imagePreview" :src="step2.imagePreview" class="upload-preview" />
                <div v-else class="upload-placeholder">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Click to upload</span>
                  <span class="upload-hint">PNG or JPG · max 2MB</span>
                </div>
                <button
                  v-if="step2.imagePreview"
                  class="remove-image"
                  @click.stop="removeItemImage"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <input
                ref="itemImageInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleItemImageChange"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Dish Name</label>
              <input
                v-model="step2.itemName"
                type="text"
                class="field-input"
                placeholder="e.g. Margherita Pizza"
              />
            </div>

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
              <span v-if="loading" class="loading-state">
                <svg
                  class="spinner"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  />
                </svg>
                Saving…
              </span>
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

          <div class="error-box" v-if="error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ error }}
          </div>

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

          <div v-if="qrDataUrl" class="qr-preview-box">
            <div class="qr-badge">Your QR Code</div>
            <div class="qr-frame">
              <img :src="qrDataUrl" class="qr-image" alt="QR Code" />
            </div>
            <p class="qr-url">{{ currentOrderUrl }}</p>
            <button class="btn-download" @click="downloadQr">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download QR
            </button>
          </div>

          <div class="btn-row">
            <button class="btn-back" @click="currentStep = 2">← Back</button>
            <button class="btn-next btn-finish" :disabled="loading" @click="saveStep3">
              <span v-if="loading" class="loading-state">
                <svg
                  class="spinner"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  />
                </svg>
                Finishing up…
              </span>
              <span v-else>Open my dashboard →</span>
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

// ── Known currencies (8 fixed) ───────────────────────
const KNOWN_CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'KHR', symbol: '៛' },
  { code: 'THB', symbol: '฿' },
]
const KNOWN_CODES = KNOWN_CURRENCIES.map((c) => c.code)

// ── Step 1 ───────────────────────────────────────────
const step1 = ref({ name: '', address: '', currency: 'USD', timezone: 'UTC' })
const logoInput = ref(null)
const logoFile = ref(null)
const logoPreview = ref('')

// ── Custom currency state ────────────────────────────
const customCurrency = ref('')
const customCurrencyError = ref('')
const tooltipVisible = ref(false)

function onCurrencyChange() {
  if (step1.value.currency !== 'OTHER') {
    customCurrency.value = ''
    customCurrencyError.value = ''
  } else {
    tooltipVisible.value = true
  }
}

function validateCustomCurrency(val) {
  const v = val.trim()
  if (!v) return 'Please enter your custom currency.'

  const spaceIndex = v.indexOf(' ')
  if (spaceIndex === -1) {
    return 'Format: symbol · space · code — e.g. RM MYR'
  }

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
}

function parsedCustomSymbol() {
  const v = customCurrency.value.trim()
  const spaceIndex = v.indexOf(' ')
  return spaceIndex !== -1 ? v.slice(0, spaceIndex) : v || '?'
}

const resolvedCurrency = computed(() => {
  if (step1.value.currency === 'OTHER') return customCurrency.value.trim()
  return step1.value.currency
})

// ── Step 2 ───────────────────────────────────────────
const step2 = ref({
  categoryName: '',
  itemName: '',
  itemDescription: '',
  itemPrice: '',
  imagePreview: '',
  imageFile: null,
})
const categorySuggestions = ['Starters', 'Mains', 'Desserts', 'Drinks', 'Specials']
const itemImageInput = ref(null)

const currencySymbol = computed(() => {
  if (step1.value.currency === 'OTHER') return parsedCustomSymbol()
  const found = KNOWN_CURRENCIES.find((c) => c.code === step1.value.currency)
  return found ? found.symbol : '$'
})

// ── Item image handlers ──────────────────────────────
function triggerItemImageUpload() {
  itemImageInput.value?.click()
}

function handleItemImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Image must be under 2MB.'
    return
  }
  step2.value.imageFile = file
  step2.value.imagePreview = URL.createObjectURL(file)
  e.target.value = ''
}

function removeItemImage() {
  step2.value.imageFile = null
  step2.value.imagePreview = ''
}

// ── Step 3 ───────────────────────────────────────────
const step3 = ref({ tableName: 'Table 1' })
const tableSuggestions = ['Table 1', 'Table 2', 'Bar Seat', 'VIP Room', 'Terrace']
const qrDataUrl = ref('')
const restaurantSlug = ref('')
const newTableId = ref('')

const currentOrderUrl = computed(
  () => `${window.location.origin}/order/${restaurantSlug.value}/${newTableId.value}`,
)

watch(
  () => step3.value.tableName,
  async () => {
    if (currentStep.value === 3 && qrDataUrl.value) {
      await generateQr()
    }
  },
)

// ── Logo ──────────────────────────────────────────────
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

// ── Step 1 Save ───────────────────────────────────────
async function saveStep1() {
  error.value = ''
  if (!step1.value.name.trim()) {
    error.value = 'Please enter your restaurant name.'
    return
  }

  if (step1.value.currency === 'OTHER') {
    const err = validateCustomCurrency(customCurrency.value)
    if (err) {
      customCurrencyError.value = err
      tooltipVisible.value = true
      error.value = 'Please fix the currency format before continuing.'
      return
    }
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

    let logo_url = null
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

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        name: step1.value.name.trim(),
        address: step1.value.address.trim() || null,
        currency: resolvedCurrency.value,
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

// ── Step 2 Save ───────────────────────────────────────
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

    const { data: category, error: catError } = await supabase
      .from('menu_categories')
      .insert({ restaurant_id: restaurantId, name: step2.value.categoryName.trim(), sort_order: 0 })
      .select()
      .single()
    if (catError) throw catError

    // Upload item image if provided
    let image_url = null
    if (step2.value.imageFile) {
      const ext = step2.value.imageFile.name.split('.').pop()
      const itemId = crypto.randomUUID()
      const path = `${restaurantId}/${itemId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, step2.value.imageFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { error: itemError } = await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: category.id,
      name: step2.value.itemName.trim(),
      description: step2.value.itemDescription.trim() || null,
      price: parseFloat(step2.value.itemPrice) || 0,
      image_url,
      sort_order: 0,
    })
    if (itemError) throw itemError

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .single()
    restaurantSlug.value = restaurant.slug
    await createTableRow(restaurantId)
    currentStep.value = 3
  } catch (err) {
    error.value = err.message || 'Failed to save. Please try again.'
  } finally {
    loading.value = false
  }
}

async function createTableRow(restaurantId) {
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .insert({ restaurant_id: restaurantId, name: step3.value.tableName.trim() || 'Table 1' })
    .select()
    .single()
  if (tableError) throw tableError
  newTableId.value = table.id
  const orderUrl = `${window.location.origin}/order/${restaurantSlug.value}/${table.id}`
  await supabase.from('tables').update({ qr_code_url: orderUrl }).eq('id', table.id)
  await generateQr()
}

// ── Step 3 Save ───────────────────────────────────────
async function saveStep3() {
  error.value = ''
  if (!step3.value.tableName.trim()) {
    error.value = 'Please enter a table name.'
    return
  }
  loading.value = true
  try {
    if (newTableId.value) {
      const orderUrl = `${window.location.origin}/order/${restaurantSlug.value}/${newTableId.value}`
      const { error: updateError } = await supabase
        .from('tables')
        .update({
          name: step3.value.tableName.trim(),
          qr_code_url: orderUrl,
        })
        .eq('id', newTableId.value)
      if (updateError) throw updateError
    }
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

// ── QR Code ───────────────────────────────────────────
async function generateQr() {
  if (!restaurantSlug.value || !newTableId.value) return
  try {
    const url = `${window.location.origin}/order/${restaurantSlug.value}/${newTableId.value}`
    qrDataUrl.value = await QRCode.toDataURL(url, {
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

// ── Load existing restaurant data ─────────────────────
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
    step1.value.timezone = restaurant.timezone || 'UTC'
    if (restaurant.logo_url) logoPreview.value = restaurant.logo_url
    restaurantSlug.value = restaurant.slug || ''

    const stored = restaurant.currency || 'USD'
    if (KNOWN_CODES.includes(stored)) {
      step1.value.currency = stored
    } else {
      step1.value.currency = 'OTHER'
      customCurrency.value = stored
    }
  }
}

loadRestaurantData()
</script>

<style scoped>
/* ── Root ── */
.onboarding-root {
  min-height: 100vh;
  background: #111111;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px 96px;
  position: relative;
  overflow: hidden;
}

.bg-noise {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px;
  pointer-events: none;
  z-index: 0;
}

.bg-glow {
  position: fixed;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(200, 115, 58, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.onboarding-wrapper {
  width: 100%;
  max-width: 520px;
  position: relative;
  z-index: 1;
}

/* ── Header ── */
.onboarding-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 36px;
}
.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8733a;
}
.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

/* ── Progress ── */
.progress-track {
  height: 2px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 99px;
  margin-bottom: 20px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c8733a, #d4844e);
  border-radius: 99px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px rgba(200, 115, 58, 0.5);
}

/* ── Step dots ── */
.step-indicators {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}
.step-dot.step-active {
  background: rgba(200, 115, 58, 0.2);
  border-color: rgba(200, 115, 58, 0.5);
  color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
}
.step-dot.step-done {
  background: rgba(200, 115, 58, 0.15);
  border-color: rgba(200, 115, 58, 0.4);
  color: #c8733a;
}

/* ── Step Card ── */
.step-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.4);
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
  color: #ffffff;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 6px;
}
.step-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
  margin-bottom: 28px;
}

/* ── Error box ── */
.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 13px;
  color: #ef4444;
  margin-bottom: 20px;
  line-height: 1.4;
}
.error-box svg {
  flex-shrink: 0;
}

/* ── Fields ── */
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
  gap: 7px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}
.optional {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.25);
}
.field-input {
  width: 100%;
  padding: 10px 14px;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
}
.field-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}
.field-input:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.field-input:focus {
  border-color: rgba(200, 115, 58, 0.4);
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
}

select.field-input {
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}
select.field-input option {
  background: #1e1e1e;
  color: #ffffff;
}

.field-textarea {
  resize: vertical;
  min-height: 68px;
  line-height: 1.5;
}
.mt-2 {
  margin-top: 8px;
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
  border-color: rgba(239, 68, 68, 0.5) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.currency-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #2a1a1a;
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
  pointer-events: none;
}

.tooltip-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: #2a1a1a;
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
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1.5;
  margin: 0;
}
.hint-example {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 4px;
  padding: 1px 5px;
  color: rgba(255, 255, 255, 0.5);
}

/* ── Logo upload ── */
.logo-upload {
  width: 120px;
  height: 90px;
  border: 1.5px dashed rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}
.logo-upload:hover,
.logo-upload.has-logo {
  border-color: rgba(200, 115, 58, 0.5);
  border-style: solid;
  background: rgba(200, 115, 58, 0.04);
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
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  padding: 10px;
}
.logo-placeholder svg {
  color: #c8733a;
  opacity: 0.7;
  margin-bottom: 2px;
}
.upload-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
}
.hidden-input {
  display: none;
}

/* ── Item image upload ── */
.image-upload-area {
  height: 130px;
  border: 1.5px dashed rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
  position: relative;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.image-upload-area:hover {
  border-color: rgba(200, 115, 58, 0.45);
  background: rgba(200, 115, 58, 0.03);
}
.image-upload-area.has-image {
  border-style: solid;
  border-color: rgba(200, 115, 58, 0.4);
}
.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}
.upload-placeholder svg {
  color: rgba(255, 255, 255, 0.2);
}
.remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.remove-image:hover {
  background: rgba(239, 68, 68, 0.7);
}

/* ── Suggestion chips ── */
.category-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.suggestion-chip {
  padding: 5px 13px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.suggestion-chip:hover {
  border-color: rgba(200, 115, 58, 0.4);
  color: #c8733a;
  background: rgba(200, 115, 58, 0.06);
}
.suggestion-chip.active {
  border-color: rgba(200, 115, 58, 0.5);
  background: rgba(200, 115, 58, 0.15);
  color: #c8733a;
}

/* ── Section divider ── */
.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
}

/* ── Price input ── */
.price-input-wrap {
  display: flex;
  align-items: stretch;
}
.currency-symbol {
  padding: 10px 13px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  display: flex;
  align-items: center;
}
.price-input {
  border-radius: 0 8px 8px 0 !important;
}

/* ── QR Preview ── */
.qr-preview-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.qr-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 99px;
}
.qr-frame {
  padding: 10px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.qr-image {
  width: 150px;
  height: 150px;
  display: block;
  border-radius: 2px;
}
.qr-url {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  word-break: break-all;
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
}
.btn-download {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid rgba(200, 115, 58, 0.35);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.06);
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.btn-download:hover {
  background: rgba(200, 115, 58, 0.14);
  border-color: rgba(200, 115, 58, 0.5);
}

/* ── Buttons ── */
.btn-next {
  width: 100%;
  padding: 12px;
  background: #c8733a;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s,
    transform 0.1s;
}
.btn-next:hover:not(:disabled) {
  background: #d4844e;
  box-shadow: 0 0 20px rgba(200, 115, 58, 0.35);
}
.btn-next:active:not(:disabled) {
  background: #b05d2e;
  transform: scale(0.99);
}
.btn-next:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-row {
  display: flex;
  gap: 10px;
}
.btn-row .btn-next {
  flex: 1;
}
.btn-back {
  padding: 12px 18px;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-back:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.spinner {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── Slide transition ── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .step-card {
    padding: 28px 20px;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
  .step-title {
    font-size: 22px;
  }
  .currency-tooltip {
    white-space: normal;
    max-width: 220px;
    text-align: center;
  }
}
</style>
