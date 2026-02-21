<template>
  <div class="promotions-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Promotions</h1>
        <p class="page-subtitle">Manage discount codes and automatic offers</p>
      </div>
      <button class="btn-primary" @click="openModal()">
        <span class="btn-icon">＋</span> New Promotion
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-pill">
        <span class="stat-value">{{ activePromos.length }}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat-pill">
        <span class="stat-value">{{ promotions.length }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-pill">
        <span class="stat-value">{{ totalUsage }}</span>
        <span class="stat-label">Times Used</span>
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
      <h3>No promotions yet</h3>
      <p>Create your first discount code or happy hour offer</p>
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
            {{ promo.code ? '🎟 Code' : '⏰ Auto' }}
          </div>
          <div class="promo-toggle-wrap">
            <label class="toggle">
              <input type="checkbox" :checked="promo.is_active" @change="toggleActive(promo)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Name & Code -->
        <div class="promo-info">
          <h3 class="promo-name">{{ promo.name }}</h3>
          <div v-if="promo.code" class="promo-code-tag">
            <span class="code-text">{{ promo.code.toUpperCase() }}</span>
            <button class="copy-btn" @click="copyCode(promo.code)" title="Copy code">⧉</button>
          </div>
          <div v-else class="promo-auto-label">Applies automatically</div>
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
          <span class="time-icon">🕐</span>
          {{ formatTime(promo.starts_at) }} – {{ formatTime(promo.ends_at) }}
        </div>

        <!-- Usage -->
        <div class="promo-usage">
          <span class="usage-count">{{ promo.usage_count }} uses</span>
          <span v-if="promo.usage_limit" class="usage-limit"> / {{ promo.usage_limit }} limit</span>
          <span v-else class="usage-limit"> / unlimited</span>
        </div>
        <div v-if="promo.usage_limit" class="usage-bar">
          <div
            class="usage-fill"
            :style="{ width: Math.min((promo.usage_count / promo.usage_limit) * 100, 100) + '%' }"
          ></div>
        </div>

        <!-- Actions -->
        <div class="promo-actions">
          <button class="btn-ghost" @click="openModal(promo)">Edit</button>
          <button class="btn-danger-ghost" @click="confirmDelete(promo)">Delete</button>
        </div>
      </div>
    </div>

    <!-- ======================== MODAL ======================== -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingPromo ? 'Edit Promotion' : 'New Promotion' }}</h2>
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
                  🎟 Discount Code
                  <span class="type-hint">Customer enters a code at checkout</span>
                </button>
                <button
                  :class="['type-btn', form.isAuto ? 'active' : '']"
                  @click="form.isAuto = true"
                >
                  ⏰ Auto Discount
                  <span class="type-hint">Applies automatically by time</span>
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
                <button class="generate-btn" @click="generateCode" type="button">Generate</button>
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
                    {{ currencySymbol }} Fixed Amount
                  </button>
                </div>
                <input
                  v-model.number="form.value"
                  type="number"
                  min="0.01"
                  :max="form.type === 'percentage' ? 100 : undefined"
                  step="0.01"
                  :placeholder="form.type === 'percentage' ? 'e.g. 15' : 'e.g. 5.00'"
                  class="value-input"
                />
                <span class="value-suffix">{{
                  form.type === 'percentage' ? '%' : currencySymbol
                }}</span>
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
                  <span class="time-label">From</span>
                  <input v-model="form.starts_at" type="time" />
                </div>
                <span class="time-sep">→</span>
                <div class="time-field">
                  <span class="time-label">To</span>
                  <input v-model="form.ends_at" type="time" />
                </div>
              </div>
            </div>

            <!-- Usage Limit -->
            <div class="field">
              <label
                >Usage Limit <span class="label-hint">(optional — blank = unlimited)</span></label
              >
              <input
                v-model.number="form.usage_limit"
                type="number"
                min="1"
                placeholder="e.g. 100"
              />
            </div>

            <!-- Active Toggle -->
            <div class="field field-inline">
              <label>Active</label>
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
              {{ saving ? 'Saving…' : editingPromo ? 'Save Changes' : 'Create Promotion' }}
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
            <p>
              Delete <strong>{{ deleteTarget.name }}</strong
              >? This cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteTarget = null">Cancel</button>
            <button class="btn-danger" @click="deletePromo" :disabled="saving">
              {{ saving ? 'Deleting…' : 'Delete' }}
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
  const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$' }
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
  }, 1500)
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
/* ── Page Layout ── */
.promotions-page {
  padding: 2rem;
  max-width: 1100px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.25rem;
}
.page-subtitle {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

/* ── Stats Bar ── */
.stats-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-pill {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1;
}
.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* ── Buttons ── */
.btn-primary {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1.25rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-primary:hover {
  background: #ea6c09;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  border-radius: 7px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: #64748b;
  color: #f1f5f9;
}
.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover {
  background: #dc2626;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-danger-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: #f87171;
  border-radius: 7px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger-ghost:hover {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.08);
}
.btn-icon {
  font-size: 1.1em;
  line-height: 1;
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #334155;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.empty-state h3 {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
}
.empty-state p {
  margin: 0 0 1.5rem;
}

/* ── Promo Grid ── */
.promos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ── Promo Card ── */
.promo-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 1.25rem;
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.promo-card:hover {
  border-color: #475569;
  transform: translateY(-1px);
}
.promo-inactive {
  opacity: 0.5;
}

.promo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}
.promo-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  letter-spacing: 0.02em;
}
.badge-code {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}
.badge-auto {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.promo-info {
  margin-bottom: 0.85rem;
}
.promo-name {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.4rem;
}
.promo-code-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
}
.code-text {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #f97316;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.copy-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.copy-btn:hover {
  color: #f1f5f9;
}
.promo-auto-label {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
}

.promo-value-row {
  margin-bottom: 0.75rem;
}
.discount-pill {
  display: inline-block;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
}
.pill-pct {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}
.pill-fixed {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.promo-time {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.promo-usage {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.4rem;
}
.usage-count {
  color: #94a3b8;
}
.usage-bar {
  height: 4px;
  background: #0f172a;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.9rem;
}
.usage-fill {
  height: 100%;
  background: #f97316;
  border-radius: 2px;
  transition: width 0.3s;
}

.promo-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.85rem;
  border-top: 1px solid #1e293b;
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
  width: 40px;
  height: 22px;
  background: #334155;
  border-radius: 11px;
  transition: background 0.2s;
  display: block;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
}
.toggle input:checked + .toggle-slider {
  background: #f97316;
}
.toggle input:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}
.modal-sm {
  max-width: 380px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
}
.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.15s;
}
.modal-close:hover {
  color: #f1f5f9;
}
.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #334155;
}

/* ── Form Fields ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.field-inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #94a3b8;
}
.required {
  color: #f87171;
}
.label-hint {
  color: #475569;
  font-weight: 400;
}
input[type='text'],
input[type='number'],
input[type='time'] {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #f1f5f9;
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
input:focus {
  border-color: #f97316;
}
input::placeholder {
  color: #475569;
}

/* Type toggle */
.type-toggle {
  display: flex;
  gap: 0.75rem;
}
.type-btn {
  flex: 1;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 10px;
  padding: 0.75rem;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.15s;
}
.type-btn.active {
  border-color: #f97316;
  color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}
.type-hint {
  font-size: 0.72rem;
  font-weight: 400;
  color: #475569;
  text-align: center;
}
.type-btn.active .type-hint {
  color: #f97316;
  opacity: 0.7;
}

/* Code input */
.code-input-wrap {
  display: flex;
  gap: 0.5rem;
}
.code-input {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.generate-btn {
  background: #334155;
  border: none;
  border-radius: 8px;
  color: #94a3b8;
  padding: 0 1rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
}
.generate-btn:hover {
  background: #475569;
  color: #f1f5f9;
}

/* Discount value */
.value-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.discount-type-btns {
  display: flex;
  gap: 0.5rem;
}
.dtype-btn {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 7px;
  color: #64748b;
  padding: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.dtype-btn.active {
  border-color: #f97316;
  color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}
.value-row-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.value-input {
  flex: 1;
}
.value-suffix {
  color: #64748b;
  font-size: 0.9rem;
  min-width: 24px;
  text-align: right;
}

/* Time row */
.time-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.time-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}
.time-label {
  font-size: 0.75rem;
  color: #64748b;
}
.time-sep {
  color: #475569;
  font-size: 1rem;
  padding-top: 1.5rem;
}

/* Error */
.form-error {
  margin: 0;
  padding: 0 1.5rem 0.5rem;
  color: #f87171;
  font-size: 0.82rem;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .promotions-page {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
  }
  .promos-grid {
    grid-template-columns: 1fr;
  }
  .type-toggle {
    flex-direction: column;
  }
}
</style>
