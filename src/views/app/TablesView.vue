<template>
  <div class="tables-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Tables</h1>
        <p class="page-subtitle">Manage tables and generate QR codes for ordering</p>
      </div>
      <div class="header-right">
        <!-- Limit badge -->
        <div class="limit-badge" :class="{ 'limit-badge-warn': isAtLimit }">
          <span class="limit-count"
            >{{ tables.length }} / {{ tableLimit === Infinity ? '∞' : tableLimit }}</span
          >
          <span class="limit-plan">{{ planLabel }}</span>
        </div>
        <button class="btn-add" @click="openAddTable" :disabled="isAtLimit">+ Add Table</button>
      </div>
    </div>

    <!-- At-limit warning banner -->
    <div
      v-if="isAtLimit && resolvedPlan !== 'pro' && resolvedPlan !== 'enterprise'"
      class="limit-banner"
    >
      <span class="limit-banner-icon">⚠</span>
      <div>
        <strong>Table limit reached</strong> — your {{ planLabel }} plan allows up to
        {{ tableLimit }} tables.
        <RouterLink to="/app/settings" class="upgrade-link">Upgrade to Pro</RouterLink> for
        unlimited tables.
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Loading tables…</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="tables.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">◫</div>
      <h3>No tables added yet</h3>
      <p class="empty-text">
        Create your first table to generate a QR code customers can scan to order
      </p>
      <button class="btn-add" @click="openAddTable">+ Add Table</button>
    </div>

    <!-- Tables grid -->
    <div v-else class="tables-grid">
      <div
        v-for="table in tables"
        :key="table.id"
        class="table-card"
        :class="{ inactive: !table.is_active }"
      >
        <div class="qr-container" @click="openQrModal(table)">
          <img
            v-if="table._qr"
            :src="table._qr"
            class="qr-image"
            :alt="`QR code for ${table.name}`"
          />
          <div v-else class="qr-placeholder">
            <div class="spinner-sm" />
          </div>
          <div class="qr-overlay">
            <span class="qr-hint">Click to view full size</span>
          </div>
        </div>

        <div class="table-info">
          <div class="table-name-row">
            <span class="table-name">{{ table.name }}</span>
            <div class="table-actions">
              <button class="action-btn edit" @click="openEditTable(table)" title="Rename table">
                ✎
              </button>
              <button class="action-btn delete" @click="confirmDelete(table)" title="Delete table">
                ✕
              </button>
            </div>
          </div>

          <div class="table-url">{{ shortUrl(table.id) }}</div>

          <div class="table-status-row">
            <button
              class="status-pill"
              :class="{ active: table.is_active }"
              @click="toggleTable(table)"
            >
              {{ table.is_active ? 'Active' : 'Inactive' }}
            </button>
            <button class="btn-download" @click="downloadQr(table)">↓ Download QR</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Print all banner -->
    <div v-if="tables.length > 3" class="print-all-banner">
      <div class="print-content">
        <span class="print-icon">🖨</span>
        <div>
          <div class="print-title">Print all QR codes at once</div>
          <div class="print-subtitle">Download a single page containing every table's QR code</div>
        </div>
      </div>
      <button class="btn-outline" @click="downloadAllQrs">Download Sheet</button>
    </div>

    <!-- Add/Edit Table Modal -->
    <Teleport to="body">
      <div v-if="tableModal.open" class="modal-backdrop" @click.self="tableModal.open = false">
        <div class="modal modal-add">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ tableModal.editing ? 'Rename Table' : 'Add New Table' }}
            </h2>
            <button class="modal-close-btn" @click="tableModal.open = false">×</button>
          </div>

          <div v-if="tableModal.error" class="modal-error">
            {{ tableModal.error }}
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Table / Area Name</label>
              <div class="suggestion-chips">
                <button
                  v-for="s in nameSuggestions"
                  :key="s"
                  class="chip"
                  :class="{ 'chip-active': tableModal.name === s }"
                  @click="tableModal.name = s"
                  type="button"
                >
                  {{ s }}
                </button>
              </div>
              <input
                v-model="tableModal.name"
                class="form-input"
                type="text"
                placeholder="Table 5, Bar Seat 3, VIP Booth, Patio…"
                @keyup.enter="saveTable"
                autofocus
              />
            </div>

            <div v-if="!tableModal.editing && previewQr" class="qr-preview-section">
              <div class="qr-preview-label">QR Code Preview</div>
              <img :src="previewQr" class="qr-preview" alt="Preview QR" />
              <div class="preview-url">{{ previewOrderUrl }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="tableModal.open = false">Cancel</button>
            <button
              class="btn-primary"
              :disabled="tableModal.saving || !tableModal.name.trim()"
              @click="saveTable"
            >
              {{ tableModal.saving ? 'Saving…' : tableModal.editing ? 'Update' : 'Create Table' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- QR Enlarge Modal -->
    <Teleport to="body">
      <div v-if="qrModal.open" class="modal-backdrop" @click.self="qrModal.open = false">
        <div class="modal modal-qr">
          <div class="modal-header">
            <h2 class="modal-title">{{ qrModal.table?.name }}</h2>
            <button class="modal-close-btn" @click="qrModal.open = false">×</button>
          </div>
          <div class="modal-body qr-body">
            <img :src="qrModal.table?._qr" class="qr-large" alt="Table QR code" />
            <div class="qr-url">{{ fullOrderUrl(qrModal.table?.id) }}</div>
            <p class="qr-hint-text">
              Print and place on table. Customers scan to view menu & order — no app needed.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="qrModal.open = false">Close</button>
            <button class="btn-primary" @click="downloadQr(qrModal.table)">↓ Download PNG</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="modal-backdrop" @click.self="deleteModal.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">Delete Table?</h2>
            <button class="modal-close-btn" @click="deleteModal.open = false">×</button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              This will permanently remove <strong>{{ deleteModal.table?.name }}</strong
              >.<br />
              The QR code will stop working. Orders history remains intact.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="deleteModal.saving" @click="doDelete">
              {{ deleteModal.saving ? 'Deleting…' : 'Delete Table' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

const authStore = useAuthStore()

const loading = ref(true)
const tables = ref([])
const restaurantId = ref(null)
const restaurantSlug = ref('')

// ── Plan enforcement ──────────────────────────────
const restaurantPlan = ref(null)
const trialEndsAt = ref(null)

const LIMITS = {
  trial: 15,
  starter: 15,
  pro: Infinity,
  enterprise: Infinity,
}

let realtimeChannel = null

function subscribeRealtime() {
  if (!restaurantId.value) return
  realtimeChannel = supabase
    .channel('tables-page')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `restaurant_id=eq.${restaurantId.value}`,
      },
      () => loadTables(),
    )
    .subscribe()
}

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

const resolvedPlan = computed(() => {
  const p = restaurantPlan.value
  if (!p) return 'trial'
  if (p === 'trial') {
    if (trialEndsAt.value && new Date(trialEndsAt.value) < new Date()) return 'expired'
    return 'trial'
  }
  return p
})

const tableLimit = computed(() => LIMITS[resolvedPlan.value] ?? 15)
const isAtLimit = computed(() => tables.value.length >= tableLimit.value)
const planLabel = computed(() => {
  const map = {
    trial: '14-day Trial',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
    expired: 'Expired',
  }
  return map[resolvedPlan.value] || 'Trial'
})

async function fetchPlan() {
  if (!restaurantId.value) return
  const { data } = await supabase
    .from('restaurants')
    .select('plan, trial_ends_at')
    .eq('id', restaurantId.value)
    .single()
  if (data) {
    restaurantPlan.value = data.plan
    trialEndsAt.value = data.trial_ends_at
  }
}
// ─────────────────────────────────────────────────

const tableModal = ref({
  open: false,
  editing: false,
  id: null,
  name: '',
  saving: false,
  error: '',
})

const qrModal = ref({ open: false, table: null })
const deleteModal = ref({ open: false, table: null, saving: false })

const previewQr = ref('')

const nameSuggestions = computed(() => {
  const taken = new Set(tables.value.map((t) => t.name))
  const presets = [
    'Table 1',
    'Table 2',
    'Table 3',
    'Table 4',
    'Bar Seat',
    'VIP Booth',
    'Patio',
    'Terrace',
    'Counter 1',
  ]
  return presets.filter((n) => !taken.has(n)).slice(0, 6)
})

const previewOrderUrl = computed(() =>
  restaurantSlug.value ? `${window.location.origin}/order/${restaurantSlug.value}/preview` : '',
)

watch(
  () => tableModal.value.name,
  async (name) => {
    if (!tableModal.value.editing && name.trim() && restaurantSlug.value) {
      previewQr.value = await generateQrDataUrl(previewOrderUrl.value)
    }
  },
)

function fullOrderUrl(id) {
  return `${window.location.origin}/order/${restaurantSlug.value}/${id}?rid=${restaurantId.value}`
}

function shortUrl(id) {
  const u = fullOrderUrl(id)
  return u.length > 42 ? u.slice(0, 39) + '…' : u
}

async function generateQrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch {
    return ''
  }
}

onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  restaurantId.value = authStore.profile?.restaurant_id
  if (!restaurantId.value) return

  const { data: resto } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('id', restaurantId.value)
    .single()

  if (resto) restaurantSlug.value = resto.slug

  // Run plan fetch in parallel with table load (per auth reference pattern)
  await Promise.all([fetchPlan(), loadTables()])
  subscribeRealtime() // ← add this
})

async function loadTables() {
  loading.value = true
  const { data } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId.value)
    .order('created_at')

  tables.value = (data || []).map((t) => ({ ...t, _qr: null }))
  loading.value = false

  tables.value.forEach((table) => {
    generateQrDataUrl(fullOrderUrl(table.id)).then((qr) => {
      table._qr = qr
    })
  })
}

function openAddTable() {
  // Hard guard — safety net even if button was somehow clicked while disabled
  if (isAtLimit.value) return
  tableModal.value = { open: true, editing: false, id: null, name: '', saving: false, error: '' }
  previewQr.value = ''
}

function openEditTable(table) {
  tableModal.value = {
    open: true,
    editing: true,
    id: table.id,
    name: table.name,
    saving: false,
    error: '',
  }
}

async function saveTable() {
  const m = tableModal.value
  if (!m.name.trim()) {
    m.error = 'Table name is required'
    return
  }

  // Hard limit check in submit — never skip this (per auth reference doc)
  if (!m.editing && isAtLimit.value) {
    m.error = `You've reached the ${tableLimit.value}-table limit on your ${planLabel.value} plan. Upgrade to Pro for unlimited tables.`
    return
  }

  m.saving = true
  m.error = ''

  try {
    if (m.editing) {
      await supabase.from('tables').update({ name: m.name.trim() }).eq('id', m.id)
      const t = tables.value.find((t) => t.id === m.id)
      if (t) t.name = m.name.trim()
    } else {
      const { data, error } = await supabase
        .from('tables')
        .insert({ restaurant_id: restaurantId.value, name: m.name.trim(), is_active: true })
        .select()
        .single()
      if (error) throw error
      const newTable = { ...data, _qr: null }
      tables.value.push(newTable)
      generateQrDataUrl(fullOrderUrl(data.id)).then((qr) => {
        newTable._qr = qr
      })
    }
    m.open = false
  } catch (err) {
    m.error = err.message || 'Something went wrong'
  } finally {
    m.saving = false
  }
}

async function toggleTable(table) {
  const newState = !table.is_active
  table.is_active = newState
  await supabase.from('tables').update({ is_active: newState }).eq('id', table.id)
}

function openQrModal(table) {
  qrModal.value = { open: true, table }
}

function downloadQr(table) {
  if (!table?._qr) return
  const a = document.createElement('a')
  a.download = `${table.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`
  a.href = table._qr
  a.click()
}

async function downloadAllQrs() {
  for (const t of tables.value) {
    if (t._qr) {
      downloadQr(t)
      await new Promise((r) => setTimeout(r, 180))
    }
  }
}

function confirmDelete(table) {
  deleteModal.value = { open: true, table, saving: false }
}

async function doDelete() {
  const d = deleteModal.value
  d.saving = true
  try {
    await supabase.from('tables').delete().eq('id', d.table.id)
    tables.value = tables.value.filter((t) => t.id !== d.table.id)
    d.open = false
  } catch (e) {
    console.error(e)
  } finally {
    d.saving = false
  }
}
</script>

<style scoped>
.tables-page {
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
  margin: 0;
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
}

/* Limit badge */
.limit-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  padding: 6px 12px;
  background: var(--color-bg-elevated, #1e1e1e);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: 8px;
  transition: border-color 0.2s;
}
.limit-badge.limit-badge-warn {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.05);
}
.limit-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #f0ece5);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  line-height: 1;
}
.limit-badge.limit-badge-warn .limit-count {
  color: #f87171;
}
.limit-plan {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent, #c8733a);
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

/* At-limit warning banner */
.limit-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--color-text-secondary, #888);
  line-height: 1.5;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}
.limit-banner strong {
  color: #f87171;
}
.limit-banner-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}
.upgrade-link {
  color: var(--color-accent, #c8733a);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
.upgrade-link:hover {
  text-decoration: underline;
}

/* ── Buttons ────────────────────────────────────── */
.btn-add {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}
.btn-add:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.btn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: 600;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.16s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-ghost:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--color-accent-border-strong);
  color: var(--color-accent);
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-outline:hover {
  background: var(--color-accent-muted);
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* ── States ─────────────────────────────────────── */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: var(--color-text-muted);
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.spinner-sm {
  width: 22px;
  height: 22px;
  border: 3px solid var(--color-border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
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
  max-width: 360px;
  text-align: center;
  color: var(--color-text-secondary);
  margin: 12px 0 24px;
}

/* ── Grid & Cards ───────────────────────────────── */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.table-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  overflow: hidden;
  transition: all 0.18s ease;
  box-shadow: var(--shadow-card);
}
.table-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-float);
  border-color: var(--color-accent-border);
}
.table-card.inactive {
  opacity: 0.58;
  filter: grayscale(0.4);
}

.qr-container {
  background: #0a0a0a;
  padding: 28px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  height: 180px;
}
.qr-image {
  width: 130px;
  height: 130px;
  border-radius: 10px;
  background: white;
  padding: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}
.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-container:hover .qr-overlay {
  opacity: 1;
}
.qr-hint {
  color: white;
  font-size: 13px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
}

.table-info {
  padding: 14px 16px;
}
.table-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.table-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.table-actions {
  display: flex;
  gap: 6px;
}
.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.14s;
}
.action-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
}
.action-btn.edit:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}
.action-btn.delete:hover {
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.table-url {
  font-size: 11px;
  color: var(--color-text-faint);
  margin-bottom: 12px;
  word-break: break-all;
  line-height: 1.3;
}
.table-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.status-pill {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.16s;
}
.status-pill.active {
  background: rgba(74, 222, 128, 0.12);
  border-color: #4ade80;
  color: #4ade80;
}
.btn-download {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.16s;
}
.btn-download:hover {
  background: var(--color-accent-muted);
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}

/* ── Print banner ───────────────────────────────── */
.print-all-banner {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 40px;
}
.print-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.print-icon {
  font-size: 28px;
}
.print-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.print-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

/* ── Modals ─────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
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
  max-width: 460px;
  box-shadow: var(--shadow-float);
  border: 1px solid var(--color-border-subtle);
  overflow: hidden;
}
.modal-qr {
  max-width: 420px;
}
.modal-sm {
  max-width: 380px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
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
  font-size: 24px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.16s;
}
.modal-close-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.modal-error {
  margin: 16px 24px 0;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 14px;
}
.modal-body {
  padding: 24px;
}
.qr-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 24px 8px;
}
.qr-large {
  width: 220px;
  height: 220px;
  border-radius: 12px;
  background: white;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  margin-bottom: 16px;
}
.qr-url {
  font-size: 12px;
  color: var(--color-text-muted);
  word-break: break-all;
  margin: 8px 0 16px;
  max-width: 100%;
}
.qr-hint-text {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
  max-width: 340px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

.form-group {
  margin-bottom: 20px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  display: block;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 15px;
  transition: all 0.16s;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.chip {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.14s;
}
.chip:hover {
  border-color: var(--color-accent-border);
  color: var(--color-accent);
}
.chip-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.qr-preview-section {
  margin-top: 20px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 16px;
  text-align: center;
}
.qr-preview-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}
.qr-preview {
  width: 140px;
  height: 140px;
  border-radius: 10px;
  background: white;
  padding: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.preview-url {
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-text-faint);
  word-break: break-all;
}

.delete-warning {
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
