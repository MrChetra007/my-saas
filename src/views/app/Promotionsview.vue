<template>
  <div class="promotions-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Promotions</h1>
        <p class="page-subtitle">Manage discount codes and automatic offers</p>
      </div>
      <button class="btn-primary" @click="openModal()">
        <span class="btn-icon">＋</span>
        <span class="btn-text">New Promotion</span>
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(74, 222, 128, 0.15)">
          <span>●</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ activePromos.length }}</span>
          <span class="stat-label">Active</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(200, 115, 58, 0.15)">
          <span>🏷️</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ promotions.length }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.15)">
          <span>📊</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalUsage }}</span>
          <span class="stat-label">Times Used</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading promotions…</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="promotions.length === 0" class="empty-state">
      <div class="empty-icon">🏷️</div>
      <h3 class="empty-title">No promotions yet</h3>
      <p class="empty-subtitle">Create your first discount code or happy hour offer</p>
      <button class="btn-primary" @click="openModal()">Create Promotion</button>
    </div>

    <!-- Promotions Grid -->
    <div v-else class="promos-grid">
      <div
        v-for="promo in promotions"
        :key="promo.id"
        class="promo-card"
        :class="{ 'promo-inactive': !promo.is_active }"
      >
        <!-- Card Header -->
        <div class="promo-card-header">
          <div class="promo-badge" :class="promo.code ? 'badge-code' : 'badge-auto'">
            <span class="badge-icon">{{ promo.code ? '🎟' : '⏰' }}</span>
            <span>{{ promo.code ? 'Code' : 'Auto' }}</span>
          </div>
          <label class="toggle">
            <input type="checkbox" :checked="promo.is_active" @change="toggleActive(promo)" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Name & Code -->
        <div class="promo-info">
          <h3 class="promo-name">{{ promo.name }}</h3>
          <div v-if="promo.code" class="promo-code-tag">
            <span class="code-text">{{ promo.code.toUpperCase() }}</span>
            <button
              class="copy-btn"
              @click="copyCode(promo.code)"
              :class="{ copied: copiedCode === promo.code }"
              :title="copiedCode === promo.code ? 'Copied!' : 'Copy code'"
            >
              {{ copiedCode === promo.code ? '✓' : '⧉' }}
            </button>
          </div>
          <div v-else class="promo-auto-label">
            <span class="auto-dot"></span>
            Applies automatically
          </div>
        </div>

        <!-- Discount Value -->
        <div class="promo-value-row">
          <div
            class="discount-pill"
            :class="promo.type === 'percentage' ? 'pill-pct' : 'pill-fixed'"
          >
            {{
              promo.type === 'percentage'
                ? `${promo.value}% OFF`
                : `${currencySymbol}${promo.value} OFF`
            }}
          </div>
        </div>

        <!-- Time Window -->
        <div v-if="promo.starts_at && promo.ends_at" class="promo-time">
          <svg class="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ formatTime(promo.starts_at) }} – {{ formatTime(promo.ends_at) }}</span>
        </div>

        <!-- Usage -->
        <div class="promo-usage">
          <div class="usage-header">
            <span class="usage-count">{{ promo.usage_count }} uses</span>
            <span v-if="promo.usage_limit" class="usage-limit">/ {{ promo.usage_limit }}</span>
            <span v-else class="usage-limit">/ ∞</span>
          </div>
          <div v-if="promo.usage_limit" class="usage-bar">
            <div
              class="usage-fill"
              :style="{ width: Math.min((promo.usage_count / promo.usage_limit) * 100, 100) + '%' }"
              :class="{ full: promo.usage_count >= promo.usage_limit }"
            ></div>
          </div>
          <div v-else class="usage-bar infinite">
            <div class="usage-fill" style="width: 100%"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="promo-actions">
          <button class="btn-ghost" @click="openModal(promo)">
            <svg class="btn-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
          <button class="btn-danger-ghost" @click="confirmDelete(promo)">
            <svg class="btn-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- ======================== MODAL ======================== -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-header-content">
              <h2>{{ editingPromo ? 'Edit Promotion' : 'New Promotion' }}</h2>
              <p class="modal-subtitle">
                {{ editingPromo ? 'Update your promotion details' : 'Create a new discount offer' }}
              </p>
            </div>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <div class="modal-body">
            <!-- Name -->
            <div class="field">
              <label>Promotion Name <span class="required">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Happy Hour, Summer Sale" />
            </div>

            <!-- Type: Code vs Auto -->
            <div class="field">
              <label>Promotion Type</label>
              <div class="type-toggle">
                <button
                  :class="['type-btn', form.isAuto ? '' : 'active']"
                  @click="form.isAuto = false"
                >
                  <span class="type-emoji">🎟</span>
                  <span class="type-title">Discount Code</span>
                  <span class="type-hint">Customer enters at checkout</span>
                </button>
                <button
                  :class="['type-btn', form.isAuto ? 'active' : '']"
                  @click="form.isAuto = true"
                >
                  <span class="type-emoji">⏰</span>
                  <span class="type-title">Auto Discount</span>
                  <span class="type-hint">Applies by time window</span>
                </button>
              </div>
            </div>

            <!-- Code input (only for code type) -->
            <div v-if="!form.isAuto" class="field">
              <label>Discount Code <span class="required">*</span></label>
              <div class="code-input-wrap">
                <input
                  v-model="form.code"
                  type="text"
                  placeholder="e.g. HAPPY10"
                  class="code-input"
                  @input="form.code = form.code.toUpperCase()"
                  maxlength="20"
                />
                <button class="generate-btn" @click="generateCode" type="button">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Generate
                </button>
              </div>
            </div>

            <!-- Discount Value -->
            <div class="field">
              <label>Discount Value <span class="required">*</span></label>
              <div class="value-row">
                <div class="discount-type-btns">
                  <button
                    :class="['dtype-btn', form.type === 'percentage' ? 'active' : '']"
                    @click="form.type = 'percentage'"
                  >
                    % Percentage
                  </button>
                  <button
                    :class="['dtype-btn', form.type === 'fixed' ? 'active' : '']"
                    @click="form.type = 'fixed'"
                  >
                    {{ currencySymbol }} Fixed
                  </button>
                </div>
                <div class="value-input-wrap">
                  <input
                    v-model.number="form.value"
                    type="number"
                    min="0.01"
                    :max="form.type === 'percentage' ? 100 : undefined"
                    step="0.01"
                    :placeholder="form.type === 'percentage' ? '15' : '5.00'"
                    class="value-input"
                  />
                  <span class="value-suffix">{{
                    form.type === 'percentage' ? '%' : currencySymbol
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Time Window -->
            <div class="field">
              <label>
                Time Window
                <span class="label-hint">{{
                  form.isAuto
                    ? '(required for auto discount)'
                    : '(optional — leave blank for always active)'
                }}</span>
              </label>
              <div class="time-row">
                <div class="time-field">
                  <span class="time-label">Start</span>
                  <input v-model="form.starts_at" type="time" />
                </div>
                <div class="time-separator">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
                <div class="time-field">
                  <span class="time-label">End</span>
                  <input v-model="form.ends_at" type="time" />
                </div>
              </div>
            </div>

            <!-- Usage Limit -->
            <div class="field">
              <label>
                Usage Limit
                <span class="label-hint">(optional — blank = unlimited)</span>
              </label>
              <input
                v-model.number="form.usage_limit"
                type="number"
                min="1"
                placeholder="e.g. 100"
              />
            </div>

            <!-- Active Toggle -->
            <div class="field field-inline">
              <div class="field-inline-content">
                <label>Active Immediately</label>
                <span class="field-hint">Promotion will be live after saving</span>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="form.is_active" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Error -->
          <p v-if="formError" class="form-error">{{ formError }}</p>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="savePromo" :disabled="saving">
              <span v-if="saving" class="spinner-sm"></span>
              <span v-else>{{ editingPromo ? 'Save Changes' : 'Create Promotion' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ======================== DELETE CONFIRM ======================== -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2>Delete Promotion</h2>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <div class="warning-icon">⚠️</div>
              <p>
                Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong
                >?
              </p>
              <p class="warning-sub">
                This action cannot be undone. All usage history will be lost.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn-danger" @click="deletePromo" :disabled="saving">
              <span v-if="saving" class="spinner-sm"></span>
              <span v-else>Delete Permanently</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const restaurantId = computed(() => authStore.profile?.restaurant_id)
const currency = computed(() => authStore.restaurant?.currency || 'USD')
const currencySymbol = computed(() => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: '$',
    AUD: '$',
    KHR: '៛',
    THB: '฿',
    SGD: 'S$',
  }
  return symbols[currency.value] || currency.value + ' '
})

// ─── State ───────────────────────────────────────────────────
const promotions = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingPromo = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const formError = ref('')
const copiedCode = ref('')

const defaultForm = () => ({
  name: '',
  isAuto: false,
  code: '',
  type: 'percentage',
  value: '',
  starts_at: '',
  ends_at: '',
  usage_limit: '',
  is_active: true,
})
const form = ref(defaultForm())

// ─── Computed ─────────────────────────────────────────────────
const activePromos = computed(() => promotions.value.filter((p) => p.is_active))
const totalUsage = computed(() =>
  promotions.value.reduce((sum, p) => sum + (p.usage_count || 0), 0),
)

// ─── Fetch ────────────────────────────────────────────────────
async function fetchPromotions() {
  loading.value = true
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurantId.value)
    .order('created_at', { ascending: false })

  if (!error) promotions.value = data || []
  loading.value = false
}

// ─── Modal ────────────────────────────────────────────────────
function openModal(promo = null) {
  formError.value = ''
  if (promo) {
    editingPromo.value = promo
    form.value = {
      name: promo.name,
      isAuto: !promo.code,
      code: promo.code || '',
      type: promo.type,
      value: promo.value,
      starts_at: promo.starts_at || '',
      ends_at: promo.ends_at || '',
      usage_limit: promo.usage_limit || '',
      is_active: promo.is_active,
    }
  } else {
    editingPromo.value = null
    form.value = defaultForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingPromo.value = null
  formError.value = ''
}

// ─── Validate ─────────────────────────────────────────────────
function validate() {
  if (!form.value.name.trim()) return 'Promotion name is required.'
  if (!form.value.isAuto && !form.value.code.trim()) return 'Discount code is required.'
  if (!form.value.value || form.value.value <= 0) return 'Discount value must be greater than 0.'
  if (form.value.type === 'percentage' && form.value.value > 100)
    return 'Percentage cannot exceed 100.'
  if (form.value.isAuto && (!form.value.starts_at || !form.value.ends_at)) {
    return 'Auto discounts require a time window.'
  }
  if (
    (form.value.starts_at && !form.value.ends_at) ||
    (!form.value.starts_at && form.value.ends_at)
  ) {
    return 'Please set both start and end times.'
  }
  return null
}

// ─── Save ─────────────────────────────────────────────────────
async function savePromo() {
  formError.value = validate() || ''
  if (formError.value) return

  saving.value = true
  const payload = {
    restaurant_id: restaurantId.value,
    name: form.value.name.trim(),
    code: form.value.isAuto ? null : form.value.code.trim().toUpperCase(),
    type: form.value.type,
    value: form.value.value,
    starts_at: form.value.starts_at || null,
    ends_at: form.value.ends_at || null,
    usage_limit: form.value.usage_limit || null,
    is_active: form.value.is_active,
    updated_at: new Date().toISOString(),
  }

  let error
  if (editingPromo.value) {
    ;({ error } = await supabase.from('promotions').update(payload).eq('id', editingPromo.value.id))
  } else {
    ;({ error } = await supabase.from('promotions').insert(payload))
  }

  saving.value = false
  if (error) {
    formError.value =
      error.code === '23505'
        ? 'That discount code already exists. Try a different one.'
        : 'Failed to save. Please try again.'
    return
  }

  closeModal()
  fetchPromotions()
}

// ─── Toggle Active ────────────────────────────────────────────
async function toggleActive(promo) {
  await supabase
    .from('promotions')
    .update({ is_active: !promo.is_active, updated_at: new Date().toISOString() })
    .eq('id', promo.id)
  promo.is_active = !promo.is_active
}

// ─── Delete ───────────────────────────────────────────────────
function confirmDelete(promo) {
  deleteTarget.value = promo
}
async function deletePromo() {
  saving.value = true
  await supabase.from('promotions').delete().eq('id', deleteTarget.value.id)
  saving.value = false
  deleteTarget.value = null
  fetchPromotions()
}

// ─── Helpers ──────────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  form.value.code = Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

async function copyCode(code) {
  await navigator.clipboard.writeText(code)
  copiedCode.value = code
  setTimeout(() => {
    copiedCode.value = ''
  }, 2000)
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

// ─── Init ─────────────────────────────────────────────────────
onMounted(fetchPromotions)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

/* ── Page Layout ── */
.promotions-page {
  min-height: 100vh;
  background: #111111;
  padding: 32px 24px;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  -webkit-font-smoothing: antialiased;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .promotions-page {
    padding: 20px 16px;
  }
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    width: 100%;
  }
}

.page-title {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 6px;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  margin: 0;
}

.btn-primary {
  background: #c8733a;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(200, 115, 58, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #d4844e;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: 400;
}

/* ── Stats Bar ── */
.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.stat-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 160px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(255, 255, 255, 0.55);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.07);
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}

.empty-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  margin: 0 0 24px;
}

/* ── Promo Grid ── */
.promos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

@media (max-width: 640px) {
  .promos-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Promo Card ── */
.promo-card {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.promo-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  transform: translateY(-2px);
}

.promo-inactive {
  opacity: 0.5;
  filter: grayscale(0.5);
}

.promo-inactive:hover {
  opacity: 0.7;
  filter: grayscale(0.3);
}

.promo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.promo-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.badge-icon {
  font-size: 14px;
}

.badge-code {
  background: rgba(200, 115, 58, 0.15);
  color: #c8733a;
  border: 1px solid rgba(200, 115, 58, 0.25);
}

.badge-auto {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.25);
}

/* ── Toggle Switch ── */
.toggle {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  transition: all 0.2s ease;
  display: block;
  position: relative;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  background: #c8733a;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* ── Promo Info ── */
.promo-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.promo-name {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.3;
}

.promo-code-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0e0e0e;
  border: 1.5px solid rgba(200, 115, 58, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
  align-self: flex-start;
}

.code-text {
  font-family: 'Courier New', monospace;
  font-size: 15px;
  color: #c8733a;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.copy-btn {
  background: rgba(200, 115, 58, 0.15);
  border: none;
  border-radius: 6px;
  color: #c8733a;
  cursor: pointer;
  font-size: 14px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;
}

.copy-btn:hover {
  background: #c8733a;
  color: #ffffff;
}

.copy-btn.copied {
  background: #4ade80;
  color: #ffffff;
}

.promo-auto-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  font-style: italic;
}

.auto-dot {
  width: 8px;
  height: 8px;
  background: #a78bfa;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

/* ── Discount Value ── */
.promo-value-row {
  display: flex;
  align-items: center;
}

.discount-pill {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  font-size: 20px;
  padding: 10px 16px;
  border-radius: 10px;
}

.pill-pct {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.25);
}

.pill-fixed {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

/* ── Time ── */
.promo-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.35);
}

/* ── Usage ── */
.promo-usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.usage-count {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

.usage-limit {
  color: rgba(255, 255, 255, 0.35);
}

.usage-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 2px;
  overflow: hidden;
}

.usage-bar.infinite {
  background: rgba(255, 255, 255, 0.05);
}

.usage-bar.infinite .usage-fill {
  background: linear-gradient(90deg, rgba(200, 115, 58, 0.3), rgba(200, 115, 58, 0.6));
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

.usage-fill {
  height: 100%;
  background: #c8733a;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.usage-fill.full {
  background: #ef4444;
}

/* ── Actions ── */
.promo-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  margin-top: auto;
}

.btn-ghost {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.btn-icon-svg {
  width: 16px;
  height: 16px;
}

.btn-danger-ghost {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-danger-ghost:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-sm {
  max-width: 420px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 0;
  gap: 16px;
}

.modal-header-content h2 {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.modal-close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.55);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

/* ── Form Fields ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: #0e0e0e;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.field-inline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  gap: 6px;
}

.required {
  color: #ef4444;
}

.label-hint {
  color: rgba(255, 255, 255, 0.35);
  font-weight: 400;
}

input[type='text'],
input[type='number'],
input[type='time'] {
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #ffffff;
  padding: 12px 14px;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  border-color: #c8733a;
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.15);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

/* Type toggle */
.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.type-btn {
  background: #0e0e0e;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  text-align: center;
}

.type-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.75);
}

.type-btn.active {
  border-color: #c8733a;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.1);
}

.type-emoji {
  font-size: 24px;
  line-height: 1;
}

.type-title {
  font-size: 14px;
  font-weight: 700;
}

.type-hint {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);
}

.type-btn.active .type-hint {
  color: rgba(200, 115, 58, 0.8);
}

/* Code input */
.code-input-wrap {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.generate-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.generate-btn:hover {
  background: rgba(200, 115, 58, 0.15);
  border-color: rgba(200, 115, 58, 0.3);
  color: #c8733a;
}

/* Discount value */
.value-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discount-type-btns {
  display: flex;
  gap: 10px;
}

.dtype-btn {
  flex: 1;
  background: #0e0e0e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.55);
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dtype-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.75);
}

.dtype-btn.active {
  border-color: #c8733a;
  color: #c8733a;
  background: rgba(200, 115, 58, 0.1);
}

.value-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.value-input {
  flex: 1;
}

.value-suffix {
  color: rgba(255, 255, 255, 0.55);
  font-size: 18px;
  font-weight: 700;
  min-width: 24px;
}

/* Time row */
.time-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.time-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.time-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}

.time-separator {
  color: rgba(255, 255, 255, 0.35);
  padding-bottom: 12px;
  display: flex;
  align-items: center;
}

/* Error */
.form-error {
  margin: 0 24px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
}

/* Delete warning */
.delete-warning {
  text-align: center;
  padding: 16px 0;
}

.warning-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.delete-warning p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 8px;
  line-height: 1.5;
}

.warning-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Date/time input styling */
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.5;
  cursor: pointer;
}

input[type='time']::-webkit-calendar-picker-indicator:hover {
  opacity: 0.8;
}
</style>
