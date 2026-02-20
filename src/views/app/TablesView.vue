<template>
  <div class="tables-page">
    <!-- ── Header ─────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Tables & QR Codes</h1>
        <p class="page-sub">{{ tables.length }} tables · customers scan to order</p>
      </div>
      <button class="btn-primary" @click="openAddTable">+ Add Table</button>
    </div>

    <!-- ── Loading ────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Loading tables…</span>
    </div>

    <!-- ── Empty ──────────────────────────── -->
    <div v-else-if="tables.length === 0" class="empty-state">
      <div class="empty-icon">◫</div>
      <h3>No tables yet</h3>
      <p>Add your first table to generate a QR code customers can scan</p>
      <button class="btn-primary" @click="openAddTable">+ Add Table</button>
    </div>

    <!-- ── Tables grid ────────────────────── -->
    <div v-else class="tables-grid">
      <div
        v-for="table in tables"
        :key="table.id"
        class="table-card"
        :class="{ inactive: !table.is_active }"
      >
        <!-- QR section -->
        <div class="qr-section" @click="openQrModal(table)">
          <img v-if="table._qr" :src="table._qr" class="qr-img" :alt="`QR for ${table.name}`" />
          <div v-else class="qr-loading"><div class="spinner-sm" /></div>
          <div class="qr-hover-hint">Click to enlarge</div>
        </div>

        <!-- Info -->
        <div class="table-body">
          <div class="table-name">{{ table.name }}</div>
          <div class="table-url">{{ shortUrl(table.id) }}</div>

          <div class="table-footer">
            <button
              class="status-pill"
              :class="{ active: table.is_active }"
              @click="toggleTable(table)"
            >
              {{ table.is_active ? 'Active' : 'Inactive' }}
            </button>

            <div class="table-actions">
              <button class="icon-btn" @click="openEditTable(table)" title="Rename">✎</button>
              <button class="icon-btn" @click="downloadQr(table)" title="Download QR">⬇</button>
              <button class="icon-btn danger" @click="confirmDelete(table)" title="Delete">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Print all banner ───────────────── -->
    <div v-if="tables.length > 1" class="print-banner">
      <div class="print-banner-text">
        <span class="print-icon">🖨</span>
        <div>
          <div class="print-title">Print all QR codes</div>
          <div class="print-sub">Download a single sheet with all your table QR codes</div>
        </div>
      </div>
      <button class="btn-outline" @click="downloadAllQrs">Download All</button>
    </div>

    <!-- ══ TABLE MODAL ════════════════════ -->
    <Teleport to="body">
      <div v-if="tableModal.open" class="modal-backdrop" @click.self="tableModal.open = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ tableModal.editing ? 'Rename Table' : 'Add Table' }}</h2>
            <button class="modal-close" @click="tableModal.open = false">✕</button>
          </div>

          <div class="modal-error" v-if="tableModal.error">{{ tableModal.error }}</div>

          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Table Name</label>
              <div class="suggestions">
                <button
                  v-for="s in nameSuggestions"
                  :key="s"
                  class="chip"
                  :class="{ active: tableModal.name === s }"
                  @click="tableModal.name = s"
                  type="button"
                >
                  {{ s }}
                </button>
              </div>
              <input
                v-model="tableModal.name"
                type="text"
                class="field-input"
                placeholder="e.g. Table 1, Bar Seat, VIP Room…"
                @keyup.enter="saveTable"
                autofocus
              />
            </div>

            <!-- QR preview when adding -->
            <div v-if="!tableModal.editing && restaurantSlug" class="qr-preview-wrap">
              <div class="qr-preview-label">QR Preview</div>
              <img v-if="previewQr" :src="previewQr" class="qr-preview-img" />
              <div class="qr-preview-url">{{ previewOrderUrl }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="tableModal.open = false">Cancel</button>
            <button class="btn-primary" :disabled="tableModal.saving" @click="saveTable">
              {{ tableModal.saving ? 'Saving…' : tableModal.editing ? 'Save' : 'Create Table' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ QR ENLARGE MODAL ═══════════════ -->
    <Teleport to="body">
      <div v-if="qrModal.open" class="modal-backdrop" @click.self="qrModal.open = false">
        <div class="modal modal-qr">
          <div class="modal-header">
            <h2 class="modal-title">{{ qrModal.table?.name }}</h2>
            <button class="modal-close" @click="qrModal.open = false">✕</button>
          </div>
          <div class="modal-body qr-modal-body">
            <img :src="qrModal.table?._qr" class="qr-large" :alt="qrModal.table?.name" />
            <div class="qr-full-url">{{ fullOrderUrl(qrModal.table?.id) }}</div>
            <p class="qr-instructions">
              Print this and place it on the table. Customers scan to order instantly — no app
              required.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="qrModal.open = false">Close</button>
            <button class="btn-primary" @click="downloadQr(qrModal.table)">⬇ Download PNG</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ DELETE CONFIRM ═════════════════ -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="modal-backdrop" @click.self="deleteModal.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">Delete Table?</h2>
            <button class="modal-close" @click="deleteModal.open = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="delete-warn">
              Deleting <strong>{{ deleteModal.table?.name }}</strong> will deactivate its QR code.
              Existing orders from this table are kept.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="deleteModal.saving" @click="doDelete">
              {{ deleteModal.saving ? 'Deleting…' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import QRCode from 'qrcode'

const authStore = useAuthStore()
const loading = ref(true)
const tables = ref([])
const restaurantId = ref(null)
const restaurantSlug = ref('')

// ── Modal states ─────────────────────────────
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

// Suggestion chips
const nameSuggestions = computed(() => {
  const existing = tables.value.map((t) => t.name)
  const all = ['Table 1', 'Table 2', 'Table 3', 'Bar Seat', 'VIP Room', 'Terrace', 'Booth 1']
  return all.filter((s) => !existing.includes(s)).slice(0, 5)
})

// ── QR preview in add modal ──────────────────
const previewQr = ref('')
const previewOrderUrl = computed(() =>
  restaurantSlug.value ? `${window.location.origin}/order/${restaurantSlug.value}/preview` : '',
)

watch(
  () => tableModal.value.name,
  async (name) => {
    if (!tableModal.value.editing && name && restaurantSlug.value) {
      previewQr.value = await generateQrDataUrl(previewOrderUrl.value)
    }
  },
)

// ── Helpers ──────────────────────────────────
function fullOrderUrl(tableId) {
  return `${window.location.origin}/order/${restaurantSlug.value}/${tableId}`
}

function shortUrl(tableId) {
  const url = fullOrderUrl(tableId)
  return url.length > 48 ? url.slice(0, 48) + '…' : url
}

async function generateQrDataUrl(url) {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

// ── Load ─────────────────────────────────────
onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  restaurantId.value = authStore.profile?.restaurant_id
  if (!restaurantId.value) return

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('id', restaurantId.value)
    .single()
  if (restaurant) restaurantSlug.value = restaurant.slug

  await loadTables()
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

  // Generate QRs in background
  for (const table of tables.value) {
    generateQrDataUrl(fullOrderUrl(table.id)).then((qr) => {
      table._qr = qr
    })
  }
}

// ── Add / Edit ───────────────────────────────
function openAddTable() {
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
    m.error = 'Please enter a table name.'
    return
  }
  m.saving = true
  m.error = ''

  try {
    if (m.editing) {
      const { error } = await supabase.from('tables').update({ name: m.name.trim() }).eq('id', m.id)
      if (error) throw error
      const t = tables.value.find((t) => t.id === m.id)
      if (t) t.name = m.name.trim()
    } else {
      const { data, error } = await supabase
        .from('tables')
        .insert({ restaurant_id: restaurantId.value, name: m.name.trim() })
        .select()
        .single()
      if (error) throw error
      const newTable = { ...data, _qr: null }
      tables.value.push(newTable)
      generateQrDataUrl(fullOrderUrl(data.id)).then((qr) => {
        newTable._qr = qr
      })
    }
    tableModal.value.open = false
  } catch (e) {
    m.error = e.message
  } finally {
    m.saving = false
  }
}

// ── Toggle active ────────────────────────────
async function toggleTable(table) {
  table.is_active = !table.is_active
  await supabase.from('tables').update({ is_active: table.is_active }).eq('id', table.id)
}

// ── QR Modal ─────────────────────────────────
function openQrModal(table) {
  qrModal.value = { open: true, table }
}

// ── Download ─────────────────────────────────
function downloadQr(table) {
  if (!table?._qr) return
  const link = document.createElement('a')
  link.download = `${table.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`
  link.href = table._qr
  link.click()
}

async function downloadAllQrs() {
  for (const table of tables.value) {
    if (!table._qr) continue
    await new Promise((resolve) => setTimeout(resolve, 200))
    downloadQr(table)
  }
}

// ── Delete ───────────────────────────────────
function confirmDelete(table) {
  deleteModal.value = { open: true, table, saving: false }
}

async function doDelete() {
  const d = deleteModal.value
  d.saving = true
  try {
    const { error } = await supabase.from('tables').delete().eq('id', d.table.id)
    if (error) throw error
    tables.value = tables.value.filter((t) => t.id !== d.table.id)
    deleteModal.value.open = false
  } catch (e) {
    console.error(e)
  } finally {
    d.saving = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.tables-page {
  font-family: 'DM Sans', sans-serif;
  max-width: 1000px;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}
.page-title {
  font-family: 'Fraunces', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.page-sub {
  font-size: 13px;
  color: #aaa;
  margin-top: 2px;
}

/* Buttons */
.btn-primary {
  padding: 9px 18px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) {
  background: #c8733a;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 9px 18px;
  background: transparent;
  color: #666;
  border: 1.5px solid #e2ddd6;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: #aaa;
  color: #333;
}

.btn-danger {
  padding: 9px 18px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  padding: 9px 20px;
  background: white;
  color: #1a1a1a;
  border: 1.5px solid #d6cfc4;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-outline:hover {
  border-color: #c8733a;
  color: #c8733a;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1.5px solid #e2ddd6;
  background: white;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover {
  border-color: #c8733a;
  color: #c8733a;
}
.icon-btn.danger:hover {
  border-color: #dc2626;
  color: #dc2626;
}

/* States */
.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 60px;
  justify-content: center;
  color: #aaa;
  font-size: 14px;
}
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2ddd6;
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.spinner-sm {
  width: 24px;
  height: 24px;
  border: 2px solid #e2ddd6;
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  color: #1a1a1a;
  margin-bottom: 6px;
}
.empty-state p {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 20px;
}

/* Tables grid */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.table-card {
  background: white;
  border: 1.5px solid #ede9e2;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;
}
.table-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #d6cfc4;
}
.table-card.inactive {
  opacity: 0.55;
}

/* QR section */
.qr-section {
  background: #fdfcfa;
  border-bottom: 1.5px solid #ede9e2;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  height: 160px;
  transition: background 0.15s;
}
.qr-section:hover {
  background: #f5f3ef;
}
.qr-img {
  width: 120px;
  height: 120px;
  border-radius: 4px;
}
.qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-hover-hint {
  position: absolute;
  bottom: 8px;
  font-size: 10px;
  color: #bbb;
  opacity: 0;
  transition: opacity 0.15s;
}
.qr-section:hover .qr-hover-hint {
  opacity: 1;
}

/* Table body */
.table-body {
  padding: 12px 14px;
}
.table-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 3px;
}
.table-url {
  font-size: 10px;
  color: #bbb;
  margin-bottom: 10px;
  word-break: break-all;
  line-height: 1.4;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-pill {
  padding: 3px 10px;
  border-radius: 99px;
  border: 1.5px solid #e2ddd6;
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.status-pill.active {
  border-color: #4ade80;
  color: #16a34a;
  background: #f0fdf4;
}

.table-actions {
  display: flex;
  gap: 5px;
}

/* Print banner */
.print-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff8f0;
  border: 1.5px solid #f5d5b3;
  border-radius: 12px;
  gap: 16px;
}
.print-banner-text {
  display: flex;
  align-items: center;
  gap: 12px;
}
.print-icon {
  font-size: 22px;
}
.print-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.print-sub {
  font-size: 12px;
  color: #aaa;
  margin-top: 1px;
}

/* Suggestions */
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.chip {
  padding: 4px 12px;
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
.chip:hover {
  border-color: #c8733a;
  color: #c8733a;
}
.chip.active {
  border-color: #c8733a;
  background: #c8733a;
  color: white;
}

/* QR preview in modal */
.qr-preview-wrap {
  background: #fdfcfa;
  border: 1.5px solid #ede9e2;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.qr-preview-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #bbb;
}
.qr-preview-img {
  width: 120px;
  height: 120px;
  border-radius: 4px;
}
.qr-preview-url {
  font-size: 10px;
  color: #bbb;
  text-align: center;
  word-break: break-all;
}

/* QR large modal */
.qr-modal-body {
  align-items: center;
  text-align: center;
}
.qr-large {
  width: 240px;
  height: 240px;
  border-radius: 6px;
}
.qr-full-url {
  font-size: 11px;
  color: #aaa;
  word-break: break-all;
  max-width: 280px;
}
.qr-instructions {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
  max-width: 300px;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.modal {
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-qr {
  max-width: 380px;
}
.modal-sm {
  max-width: 360px;
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
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
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0ece5;
}
.modal-title {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 700;
  color: #1a1a1a;
}
.modal-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover {
  background: #f5f3ef;
  color: #333;
}

.modal-error {
  margin: 12px 24px 0;
  padding: 10px 14px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  color: #dc2626;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f0ece5;
  background: #fdfcfa;
}

/* Fields */
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
.field-input {
  width: 100%;
  padding: 9px 13px;
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
  background: white;
}

.delete-warn {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}
</style>
