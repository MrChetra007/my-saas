<template>
  <div class="staff-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Staff</h1>
        <p class="page-subtitle">Manage team members and their permissions</p>
      </div>
      <button class="btn-invite" @click="openInviteModal">+ Invite Staff</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Loading team members…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="staffList.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>No staff members yet</h3>
      <p class="empty-text">Invite team members to manage kitchen, cashier, and waiter tasks</p>
      <button class="btn-invite" @click="openInviteModal">+ Invite Staff</button>
    </div>

    <!-- Staff list -->
    <div v-else class="staff-list-container">
      <!-- Desktop: Table -->
      <div v-if="!isMobile" class="staff-table-container">
        <table class="staff-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in staffList" :key="member.id" class="staff-row">
              <td class="td-name">
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(member.email) }">
                  {{ initials(member.full_name || member.email) }}
                </div>
                <div class="name-block">
                  <div class="member-name">{{ member.full_name || 'Unnamed' }}</div>
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
                  {{ member.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <button class="action-btn edit" title="Edit" @click="openEditModal(member)">
                  ✎
                </button>
                <button
                  class="action-btn"
                  :class="member.is_active ? 'deactivate' : 'activate'"
                  @click="toggleActive(member)"
                  :title="member.is_active ? 'Deactivate' : 'Reactivate'"
                >
                  {{ member.is_active ? '⏻' : '↻' }}
                </button>
                <button class="action-btn remove" title="Remove" @click="confirmRemove(member)">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile: Cards with icon-only actions -->
      <div v-else class="staff-cards">
        <div v-for="member in staffList" :key="member.id" class="staff-card">
          <div class="card-top">
            <div class="avatar" :style="{ backgroundColor: getAvatarColor(member.email) }">
              {{ initials(member.full_name || member.email) }}
            </div>
            <div class="card-info">
              <div class="member-name">{{ member.full_name || 'Unnamed' }}</div>
              <div class="member-email">{{ member.email }}</div>
            </div>
            <span class="status-pill mobile" :class="{ active: member.is_active }">
              {{ member.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="card-role">
            <span class="role-badge" :class="`role-${member.role}`">
              {{ roleLabel(member.role) }}
            </span>
          </div>

          <div class="card-actions">
            <button class="action-btn mobile" title="Edit" @click="openEditModal(member)">✎</button>
            <button
              class="action-btn mobile"
              :class="member.is_active ? 'deactivate' : 'activate'"
              @click="toggleActive(member)"
              :title="member.is_active ? 'Deactivate' : 'Reactivate'"
            >
              {{ member.is_active ? '⏻' : '↻' }}
            </button>
            <button class="action-btn mobile remove" title="Remove" @click="confirmRemove(member)">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <div v-if="inviteModal.open" class="modal-backdrop" @click.self="closeInviteModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Invite Staff Member</h2>
            <button class="modal-close-btn" @click="closeInviteModal">×</button>
          </div>
          <div class="modal-body">
            <div v-if="inviteModal.error" class="modal-error">{{ inviteModal.error }}</div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                v-model="inviteModal.form.fullName"
                class="form-input"
                type="text"
                placeholder="e.g. Priya Nair"
                :disabled="inviteModal.submitting"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                v-model="inviteModal.form.email"
                class="form-input"
                type="email"
                placeholder="e.g. priya@yourrestaurant.com"
                :disabled="inviteModal.submitting"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <select
                v-model="inviteModal.form.role"
                class="form-select"
                :disabled="inviteModal.submitting"
              >
                <option value="" disabled>Select role</option>
                <option value="kitchen">Kitchen Staff</option>
                <option value="cashier">Cashier</option>
                <option value="waiter">Waiter</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Temporary Password (optional)</label>
              <input
                v-model="inviteModal.form.password"
                class="form-input"
                type="text"
                placeholder="Auto-generated if blank"
                :disabled="inviteModal.submitting"
              />
            </div>

            <div v-if="inviteModal.form.role" class="role-description">
              {{ roleDescription(inviteModal.form.role) }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeInviteModal" :disabled="inviteModal.submitting">
              Cancel
            </button>
            <button
              class="btn-primary"
              @click="inviteStaff"
              :disabled="
                inviteModal.submitting || !inviteModal.form.email || !inviteModal.form.role
              "
            >
              {{ inviteModal.submitting ? 'Inviting…' : 'Send Invite' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="editModal.open" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Edit Staff Member</h2>
            <button class="modal-close-btn" @click="closeEditModal">×</button>
          </div>
          <div class="modal-body">
            <div v-if="editModal.error" class="modal-error">{{ editModal.error }}</div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                v-model="editModal.form.fullName"
                class="form-input"
                type="text"
                :disabled="editModal.submitting"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <select
                v-model="editModal.form.role"
                class="form-select"
                :disabled="editModal.submitting"
              >
                <option value="kitchen">Kitchen Staff</option>
                <option value="cashier">Cashier</option>
                <option value="waiter">Waiter</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select
                v-model="editModal.form.isActive"
                class="form-select"
                :disabled="editModal.submitting"
              >
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="closeEditModal" :disabled="editModal.submitting">
              Cancel
            </button>
            <button
              class="btn-primary"
              @click="saveEdit"
              :disabled="editModal.submitting || !editModal.form.fullName || !editModal.form.role"
            >
              {{ editModal.submitting ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Remove -->
    <Teleport to="body">
      <div v-if="confirm.open" class="modal-backdrop" @click.self="confirm.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">Remove Staff Member?</h2>
            <button class="modal-close-btn" @click="confirm.open = false">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              <strong>{{ confirm.member?.full_name || confirm.member?.email }}</strong> will be
              permanently removed.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="confirm.open = false">Cancel</button>
            <button
              class="btn-danger"
              @click="removeStaff(confirm.member)"
              :disabled="confirm.submitting"
            >
              {{ confirm.submitting ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(true)
const staffList = ref([])

const isMobile = ref(window.innerWidth <= 768)

const inviteModal = ref({
  open: false,
  submitting: false,
  error: '',
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

function resizeListener() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', resizeListener)
  fetchStaff()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeListener)
})

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

function openInviteModal() {
  inviteModal.value = {
    open: true,
    submitting: false,
    error: '',
    form: { fullName: '', email: '', role: '', password: '' },
  }
}

function closeInviteModal() {
  inviteModal.value.open = false
  inviteModal.value.error = ''
}

async function inviteStaff() {
  const m = inviteModal.value
  m.submitting = true
  m.error = ''

  try {
    const password = m.form.password.trim() || crypto.randomUUID().slice(0, 12)

    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: m.form.email.trim(),
      password,
      options: { data: { full_name: m.form.fullName.trim() } },
    })

    if (signUpErr) throw signUpErr
    if (!authData.user) throw new Error('User creation failed')

    const { error: rpcErr } = await supabase.rpc('create_staff_profile', {
      p_user_id: authData.user.id,
      p_email: m.form.email.trim(),
      p_full_name: m.form.fullName.trim(),
      p_role: m.form.role,
      p_restaurant_id: authStore.profile.restaurant_id,
    })

    if (rpcErr) throw rpcErr

    alert(`Staff invited!\nEmail: ${m.form.email}\nPassword: ${password}`)

    m.open = false
    await fetchStaff()
  } catch (err) {
    m.error = err.message || 'Failed to invite staff'
  } finally {
    m.submitting = false
  }
}

function openEditModal(member) {
  editModal.value = {
    open: true,
    submitting: false,
    error: '',
    member,
    form: {
      fullName: member.full_name || '',
      role: member.role,
      isActive: member.is_active,
    },
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
      .update({
        full_name: e.form.fullName.trim(),
        role: e.form.role,
        is_active: e.form.isActive,
      })
      .eq('id', e.member.id)

    if (error) throw error

    // Update local list
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
  } catch (err) {
    e.error = err.message || 'Failed to update'
  } finally {
    e.submitting = false
  }
}

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
  const { error } = await supabase.from('users').delete().eq('id', member.id)
  if (!error) {
    staffList.value = staffList.value.filter((m) => m.id !== member.id)
    confirm.value.open = false
  }
  confirm.value.submitting = false
}

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
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 55%)`
}

function roleLabel(role) {
  return { kitchen: 'Kitchen', cashier: 'Cashier', waiter: 'Waiter', admin: 'Admin' }[role] || role
}

function roleDescription(role) {
  return (
    {
      kitchen: 'Can view & update order status in Kitchen view (accept, prepare, ready)',
      cashier: 'Can mark orders as paid and handle payments',
      waiter: 'Can create & manage orders from tables',
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
  margin-bottom: 32px;
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

.btn-invite {
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

.btn-invite:hover {
  background: var(--color-accent-hover);
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

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: var(--color-text-faint);
}

.empty-text {
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 360px;
  margin: 12px 0 24px;
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

/* ── Common Action Button ───────────────────────── */
.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: 16px;
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
  font-size: 18px;
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
  font-size: 24px;
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
}

.modal-error {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
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
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
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
}

.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.confirm-text {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Mobile tweaks */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-invite {
    width: 100%;
  }

  .status-pill.mobile {
    font-size: 12px;
    padding: 4px 10px;
  }
}
</style>
