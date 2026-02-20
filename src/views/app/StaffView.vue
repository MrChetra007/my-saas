<template>
  <div class="staff-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="header-sub">Manage your team</p>
        <h1 class="header-title">Staff</h1>
      </div>
      <button class="btn-invite" @click="showModal = true">+ Add Staff</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 3" :key="n" class="skeleton-row"></div>
    </div>

    <template v-else>
      <div class="staff-panel">
        <div v-if="staffList.length === 0" class="empty-state">
          <span class="empty-icon">👥</span>
          <p>No staff members yet.</p>
          <p class="empty-sub">Add your first team member to get started.</p>
        </div>

        <table v-else class="staff-table">
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in staffList" :key="member.id" class="staff-row">
              <td class="td-name">
                <div class="avatar">{{ initials(member.full_name || member.email) }}</div>
                <div>
                  <p class="member-name">{{ member.full_name || '—' }}</p>
                  <p class="member-email">{{ member.email }}</p>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="`role--${member.role}`">
                  {{ roleLabel(member.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="member.is_active ? 'active' : 'inactive'">
                  {{ member.is_active ? 'Active' : 'Deactivated' }}
                </span>
              </td>
              <td class="td-date">{{ formatDate(member.created_at) }}</td>
              <td class="td-actions">
                <button
                  v-if="member.is_active"
                  class="btn-action btn-deactivate"
                  @click="confirmAction('deactivate', member)"
                >
                  Deactivate
                </button>
                <button v-else class="btn-action btn-activate" @click="reactivateMember(member)">
                  Reactivate
                </button>
                <button class="btn-action btn-remove" @click="confirmAction('remove', member)">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Add Staff Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Add Staff Member</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input
                  v-model="form.fullName"
                  type="text"
                  class="form-input"
                  placeholder="e.g. Maria Santos"
                  :disabled="submitting"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  placeholder="e.g. maria@restaurant.com"
                  :disabled="submitting"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Temporary Password</label>
                <input
                  v-model="form.password"
                  type="text"
                  class="form-input"
                  placeholder="Min. 6 characters"
                  :disabled="submitting"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select v-model="form.role" class="form-input" :disabled="submitting">
                  <option value="" disabled>Select a role...</option>
                  <option value="kitchen">👨‍🍳 Kitchen</option>
                  <option value="cashier">💳 Cashier</option>
                  <option value="waiter">🛎️ Waiter</option>
                </select>
              </div>
            </div>

            <div class="role-hint" v-if="form.role">
              <span class="hint-icon">ℹ️</span>
              <span>{{ roleHint(form.role) }}</span>
            </div>

            <div v-if="formError" class="alert alert--error">{{ formError }}</div>
            <div v-if="formSuccess" class="alert alert--success">{{ formSuccess }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal" :disabled="submitting">Cancel</button>
            <button
              class="btn-submit"
              @click="createStaff"
              :disabled="
                submitting || !form.fullName || !form.email || !form.password || !form.role
              "
            >
              <span v-if="submitting" class="spinner"></span>
              {{ submitting ? 'Creating...' : 'Create Account' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Confirm Modal -->
    <Transition name="modal">
      <div v-if="confirmTarget" class="modal-overlay" @click.self="confirmTarget = null">
        <div class="modal modal--sm">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ confirmType === 'remove' ? 'Remove staff member?' : 'Deactivate staff member?' }}
            </h2>
            <button class="modal-close" @click="confirmTarget = null">✕</button>
          </div>
          <div class="modal-body">
            <p class="confirm-desc">
              <template v-if="confirmType === 'remove'">
                <strong>{{ confirmTarget.full_name || confirmTarget.email }}</strong> will be
                permanently removed from your team.
              </template>
              <template v-else>
                <strong>{{ confirmTarget.full_name || confirmTarget.email }}</strong> will lose
                access to the app. You can reactivate them at any time.
              </template>
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="confirmTarget = null">Cancel</button>
            <button
              class="btn-submit btn-submit--danger"
              @click="
                confirmType === 'remove'
                  ? removeMember(confirmTarget)
                  : deactivateMember(confirmTarget)
              "
            >
              {{ confirmType === 'remove' ? 'Remove' : 'Deactivate' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(true)
const staffList = ref([])
const showModal = ref(false)
const submitting = ref(false)
const formError = ref('')
const formSuccess = ref('')

const confirmTarget = ref(null)
const confirmType = ref('')

const form = ref({ fullName: '', email: '', password: '', role: '' })

const hints = {
  kitchen: 'Can view and manage orders in the kitchen view — accept, reject, and mark as ready.',
  cashier: 'Can mark ready orders as paid in the orders view.',
  waiter: 'Can place orders on behalf of customers from any table.',
}

const roleLabels = {
  kitchen: 'Kitchen',
  cashier: 'Cashier',
  waiter: 'Waiter',
  admin: 'Admin',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(str) {
  if (!str) return '?'
  return str
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}
function roleLabel(role) {
  return roleLabels[role] || role
}
function roleHint(role) {
  return hints[role] || ''
}
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
function closeModal() {
  if (submitting.value) return
  showModal.value = false
  formError.value = ''
  formSuccess.value = ''
  form.value = { fullName: '', email: '', password: '', role: '' }
}
function confirmAction(type, member) {
  confirmType.value = type
  confirmTarget.value = member
}

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ])

// ─── Fetch Staff ──────────────────────────────────────────────────────────────

async function fetchStaff() {
  loading.value = true
  const restaurantId = authStore.profile?.restaurant_id

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('restaurant_id', restaurantId)
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  if (!error) staffList.value = data || []
  loading.value = false
}

// ─── Create Staff ─────────────────────────────────────────────────────────────
//
// Strategy (mirrors SignupView.vue):
//   1. supabase.auth.signUp() creates the auth account.
//      Because email confirmation is OFF, this returns a session for the NEW user.
//   2. We immediately call an RPC (create_staff_profile) with SECURITY DEFINER
//      so it runs as superuser — bypassing the RLS problem where the new user's
//      get_my_restaurant_id() would return null and block the insert.
//   3. We restore the admin session so the admin stays logged in.
//
// The RPC to add in Supabase SQL Editor:
//
//   CREATE OR REPLACE FUNCTION create_staff_profile(
//     p_user_id      uuid,
//     p_email        text,
//     p_full_name    text,
//     p_role         text,
//     p_restaurant_id uuid
//   )
//   RETURNS void
//   LANGUAGE plpgsql
//   SECURITY DEFINER
//   SET search_path = public
//   AS $$
//   BEGIN
//     INSERT INTO users (id, email, full_name, role, restaurant_id, is_active)
//     VALUES (p_user_id, p_email, p_full_name, p_role, p_restaurant_id, true)
//     ON CONFLICT (id) DO UPDATE
//       SET full_name = EXCLUDED.full_name,
//           role = EXCLUDED.role,
//           restaurant_id = EXCLUDED.restaurant_id,
//           is_active = true;
//   END;
//   $$;

async function createStaff() {
  formError.value = ''
  formSuccess.value = ''

  if (form.value.password.length < 6) {
    formError.value = 'Password must be at least 6 characters.'
    return
  }

  submitting.value = true

  // Save admin session before signUp() switches it to the new user
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession()

  try {
    // Step 1: Create auth account (email confirmation must be OFF in Supabase)
    const { data: authData, error: signUpErr } = await withTimeout(
      supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
      }),
    )

    if (signUpErr) throw new Error(signUpErr.message)
    if (!authData.user) throw new Error('Account creation failed. Please try again.')

    // Step 2: Call SECURITY DEFINER RPC to insert the profile row.
    // This bypasses RLS entirely — same pattern as create_restaurant_and_profile.
    // Even if Supabase briefly switched the session to the new user, the RPC
    // runs as superuser so it doesn't matter.
    const { error: rpcErr } = await withTimeout(
      supabase.rpc('create_staff_profile', {
        p_user_id: authData.user.id,
        p_email: form.value.email,
        p_full_name: form.value.fullName,
        p_role: form.value.role,
        p_restaurant_id: authStore.profile?.restaurant_id,
      }),
    )

    if (rpcErr) throw new Error(rpcErr.message)

    // Step 3: Restore admin session so the admin stays logged in
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
    }

    formSuccess.value = `✅ Account created for ${form.value.fullName}. They can log in with those credentials.`
    form.value = { fullName: '', email: '', password: '', role: '' }
    await fetchStaff()
  } catch (err) {
    // Always restore admin session even on error
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
    }
    formError.value =
      err.message === 'Request timed out'
        ? 'The request timed out. Please check your connection and try again.'
        : err.message || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}

// ─── Deactivate / Reactivate / Remove ────────────────────────────────────────

async function deactivateMember(member) {
  const { error } = await supabase.from('users').update({ is_active: false }).eq('id', member.id)
  if (!error) {
    member.is_active = false
    confirmTarget.value = null
  }
}

async function reactivateMember(member) {
  const { error } = await supabase.from('users').update({ is_active: true }).eq('id', member.id)
  if (!error) member.is_active = true
}

async function removeMember(member) {
  const { error } = await supabase.from('users').delete().eq('id', member.id)
  if (!error) {
    staffList.value = staffList.value.filter((m) => m.id !== member.id)
    confirmTarget.value = null
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(fetchStaff)
</script>

<style scoped>
.staff-page {
  padding: 2rem;
  max-width: 1000px;
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
.btn-invite {
  background: #111827;
  color: #fff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-invite:hover {
  background: #374151;
}

/* ── Skeleton ── */
.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.skeleton-row {
  height: 60px;
  border-radius: 10px;
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

/* ── Panel ── */
.staff-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}
.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.75rem;
}
.empty-sub {
  font-size: 0.82rem;
  margin-top: 0.25rem;
}

/* ── Table ── */
.staff-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.staff-table thead th {
  text-align: left;
  padding: 0.85rem 1.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.staff-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
}
.staff-row:last-child {
  border-bottom: none;
}
.staff-row:hover {
  background: #f9fafb;
}
.staff-table td {
  padding: 1rem 1.25rem;
  vertical-align: middle;
}

.td-name {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.member-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.1rem;
}
.member-email {
  font-size: 0.75rem;
  color: #9ca3af;
}

.role-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}
.role--kitchen {
  background: #fef3c7;
  color: #d97706;
}
.role--cashier {
  background: #eff6ff;
  color: #2563eb;
}
.role--waiter {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}
.status-badge.active {
  background: #d1fae5;
  color: #059669;
}
.status-badge.inactive {
  background: #f3f4f6;
  color: #9ca3af;
}

.td-date {
  color: #9ca3af;
  font-size: 0.8rem;
}
.td-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.btn-action {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 7px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.12s;
}
.btn-deactivate {
  background: #fff7ed;
  color: #ea580c;
  border-color: #fed7aa;
}
.btn-deactivate:hover {
  background: #ffedd5;
}
.btn-activate {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}
.btn-activate:hover {
  background: #dcfce7;
}
.btn-remove {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}
.btn-remove:hover {
  background: #ffe4e6;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal--sm {
  max-width: 400px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}
.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.12s;
}
.modal-close:hover {
  color: #111827;
}
.modal-body {
  padding: 1.25rem 1.5rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
}

/* ── Form ── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
}
.form-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  font-size: 0.85rem;
  color: #111827;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  background: #fff;
}
.form-input:focus {
  border-color: #6366f1;
}
.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.role-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 1rem;
}
.confirm-desc {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* ── Alerts ── */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 500;
  margin-top: 0.25rem;
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

/* ── Buttons ── */
.btn-cancel {
  padding: 0.65rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-submit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-submit:hover:not(:disabled) {
  background: #374151;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-submit--danger {
  background: #e11d48;
}
.btn-submit--danger:hover:not(:disabled) {
  background: #be123c;
}

/* ── Spinner ── */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Modal Transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96) translateY(8px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .staff-page {
    padding: 1rem;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .td-date {
    display: none;
  }
  .td-actions {
    flex-direction: column;
  }
}
</style>
