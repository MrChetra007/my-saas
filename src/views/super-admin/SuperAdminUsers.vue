<template>
  <div class="page">
    <!-- ── Page header ──────────────────────────────── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Users</h2>
        <p class="page-sub">{{ filtered.length }} of {{ users.length }} users</p>
      </div>
    </div>

    <!-- ── Filters ──────────────────────────────────── -->
    <div class="filters">
      <div class="search-wrap">
        <span class="search-icon" v-html="icons.search" />
        <input
          v-model="searchQ"
          class="search-input"
          placeholder="Search by name or email…"
          type="text"
        />
        <button v-if="searchQ" class="search-clear" @click="searchQ = ''">×</button>
      </div>

      <div class="filter-group">
        <button
          v-for="r in roleFilters"
          :key="r.value"
          class="filter-btn"
          :class="{ active: roleFilter === r.value }"
          @click="roleFilter = r.value"
        >
          {{ r.label }}
        </button>
      </div>

      <select v-model="restaurantFilter" class="filter-select">
        <option value="all">All restaurants</option>
        <option v-for="r in restaurantOptions" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
    </div>

    <!-- ── Table ────────────────────────────────────── -->
    <div class="table-wrap">
      <div v-if="loading" class="skeleton-rows">
        <div class="skeleton-row" v-for="i in 7" :key="i" />
      </div>

      <div v-else-if="filtered.length === 0" class="empty-state">
        <span v-html="icons.empty" />
        <span>No users match your filters</span>
      </div>

      <table v-else class="u-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Restaurant</th>
            <th>Status</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id" class="u-row" :class="{ inactive: !u.is_active }">
            <td>
              <div class="u-name-cell">
                <div class="u-avatar" :class="{ inactive: !u.is_active }">
                  {{ initials(u.full_name || u.email) }}
                </div>
                <div>
                  <div class="u-name">{{ u.full_name || '—' }}</div>
                  <div class="u-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge" :class="u.role">{{ u.role }}</span>
            </td>
            <td>
              <span class="restaurant-name">{{ u.restaurant_name ?? '—' }}</span>
            </td>
            <td>
              <span class="status-badge" :class="u.is_active !== false ? 'active' : 'inactive'">
                <span class="status-dot" />
                {{ u.is_active !== false ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="td-muted">{{ formatDate(u.created_at) }}</td>
            <td>
              <div class="action-btns">
                <button
                  class="action-btn"
                  title="View details"
                  @click="openDetails(u)"
                  v-html="icons.eye"
                />
                <button
                  class="action-btn"
                  :title="u.is_active !== false ? 'Deactivate' : 'Reactivate'"
                  :class="u.is_active !== false ? 'warn' : 'ok'"
                  @click="toggleActive(u)"
                  v-html="u.is_active !== false ? icons.deactivate : icons.activate"
                />
                <button
                  class="action-btn"
                  title="Send password reset"
                  @click="openReset(u)"
                  v-html="icons.reset"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Details modal ────────────────────────────── -->
    <Teleport to="body">
      <div v-if="detailsModal" class="modal-backdrop" @click.self="detailsModal = null">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <div class="u-avatar lg">
                {{ initials(detailsModal.full_name || detailsModal.email) }}
              </div>
              <div>
                <h3 class="modal-title">{{ detailsModal.full_name || 'No name' }}</h3>
                <span class="modal-sub">{{ detailsModal.email }}</span>
              </div>
            </div>
            <button class="modal-close" @click="detailsModal = null">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item" v-for="d in detailFields(detailsModal)" :key="d.label">
                <span class="detail-label">{{ d.label }}</span>
                <span class="detail-value" v-html="d.value" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Deactivate confirm modal ──────────────────── -->
    <Teleport to="body">
      <div v-if="toggleTarget" class="modal-backdrop" @click.self="toggleTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span
                v-html="toggleTarget.is_active !== false ? icons.deactivate : icons.activate"
                :style="toggleTarget.is_active !== false ? 'color:#e11d48' : 'color:#16a34a'"
              />
              <h3 class="modal-title">
                {{ toggleTarget.is_active !== false ? 'Deactivate user' : 'Reactivate user' }}
              </h3>
            </div>
            <button class="modal-close" @click="toggleTarget = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              Are you sure you want to
              <strong>{{ toggleTarget.is_active !== false ? 'deactivate' : 'reactivate' }}</strong>
              <strong>{{ toggleTarget.full_name || toggleTarget.email }}</strong
              >?
            </p>
            <div
              class="confirm-info"
              :class="toggleTarget.is_active !== false ? 'danger' : 'success'"
            >
              <span v-html="icons.info" />
              {{
                toggleTarget.is_active !== false
                  ? 'This user will not be able to log in until reactivated.'
                  : 'This user will regain access to their account.'
              }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="toggleTarget = null">Cancel</button>
            <button
              :class="toggleTarget.is_active !== false ? 'btn-danger' : 'btn-success'"
              :disabled="saving"
              @click="confirmToggle"
            >
              {{
                saving ? 'Saving…' : toggleTarget.is_active !== false ? 'Deactivate' : 'Reactivate'
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Reset password modal ──────────────────────── -->
    <Teleport to="body">
      <div v-if="resetModal" class="modal-backdrop" @click.self="resetModal = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span v-html="icons.reset" style="color: #3b82f6" />
              <h3 class="modal-title">Send password reset</h3>
            </div>
            <button class="modal-close" @click="resetModal = null">×</button>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              Send a password reset email to <strong>{{ resetModal.email }}</strong
              >?
            </p>
            <div class="confirm-info info">
              <span v-html="icons.info" />
              They will receive a link to set a new password. The link expires in 24 hours.
            </div>
            <div v-if="resetSent" class="confirm-info success">
              <span v-html="icons.check" />
              Reset email sent successfully!
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="((resetModal = null), (resetSent = false))">
              {{ resetSent ? 'Close' : 'Cancel' }}
            </button>
            <button v-if="!resetSent" class="btn-primary" :disabled="saving" @click="sendReset">
              {{ saving ? 'Sending…' : 'Send reset email' }}
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

const loading = ref(true)
const saving = ref(false)
const users = ref([])
const restaurantOptions = ref([])

// ── Filters ────────────────────────────────────────────
const searchQ = ref('')
const roleFilter = ref('all')
const restaurantFilter = ref('all')

const roleFilters = [
  { label: 'All roles', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Waiter', value: 'waiter' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Kitchen', value: 'kitchen' },
]

const filtered = computed(() => {
  return users.value.filter((u) => {
    const q = searchQ.value.toLowerCase()
    const matchSearch =
      !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = roleFilter.value === 'all' || u.role === roleFilter.value
    const matchRestaurant =
      restaurantFilter.value === 'all' || u.restaurant_id === restaurantFilter.value
    return matchSearch && matchRole && matchRestaurant
  })
})

// ── Modals ─────────────────────────────────────────────
const detailsModal = ref(null)
const toggleTarget = ref(null)
const resetModal = ref(null)
const resetSent = ref(false)

function openDetails(u) {
  detailsModal.value = u
}
function toggleActive(u) {
  toggleTarget.value = u
}
function openReset(u) {
  resetModal.value = u
  resetSent.value = false
}

// ── Confirm deactivate / reactivate ───────────────────
async function confirmToggle() {
  if (!toggleTarget.value) return
  saving.value = true
  try {
    const newStatus = !(toggleTarget.value.is_active !== false)
    const { error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', toggleTarget.value.id)

    if (error) throw error

    const idx = users.value.findIndex((u) => u.id === toggleTarget.value.id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], is_active: newStatus }
    toggleTarget.value = null
  } catch (err) {
    console.error('Toggle active error:', err)
    alert('Failed: ' + err.message)
  } finally {
    saving.value = false
  }
}

// ── Send password reset ────────────────────────────────
async function sendReset() {
  if (!resetModal.value) return
  saving.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetModal.value.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    resetSent.value = true
  } catch (err) {
    console.error('Reset password error:', err)
    alert('Failed: ' + err.message)
  } finally {
    saving.value = false
  }
}

// ── Helpers ────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function initials(str) {
  if (!str) return '?'
  return str
    .split(/[\s@]/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function detailFields(u) {
  return [
    { label: 'User ID', value: `<code>${u.id}</code>` },
    { label: 'Full name', value: u.full_name ?? '—' },
    { label: 'Email', value: u.email ?? '—' },
    { label: 'Role', value: u.role ?? '—' },
    { label: 'Restaurant', value: u.restaurant_name ?? '—' },
    { label: 'Restaurant ID', value: u.restaurant_id ? `<code>${u.restaurant_id}</code>` : '—' },
    { label: 'Status', value: u.is_active !== false ? 'Active' : 'Inactive' },
    { label: 'Super admin', value: u.is_super_admin ? 'Yes' : 'No' },
    { label: 'Created', value: formatDate(u.created_at) },
    { label: 'Last sign in', value: formatDate(u.last_sign_in_at) },
  ]
}

// ── Icons ──────────────────────────────────────────────
const icons = {
  search: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  eye: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  deactivate: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  activate: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  reset: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
  empty: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
}

// ── Fetch ──────────────────────────────────────────────
onMounted(async () => {
  try {
    // Fetch all users
    const { data: userList, error: uErr } = await supabase
      .from('users')
      .select(
        'id, full_name, email, role, restaurant_id, is_active, is_super_admin, created_at, last_sign_in_at',
      )
      .order('created_at', { ascending: false })

    if (uErr) throw uErr

    // Fetch all restaurants for name mapping + filter dropdown
    const { data: rList, error: rErr } = await supabase
      .from('restaurants')
      .select('id, name')
      .order('name')

    if (rErr) throw rErr

    restaurantOptions.value = rList ?? []

    // Map restaurant name onto each user
    const rMap = {}
    rList?.forEach((r) => {
      rMap[r.id] = r.name
    })

    users.value = (userList ?? []).map((u) => ({
      ...u,
      restaurant_name: u.restaurant_id ? (rMap[u.restaurant_id] ?? '—') : '—',
    }))
  } catch (err) {
    console.error('Users fetch error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
}

/* ── Header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1917;
  margin: 0 0 3px;
  letter-spacing: -0.3px;
}
.page-sub {
  font-size: 13px;
  color: #a8a49e;
  margin: 0;
}

/* ── Filters ────────────────────────────────────────── */
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}
.search-icon {
  position: absolute;
  left: 10px;
  color: #a8a49e;
  display: flex;
  pointer-events: none;
}
.search-input {
  width: 100%;
  height: 36px;
  padding: 0 32px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #fff;
  font-size: 13px;
  color: #1a1917;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus {
  border-color: #f97316;
}
.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #a8a49e;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.filter-group {
  display: flex;
  gap: 4px;
}
.filter-btn {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #fff;
  font-size: 12.5px;
  font-weight: 500;
  color: #6b6963;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.filter-btn:hover {
  border-color: #d1cdc7;
  color: #1a1917;
}
.filter-btn.active {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
  font-weight: 600;
}

.filter-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #fff;
  font-size: 12.5px;
  color: #6b6963;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
  max-width: 180px;
}
.filter-select:focus {
  border-color: #f97316;
}

/* ── Table ──────────────────────────────────────────── */
.table-wrap {
  background: #fff;
  border: 1px solid #e8e6e1;
  border-radius: 14px;
  overflow: hidden;
}

.u-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.u-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid #f0ede8;
  background: #fafaf9;
  white-space: nowrap;
}
.u-table tbody td {
  padding: 13px 16px;
  border-bottom: 1px solid #f8f7f4;
  vertical-align: middle;
  color: #3d3d3a;
}
.u-row:last-child td {
  border-bottom: none;
}
.u-row:hover td {
  background: #fafaf9;
}
.u-row.inactive td {
  opacity: 0.55;
}

/* ── User cell ──────────────────────────────────────── */
.u-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.u-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 9px;
  background: #f97316;
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.u-avatar.inactive {
  background: #d1cdc7;
}
.u-avatar.lg {
  width: 40px;
  height: 40px;
  font-size: 15px;
  border-radius: 11px;
}
.u-name {
  font-weight: 600;
  color: #1a1917;
  font-size: 13.5px;
}
.u-email {
  font-size: 11.5px;
  color: #a8a49e;
  margin-top: 1px;
}
.restaurant-name {
  font-size: 13px;
  color: #6b6963;
}
.td-muted {
  color: #a8a49e !important;
  font-size: 12px !important;
}

/* ── Badges ─────────────────────────────────────────── */
.role-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  text-transform: capitalize;
}
.role-badge.admin {
  background: #fff7ed;
  color: #c2410c;
}
.role-badge.waiter {
  background: #eff6ff;
  color: #2563eb;
}
.role-badge.cashier {
  background: #fdf4ff;
  color: #9333ea;
}
.role-badge.kitchen {
  background: #f0fdf4;
  color: #15803d;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.status-badge.active {
  background: #f0fdf4;
  color: #15803d;
}
.status-badge.inactive {
  background: #f8f7f4;
  color: #a8a49e;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* ── Actions ────────────────────────────────────────── */
.action-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e6e1;
  border-radius: 8px;
  background: transparent;
  color: #6b6963;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover {
  background: #f3f1ee;
  color: #1a1917;
  border-color: #d1cdc7;
}
.action-btn.warn:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
}
.action-btn.ok:hover {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

/* ── Modal ──────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalIn 0.2s ease;
}
.modal-sm {
  max-width: 420px;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0ede8;
  flex-shrink: 0;
}
.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-title {
  font-size: 15px;
  font-weight: 650;
  color: #1a1917;
  margin: 0;
}
.modal-sub {
  font-size: 12px;
  color: #a8a49e;
}
.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f1ee;
  border-radius: 7px;
  font-size: 18px;
  color: #6b6963;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}
.modal-close:hover {
  background: #e8e6e1;
  color: #1a1917;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #f0ede8;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Detail grid ────────────────────────────────────── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: #fafaf9;
  border-radius: 9px;
  border: 1px solid #f0ede8;
}
.detail-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #a8a49e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-value {
  font-size: 13px;
  color: #1a1917;
  font-weight: 500;
  word-break: break-all;
}
.detail-value code {
  font-size: 11px;
  background: #f3f1ee;
  padding: 2px 6px;
  border-radius: 5px;
  color: #6b6963;
  font-family: monospace;
}

/* ── Confirm modals ─────────────────────────────────── */
.confirm-text {
  font-size: 13.5px;
  color: #3d3d3a;
  line-height: 1.6;
  margin: 0;
}
.confirm-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 12.5px;
  line-height: 1.5;
}
.confirm-info.danger {
  background: #fff1f2;
  color: #be123c;
}
.confirm-info.success {
  background: #f0fdf4;
  color: #15803d;
}
.confirm-info.info {
  background: #eff6ff;
  color: #1d4ed8;
}

/* ── Buttons ────────────────────────────────────────── */
.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: #ea6c10;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  height: 36px;
  padding: 0 16px;
  background: transparent;
  color: #6b6963;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-secondary:hover {
  background: #f3f1ee;
  color: #1a1917;
}

.btn-danger {
  height: 36px;
  padding: 0 16px;
  background: #e11d48;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) {
  background: #be123c;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  height: 36px;
  padding: 0 16px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-success:hover:not(:disabled) {
  background: #15803d;
}
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Empty & skeleton ───────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 20px;
  color: #a8a49e;
  font-size: 13.5px;
}
.skeleton-rows {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px;
}
.skeleton-row {
  height: 52px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f1ee 25%, #e8e6e1 50%, #f3f1ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 900px) {
  .u-table {
    display: block;
    overflow-x: auto;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrap {
    max-width: 100%;
  }
  .filter-group {
    flex-wrap: wrap;
  }
  .filter-select {
    max-width: 100%;
  }
}
</style>
