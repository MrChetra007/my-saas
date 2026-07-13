<template>
  <div class="staff-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ $t('staff.title') }}</h1>
        <p class="page-subtitle">{{ $t('staff.subtitle') }}</p>
      </div>
      <div class="header-right">
        <div class="limit-badge" :class="{ 'limit-reached': isAtLimit }">
          <Users :size="14" />
          <span>{{ staffList.length }} / {{ staffLimit }} {{ $t('staff.staff') }}</span>
          <span v-if="planLabel" class="plan-tag">{{ planLabel }}</span>
        </div>
        <button
          class="btn-add"
          @click="openAddModal"
          :disabled="isAtLimit"
          :title="isAtLimit ? $t('staff.limitReachedTitle') : ''"
        >
          <UserPlus :size="16" />
          {{ $t('staff.addStaff') }}
        </button>
      </div>
    </div>

    <!-- Limit warning banner -->
    <div v-if="isAtLimit" class="limit-banner">
      <AlertCircle :size="16" />
      <span
        >{{ $t('staff.limitBannerPrefix') }} <strong>{{ staffLimit }}{{ $t('staff.limitBannerMid') }}</strong> {{ $t('staff.limitBannerOnYour') }}
        {{ planLabel }} {{ $t('staff.limitBannerSuffix') }}</span
      >
      <a href="/app/settings" class="upgrade-link">{{ $t('staff.upgradeToPro') }}</a>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ $t('staff.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="staffList.length === 0" class="empty-state">
      <Users :size="64" class="empty-icon" />
      <h3>{{ $t('staff.noStaff') }}</h3>
      <p class="empty-text">{{ $t('staff.emptyDescription') }}</p>
      <button class="btn-add" @click="openAddModal" :disabled="isAtLimit">
        <UserPlus :size="16" />
        {{ $t('staff.addStaff') }}
      </button>
    </div>

    <!-- Staff list -->
    <div v-else class="staff-list-container">
      <!-- Desktop: Table -->
      <div v-if="!isMobile" class="staff-table-container">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ $t('staff.staffMember') }}</th>
              <th>{{ $t('staff.role') }}</th>
              <th>{{ $t('staff.status') }}</th>
              <th>{{ $t('staff.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in staffList" :key="member.id" class="staff-row">
              <td class="td-name">
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(member.email) }">
                  {{ initials(member.full_name || member.email) }}
                </div>
                <div class="name-block">
                  <div class="member-name">{{ member.full_name || $t('staff.unnamed') }}</div>
                  <div class="member-email">{{ member.email }}</div>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="`role-${member.role}`">
                  {{ roleLabel(member.role) }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="{ active: member.is_active }">
                  {{ member.is_active ? $t('staff.active') : $t('staff.inactive') }}
                </span>
              </td>
              <td class="td-actions">
                <button class="action-btn" :title="$t('staff.edit')" @click="openEditModal(member)">
                  <Pencil :size="15" />
                </button>
                <button
                  class="action-btn"
                  :class="member.is_active ? 'deactivate' : 'activate'"
                  @click="toggleActive(member)"
                  :title="member.is_active ? $t('staff.deactivate') : $t('staff.reactivate')"
                >
                  <PowerOff v-if="member.is_active" :size="15" />
                  <RefreshCw v-else :size="15" />
                </button>
                <button class="action-btn remove" :title="$t('staff.remove')" @click="confirmRemove(member)">
                  <Trash2 :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile: Cards -->
      <div v-else class="staff-cards">
        <div v-for="member in staffList" :key="member.id" class="staff-card">
          <div class="card-top">
            <div class="avatar" :style="{ backgroundColor: getAvatarColor(member.email) }">
              {{ initials(member.full_name || member.email) }}
            </div>
            <div class="card-info">
              <div class="member-name">{{ member.full_name || $t('staff.unnamed') }}</div>
              <div class="member-email">{{ member.email }}</div>
            </div>
            <span class="status-pill mobile" :class="{ active: member.is_active }">
              {{ member.is_active ? $t('staff.active') : $t('staff.inactive') }}
            </span>
          </div>
          <div class="card-role">
            <span class="role-badge" :class="`role-${member.role}`">
              {{ roleLabel(member.role) }}
            </span>
          </div>
          <div class="card-actions">
            <button class="action-btn mobile" :title="$t('staff.edit')" @click="openEditModal(member)">
              <Pencil :size="17" />
            </button>
            <button
              class="action-btn mobile"
              :class="member.is_active ? 'deactivate' : 'activate'"
              @click="toggleActive(member)"
              :title="member.is_active ? $t('staff.deactivate') : $t('staff.reactivate')"
            >
              <PowerOff v-if="member.is_active" :size="17" />
              <RefreshCw v-else :size="17" />
            </button>
            <button class="action-btn mobile remove" :title="$t('staff.remove')" @click="confirmRemove(member)">
              <Trash2 :size="17" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ Add Staff Modal ══ -->
    <Teleport to="body">
      <div v-if="addModal.open" class="modal-backdrop" @click.self="closeAddModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('staff.addStaffMember') }}</h2>
            <button class="modal-close-btn" @click="closeAddModal">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="addModal.error" class="modal-error">{{ addModal.error }}</div>

            <div class="form-group">
              <label class="form-label">{{ $t('staff.fullName') }}</label>
              <input
                v-model="addModal.form.fullName"
                class="form-input"
                type="text"
                :placeholder="$t('staff.fullNamePlaceholder')"
                :disabled="addModal.submitting"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('staff.emailAddress') }}</label>
              <input
                v-model="addModal.form.email"
                class="form-input"
                type="email"
                :placeholder="$t('staff.emailPlaceholder')"
                :disabled="addModal.submitting"
              />
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('staff.roleLabel') }}</label>
              <select
                v-model="addModal.form.role"
                class="form-select"
                :disabled="addModal.submitting"
              >
                <option value="" disabled>{{ $t('staff.selectRole') }}</option>
                <option value="kitchen">{{ $t('staff.kitchenStaff') }}</option>
                <option value="cashier">{{ $t('staff.cashier') }}</option>
                <option value="waiter">{{ $t('staff.waiter') }}</option>
              </select>
              <p v-if="addModal.form.role" class="role-description">
                {{ roleDescription(addModal.form.role) }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ $t('staff.passwordLabel') }}
                <span class="field-required">{{ $t('staff.required') }}</span>
              </label>
              <div class="password-wrap">
                <input
                  v-model="addModal.form.password"
                  class="form-input password-input"
                  :type="addModal.showPassword ? 'text' : 'password'"
                  :placeholder="$t('staff.passwordPlaceholder')"
                  :disabled="addModal.submitting"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="addModal.showPassword = !addModal.showPassword"
                  :title="addModal.showPassword ? $t('staff.hidePassword') : $t('staff.showPassword')"
                >
                  <!-- Eye open -->
                  <svg
                    v-if="!addModal.showPassword"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <!-- Eye off -->
                  <svg
                    v-else
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                    />
                    <path
                      d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <!-- Strength bar -->
              <div v-if="addModal.form.password" class="strength-bar-wrap">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="`strength-${passwordStrength(addModal.form.password).level}`"
                    :style="{ width: passwordStrength(addModal.form.password).pct + '%' }"
                  />
                </div>
                <span
                  class="strength-label"
                  :class="`strength-text-${passwordStrength(addModal.form.password).level}`"
                >
                  {{ passwordStrength(addModal.form.password).label }}
                </span>
              </div>
              <p class="field-hint">{{ $t('staff.passwordHint') }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeAddModal" :disabled="addModal.submitting">
              {{ $t('common.cancel') }}
            </button>
            <button
              class="btn-primary"
              @click="addStaff"
              :disabled="
                addModal.submitting ||
                !addModal.form.email ||
                !addModal.form.role ||
                !addModal.form.password
              "
            >
              <Loader2 v-if="addModal.submitting" :size="15" class="spin-icon" />
              <UserPlus v-else :size="15" />
              {{ addModal.submitting ? $t('staff.adding') : $t('staff.addStaff') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ Edit Modal ══ -->
    <Teleport to="body">
      <div v-if="editModal.open" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('staff.editStaffMember') }}</h2>
            <button class="modal-close-btn" @click="closeEditModal">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="editModal.error" class="modal-error">{{ editModal.error }}</div>
            <div class="form-group">
              <label class="form-label">{{ $t('staff.fullName') }}</label>
              <input
                v-model="editModal.form.fullName"
                class="form-input"
                type="text"
                :disabled="editModal.submitting"
              />
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('staff.roleLabel') }}</label>
              <select
                v-model="editModal.form.role"
                class="form-select"
                :disabled="editModal.submitting"
              >
                <option value="kitchen">{{ $t('staff.kitchenStaff') }}</option>
                <option value="cashier">{{ $t('staff.cashier') }}</option>
                <option value="waiter">{{ $t('staff.waiter') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('staff.status') }}</label>
              <select
                v-model="editModal.form.isActive"
                class="form-select"
                :disabled="editModal.submitting"
              >
                <option :value="true">{{ $t('staff.active') }}</option>
                <option :value="false">{{ $t('staff.inactive') }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeEditModal" :disabled="editModal.submitting">
              {{ $t('common.cancel') }}
            </button>
            <button
              class="btn-primary"
              @click="saveEdit"
              :disabled="editModal.submitting || !editModal.form.fullName || !editModal.form.role"
            >
              <Loader2 v-if="editModal.submitting" :size="15" class="spin-icon" />
              <Check v-else :size="15" />
              {{ editModal.submitting ? $t('common.saving') : $t('staff.saveChanges') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ Confirm Remove ══ -->
    <Teleport to="body">
      <div v-if="confirm.open" class="modal-backdrop" @click.self="confirm.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('staff.removeStaffTitle') }}</h2>
            <button class="modal-close-btn" @click="confirm.open = false">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              <strong>{{ confirm.member?.full_name || confirm.member?.email }}</strong> {{ $t('staff.removeWarning') }}
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="confirm.open = false">{{ $t('common.cancel') }}</button>
            <button
              class="btn-danger"
              @click="removeStaff(confirm.member)"
              :disabled="confirm.submitting"
            >
              <Loader2 v-if="confirm.submitting" :size="15" class="spin-icon" />
              <Trash2 v-else :size="15" />
              {{ confirm.submitting ? $t('staff.removing') : $t('staff.remove') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ Success Modal ══ -->
    <SuccessModal
      v-model="successModal.open"
      :title="successModal.title"
      :message="successModal.message"
      :details="successModal.details"
      :warning="successModal.warning"
      :close-label="$t('common.done')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Users,
  UserPlus,
  Pencil,
  PowerOff,
  RefreshCw,
  Trash2,
  X,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import SuccessModal from '@/components/SuccessModal.vue'

const authStore = useAuthStore()
const { t } = useI18n()

const loading = ref(true)
const staffList = ref([])
const restaurantPlan = ref(null)
const trialEndsAt = ref(null)
const isMobile = ref(window.innerWidth <= 768)

// ── Plan Limits ───────────────────────────────────
const STAFF_LIMITS = {
  trial: 3,
  starter: 3,
  pro: 10,
  enterprise: Infinity,
}

const resolvedPlan = computed(() => {
  const plan = restaurantPlan.value
  if (!plan || plan === 'expired') return 'starter'
  if (plan === 'trial') {
    if (trialEndsAt.value && new Date(trialEndsAt.value) < new Date()) return 'starter'
    return 'trial'
  }
  return plan
})

const staffLimit = computed(() => STAFF_LIMITS[resolvedPlan.value] ?? 3)

const planLabel = computed(
  () =>
    ({
      trial: t('staff.planTrial'),
      starter: t('staff.planStarter'),
      pro: t('staff.planPro'),
      enterprise: t('staff.planEnterprise'),
    })[resolvedPlan.value] || '',
)

const isAtLimit = computed(() => {
  if (staffLimit.value === Infinity) return false
  return staffList.value.length >= staffLimit.value
})

// ── Modals ────────────────────────────────────────
const addModal = ref({
  open: false,
  submitting: false,
  error: '',
  showPassword: false,
  form: { fullName: '', email: '', role: '', password: '' },
})

const editModal = ref({
  open: false,
  submitting: false,
  error: '',
  member: null,
  form: { fullName: '', role: '', isActive: true },
})

const confirm = ref({ open: false, member: null, submitting: false })

// ── Success Modal ────────────────────────────────
const successModal = ref({
  open: false,
  title: '',
  message: '',
  details: [],
  warning: '',
})

function showSuccess({ title, message, details = [], warning = '' }) {
  successModal.value = { open: true, title, message, details, warning }
}

// ── Password strength ────────────────────────────
function passwordStrength(pw) {
  if (!pw) return { level: 'empty', label: '', pct: 0 }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { level: 'weak', label: t('staff.passwordWeak'), pct: 25 }
  if (score === 2) return { level: 'fair', label: t('staff.passwordFair'), pct: 50 }
  if (score === 3) return { level: 'good', label: t('staff.passwordGood'), pct: 75 }
  return { level: 'strong', label: t('staff.passwordStrong'), pct: 100 }
}

function resizeListener() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', resizeListener)
  fetchPlan()
  fetchStaff()
})

onBeforeUnmount(() => window.removeEventListener('resize', resizeListener))

// ── Fetch plan ────────────────────────────────────
async function fetchPlan() {
  const { data } = await supabase
    .from('restaurants')
    .select('plan, trial_ends_at')
    .eq('id', authStore.profile?.restaurant_id)
    .single()

  if (data) {
    restaurantPlan.value = data.plan
    trialEndsAt.value = data.trial_ends_at
  }
}

// ── Fetch staff ───────────────────────────────────
async function fetchStaff() {
  loading.value = true
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (!error) staffList.value = data || []
  loading.value = false
}

// ── Add Staff ─────────────────────────────────────
function openAddModal() {
  if (isAtLimit.value) return
  addModal.value = {
    open: true,
    submitting: false,
    error: '',
    showPassword: false,
    form: { fullName: '', email: '', role: '', password: '' },
  }
}

function closeAddModal() {
  addModal.value.open = false
  addModal.value.error = ''
}

async function addStaff() {
  const m = addModal.value

  if (isAtLimit.value) {
    m.error = `${t('staff.limitErrorPrefix')} ${staffLimit.value}${t('staff.limitErrorMid')} ${planLabel.value} ${t('staff.limitErrorSuffix')}`
    return
  }

  if (!m.form.password.trim()) {
    m.error = t('staff.passwordRequired')
    return
  }

  if (m.form.password.trim().length < 8) {
    m.error = t('staff.passwordMinLength')
    return
  }

  m.submitting = true
  m.error = ''

  try {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
      body: {
        email: m.form.email.trim(),
        password: m.form.password.trim(),
        full_name: m.form.fullName.trim(),
        role: m.form.role,
        restaurant_id: authStore.profile.restaurant_id,
      },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    m.open = false

    showSuccess({
      title: t('staff.addedTitle'),
      message: `${m.form.fullName || m.form.email} ${t('staff.addedMessage')} ${roleLabel(m.form.role)}.`,
      details: [
        { label: t('staff.email'), value: m.form.email.trim(), copyable: true },
        { label: t('staff.passwordLabel'), value: m.form.password.trim(), copyable: true },
        { label: t('staff.roleLabel'), value: roleLabel(m.form.role), copyable: false },
      ],
      warning: t('staff.saveCredentialsWarning'),
    })

    await fetchStaff()
  } catch (err) {
    m.error = err.message || t('staff.failedToAdd')
  } finally {
    m.submitting = false
  }
}

// ── Edit ──────────────────────────────────────────
function openEditModal(member) {
  editModal.value = {
    open: true,
    submitting: false,
    error: '',
    member,
    form: { fullName: member.full_name || '', role: member.role, isActive: member.is_active },
  }
}

function closeEditModal() {
  editModal.value.open = false
  editModal.value.error = ''
}

async function saveEdit() {
  const e = editModal.value
  e.submitting = true
  e.error = ''

  try {
    const { error } = await supabase
      .from('users')
      .update({ full_name: e.form.fullName.trim(), role: e.form.role, is_active: e.form.isActive })
      .eq('id', e.member.id)

    if (error) throw error

    const idx = staffList.value.findIndex((m) => m.id === e.member.id)
    if (idx !== -1) {
      staffList.value[idx] = {
        ...staffList.value[idx],
        full_name: e.form.fullName.trim(),
        role: e.form.role,
        is_active: e.form.isActive,
      }
    }
    e.open = false

    showSuccess({
      title: t('staff.changesSaved'),
      message: `${e.form.fullName || t('staff.staffMember')} ${t('staff.updatedMessage')}`,
    })
  } catch (err) {
    e.error = err.message || t('staff.failedToUpdate')
  } finally {
    e.submitting = false
  }
}

// ── Toggle / Remove ───────────────────────────────
async function toggleActive(member) {
  const newState = !member.is_active
  const { error } = await supabase.from('users').update({ is_active: newState }).eq('id', member.id)
  if (!error) member.is_active = newState
}

function confirmRemove(member) {
  confirm.value = { open: true, member, submitting: false }
}

async function removeStaff(member) {
  confirm.value.submitting = true

  const { error } = await supabase.functions.invoke('delete-staff-user', {
    body: { user_id: member.id },
  })

  if (!error) {
    staffList.value = staffList.value.filter((m) => m.id !== member.id)
    confirm.value.open = false
  }
  confirm.value.submitting = false
}

// ── Helpers ───────────────────────────────────────
function initials(str) {
  if (!str) return '?'
  return str
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}

function getAvatarColor(email) {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`
}

function roleLabel(role) {
  return { kitchen: t('staff.roleKitchen'), cashier: t('staff.roleCashier'), waiter: t('staff.roleWaiter'), admin: t('staff.roleAdmin') }[role] || role
}

function roleDescription(role) {
  return (
    {
      kitchen: t('staff.roleKitchenDesc'),
      cashier: t('staff.roleCashierDesc'),
      waiter: t('staff.roleWaiterDesc'),
    }[role] || ''
  )
}
</script>

<style scoped>
.staff-page {
  padding: 0 4px;
}

/* ── Header ─────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Limit badge ─────────────────────────────────── */
.limit-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
}

.limit-badge.limit-reached {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.plan-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-muted);
  color: var(--color-accent);
}

/* ── Limit banner ────────────────────────────────── */
.limit-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-size: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.upgrade-link {
  margin-left: auto;
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.upgrade-link:hover {
  text-decoration: underline;
}

/* ── Add button ──────────────────────────────────── */
.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-add:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-add:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── States ─────────────────────────────────────── */
.loading-state,
.empty-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  gap: 8px;
}

.empty-icon {
  color: var(--color-text-faint);
  margin-bottom: 8px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.spin-icon {
  animation: spin 1s linear infinite;
}

.empty-text {
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 360px;
  margin: 4px 0 16px;
}

/* ── Desktop Table ──────────────────────────────── */
.staff-table-container {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
}

.staff-table th,
.staff-table td {
  padding: 16px 20px;
  text-align: left;
}

.staff-table thead th {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.staff-row {
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 0.14s;
}

.staff-row:hover {
  background: var(--color-accent-muted);
}

.td-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-name {
  font-weight: 600;
  color: var(--color-text-primary);
}
.member-email {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.role-kitchen {
  background: var(--color-accent);
}
.role-cashier {
  background: #3b82f6;
}
.role-waiter {
  background: #10b981;
}

.status-pill {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
}

.status-pill.active {
  background: rgba(74, 222, 128, 0.15);
  border-color: #4ade80;
  color: #4ade80;
}

.td-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* ── Action Button ──────────────────────────────── */
.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.14s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

.action-btn.deactivate:hover,
.action-btn.remove:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.action-btn.activate:hover {
  background: rgba(74, 222, 128, 0.12);
  border-color: #4ade80;
  color: #4ade80;
}

/* ── Mobile Cards ───────────────────────────────── */
.staff-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.staff-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 16px;
  box-shadow: var(--shadow-card);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.card-info {
  flex: 1;
}
.card-role {
  margin-bottom: 16px;
}
.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.action-btn.mobile {
  width: 44px;
  height: 44px;
  flex: 1;
  max-width: 44px;
}

/* ── Modals ─────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
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
  max-width: 480px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-float);
  overflow: hidden;
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-error {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  margin-bottom: 20px;
  font-size: 13.5px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.field-required {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(200, 115, 58, 0.12);
  border: 1px solid rgba(200, 115, 58, 0.25);
  color: var(--color-accent, #c8733a);
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 15px;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

/* ── Password field ─────────────────────────────── */
.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 46px !important;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s;
}

.password-toggle:hover {
  color: var(--color-text-primary);
}

/* ── Strength bar ───────────────────────────────── */
.strength-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border-medium, rgba(255, 255, 255, 0.1));
  border-radius: 99px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 99px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.strength-weak {
  background: #ef4444;
}
.strength-fair {
  background: #f59e0b;
}
.strength-good {
  background: #3b82f6;
}
.strength-strong {
  background: #4ade80;
}

.strength-label {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.strength-text-weak {
  color: #ef4444;
}
.strength-text-fair {
  color: #f59e0b;
}
.strength-text-good {
  color: #3b82f6;
}
.strength-text-strong {
  color: #4ade80;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 6px;
}

.role-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  margin-top: 8px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
}

.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.confirm-text {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* ── Mobile tweaks ──────────────────────────────── */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .btn-add {
    flex: 1;
    justify-content: center;
  }
  .status-pill.mobile {
    font-size: 12px;
    padding: 4px 10px;
  }
  .limit-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .upgrade-link {
    margin-left: 0;
  }
}
</style>
