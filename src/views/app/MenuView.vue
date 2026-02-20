<template>
  <div class="menu-page">
    <!-- ── Header ───────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Menu</h1>
        <p class="page-sub">{{ categories.length }} categories · {{ totalItems }} items</p>
      </div>
      <button class="btn-primary" @click="openAddCategory">+ Add Category</button>
    </div>

    <!-- ── Loading ──────────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Loading menu…</span>
    </div>

    <!-- ── Empty ────────────────────────────────── -->
    <div v-else-if="categories.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No categories yet</h3>
      <p>Start by creating a category like "Starters" or "Drinks"</p>
      <button class="btn-primary" @click="openAddCategory">+ Add Category</button>
    </div>

    <!-- ── Categories ───────────────────────────── -->
    <div v-else class="categories-list">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-block"
        :class="{ collapsed: category._collapsed }"
      >
        <!-- Category header -->
        <div class="category-header">
          <button class="collapse-btn" @click="category._collapsed = !category._collapsed">
            <span class="collapse-arrow" :class="{ rotated: category._collapsed }">▾</span>
          </button>

          <div class="category-info">
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.items?.length || 0 }} items</span>
          </div>

          <div class="category-status">
            <button
              class="toggle-btn"
              :class="{ active: category.is_active }"
              @click="toggleCategory(category)"
              :title="category.is_active ? 'Hide category' : 'Show category'"
            >
              {{ category.is_active ? 'Visible' : 'Hidden' }}
            </button>
          </div>

          <div class="category-actions">
            <button class="icon-btn" @click="openEditCategory(category)" title="Edit">✎</button>
            <button class="icon-btn danger" @click="confirmDeleteCategory(category)" title="Delete">
              ✕
            </button>
          </div>

          <button class="btn-add-item" @click="openAddItem(category)">+ Item</button>
        </div>

        <!-- Items grid -->
        <div class="items-grid" v-show="!category._collapsed">
          <div v-if="!category.items || category.items.length === 0" class="items-empty">
            No items yet —
            <button class="link-btn" @click="openAddItem(category)">add the first one</button>
          </div>

          <div
            v-for="item in category.items"
            :key="item.id"
            class="item-card"
            :class="{ unavailable: !item.is_available }"
          >
            <!-- Image -->
            <div class="item-image-wrap">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                class="item-image"
                :alt="item.name"
              />
              <div v-else class="item-image-placeholder">🍽️</div>
              <!-- Availability overlay -->
              <div v-if="!item.is_available" class="unavailable-overlay">Unavailable</div>
            </div>

            <!-- Info -->
            <div class="item-body">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-desc" v-if="item.description">{{ item.description }}</div>
              <div class="item-footer">
                <span class="item-price"
                  >{{ currencySymbol }}{{ Number(item.price).toFixed(2) }}</span
                >
                <div class="item-actions">
                  <button
                    class="avail-toggle"
                    :class="{ on: item.is_available }"
                    @click="toggleItem(item)"
                    :title="item.is_available ? 'Mark unavailable' : 'Mark available'"
                  >
                    {{ item.is_available ? 'On' : 'Off' }}
                  </button>
                  <button class="icon-btn small" @click="openEditItem(item, category)" title="Edit">
                    ✎
                  </button>
                  <button
                    class="icon-btn small danger"
                    @click="confirmDeleteItem(item, category)"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ CATEGORY MODAL ════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="categoryModal.open"
        class="modal-backdrop"
        @click.self="categoryModal.open = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ categoryModal.editing ? 'Edit Category' : 'New Category' }}
            </h2>
            <button class="modal-close" @click="categoryModal.open = false">✕</button>
          </div>

          <div class="modal-error" v-if="categoryModal.error">{{ categoryModal.error }}</div>

          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">Category Name</label>
              <input
                v-model="categoryModal.name"
                type="text"
                class="field-input"
                placeholder="e.g. Starters, Mains, Drinks"
                @keyup.enter="saveCategory"
                autofocus
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="categoryModal.open = false">Cancel</button>
            <button class="btn-primary" :disabled="categoryModal.saving" @click="saveCategory">
              {{
                categoryModal.saving
                  ? 'Saving…'
                  : categoryModal.editing
                    ? 'Save Changes'
                    : 'Create Category'
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ ITEM MODAL ════════════════════════════ -->
    <Teleport to="body">
      <div v-if="itemModal.open" class="modal-backdrop" @click.self="itemModal.open = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">{{ itemModal.editing ? 'Edit Item' : 'New Item' }}</h2>
            <button class="modal-close" @click="itemModal.open = false">✕</button>
          </div>

          <div class="modal-error" v-if="itemModal.error">{{ itemModal.error }}</div>

          <div class="modal-body">
            <!-- Image upload -->
            <div class="field-group">
              <label class="field-label">Photo <span class="optional">(optional)</span></label>
              <div
                class="image-upload-area"
                @click="triggerImageUpload"
                :class="{ 'has-image': itemModal.imagePreview }"
              >
                <img
                  v-if="itemModal.imagePreview"
                  :src="itemModal.imagePreview"
                  class="upload-preview"
                />
                <div v-else class="upload-placeholder">
                  <span class="upload-icon-lg">↑</span>
                  <span>Click to upload image</span>
                  <span class="upload-hint">PNG or JPG, max 2MB</span>
                </div>
                <button
                  v-if="itemModal.imagePreview"
                  class="remove-image"
                  @click.stop="removeImage"
                >
                  ✕
                </button>
              </div>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleImageChange"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Item Name</label>
              <input
                v-model="itemModal.name"
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
                v-model="itemModal.description"
                class="field-input field-textarea"
                placeholder="Brief description of the dish…"
                rows="2"
              />
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Price</label>
                <div class="price-wrap">
                  <span class="currency-sym">{{ currencySymbol }}</span>
                  <input
                    v-model="itemModal.price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="field-input price-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Category</label>
                <select v-model="itemModal.categoryId" class="field-input">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Availability</label>
              <div class="availability-row">
                <button
                  class="avail-big"
                  :class="{ on: itemModal.isAvailable }"
                  @click="itemModal.isAvailable = true"
                >
                  ✓ Available
                </button>
                <button
                  class="avail-big"
                  :class="{ off: !itemModal.isAvailable }"
                  @click="itemModal.isAvailable = false"
                >
                  ✕ Unavailable
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="itemModal.open = false">Cancel</button>
            <button class="btn-primary" :disabled="itemModal.saving" @click="saveItem">
              {{ itemModal.saving ? 'Saving…' : itemModal.editing ? 'Save Changes' : 'Add Item' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ DELETE CONFIRM ════════════════════════ -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="modal-backdrop" @click.self="deleteModal.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">
              Delete {{ deleteModal.type === 'category' ? 'Category' : 'Item' }}?
            </h2>
            <button class="modal-close" @click="deleteModal.open = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              <span v-if="deleteModal.type === 'category'">
                This will delete <strong>{{ deleteModal.target?.name }}</strong> and all its items
                permanently.
              </span>
              <span v-else>
                This will permanently delete <strong>{{ deleteModal.target?.name }}</strong
                >.
              </span>
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteModal.open = false">Cancel</button>
            <button class="btn-danger" :disabled="deleteModal.saving" @click="confirmDelete">
              {{ deleteModal.saving ? 'Deleting…' : 'Yes, Delete' }}
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
const loading = ref(true)
const categories = ref([])
const restaurantId = ref(null)
const currency = ref('USD')
const imageInput = ref(null)

const currencySymbol = computed(() => {
  const map = { USD: '$', EUR: '€', GBP: '£', KHR: '៛', THB: '฿', SGD: 'S$', AUD: 'A$', JPY: '¥' }
  return map[currency.value] || '$'
})

const totalItems = computed(() => categories.value.reduce((n, c) => n + (c.items?.length || 0), 0))

// ── Category modal state ─────────────────────
const categoryModal = ref({
  open: false,
  editing: false,
  id: null,
  name: '',
  saving: false,
  error: '',
})

// ── Item modal state ─────────────────────────
const itemModal = ref({
  open: false,
  editing: false,
  id: null,
  name: '',
  description: '',
  price: '',
  categoryId: null,
  isAvailable: true,
  imagePreview: '',
  imageFile: null,
  saving: false,
  error: '',
})

// ── Delete modal state ───────────────────────
const deleteModal = ref({
  open: false,
  type: null,
  target: null,
  parentCategory: null,
  saving: false,
})

// ── Load data ────────────────────────────────
onMounted(async () => {
  if (!authStore.profile) await authStore.fetchProfile()
  restaurantId.value = authStore.profile?.restaurant_id
  if (!restaurantId.value) return

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('currency')
    .eq('id', restaurantId.value)
    .single()
  if (restaurant) currency.value = restaurant.currency || 'USD'

  await loadMenu()
})

async function loadMenu() {
  loading.value = true
  const { data: cats } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurantId.value)
    .order('sort_order')

  if (cats) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId.value)
      .order('sort_order')

    categories.value = cats.map((c) => ({
      ...c,
      _collapsed: false,
      items: items?.filter((i) => i.category_id === c.id) || [],
    }))
  }
  loading.value = false
}

// ── Category CRUD ─────────────────────────────
function openAddCategory() {
  categoryModal.value = { open: true, editing: false, id: null, name: '', saving: false, error: '' }
}
function openEditCategory(cat) {
  categoryModal.value = {
    open: true,
    editing: true,
    id: cat.id,
    name: cat.name,
    saving: false,
    error: '',
  }
}

async function saveCategory() {
  const m = categoryModal.value
  if (!m.name.trim()) {
    m.error = 'Please enter a category name.'
    return
  }
  m.saving = true
  m.error = ''

  try {
    if (m.editing) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: m.name.trim() })
        .eq('id', m.id)
      if (error) throw error
      const cat = categories.value.find((c) => c.id === m.id)
      if (cat) cat.name = m.name.trim()
    } else {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert({
          restaurant_id: restaurantId.value,
          name: m.name.trim(),
          sort_order: categories.value.length,
        })
        .select()
        .single()
      if (error) throw error
      categories.value.push({ ...data, _collapsed: false, items: [] })
    }
    categoryModal.value.open = false
  } catch (e) {
    m.error = e.message
  } finally {
    m.saving = false
  }
}

async function toggleCategory(cat) {
  cat.is_active = !cat.is_active
  await supabase.from('menu_categories').update({ is_active: cat.is_active }).eq('id', cat.id)
}

// ── Item CRUD ─────────────────────────────────
function openAddItem(category) {
  itemModal.value = {
    open: true,
    editing: false,
    id: null,
    name: '',
    description: '',
    price: '',
    categoryId: category.id,
    isAvailable: true,
    imagePreview: '',
    imageFile: null,
    saving: false,
    error: '',
  }
}
function openEditItem(item, category) {
  itemModal.value = {
    open: true,
    editing: true,
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    categoryId: category.id,
    isAvailable: item.is_available,
    imagePreview: item.image_url || '',
    imageFile: null,
    saving: false,
    error: '',
  }
}

function triggerImageUpload() {
  imageInput.value?.click()
}

function handleImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    itemModal.value.error = 'Image must be under 2MB.'
    return
  }
  itemModal.value.imageFile = file
  itemModal.value.imagePreview = URL.createObjectURL(file)
  e.target.value = ''
}

function removeImage() {
  itemModal.value.imageFile = null
  itemModal.value.imagePreview = ''
}

async function saveItem() {
  const m = itemModal.value
  if (!m.name.trim()) {
    m.error = 'Please enter an item name.'
    return
  }
  m.saving = true
  m.error = ''

  try {
    let image_url = m.imagePreview && !m.imageFile ? m.imagePreview : null

    // Upload new image if provided
    if (m.imageFile) {
      const ext = m.imageFile.name.split('.').pop()
      const itemId = m.editing ? m.id : crypto.randomUUID()
      const path = `${restaurantId.value}/${itemId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, m.imageFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const payload = {
      name: m.name.trim(),
      description: m.description.trim() || null,
      price: parseFloat(m.price) || 0,
      category_id: m.categoryId,
      is_available: m.isAvailable,
      image_url,
      updated_at: new Date().toISOString(),
    }

    if (m.editing) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', m.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('menu_items').insert({
        ...payload,
        restaurant_id: restaurantId.value,
        sort_order: 0,
      })
      if (error) throw error
    }

    await loadMenu()
    itemModal.value.open = false
  } catch (e) {
    m.error = e.message
  } finally {
    m.saving = false
  }
}

async function toggleItem(item) {
  item.is_available = !item.is_available
  await supabase.from('menu_items').update({ is_available: item.is_available }).eq('id', item.id)
}

// ── Delete ────────────────────────────────────
function confirmDeleteCategory(cat) {
  deleteModal.value = {
    open: true,
    type: 'category',
    target: cat,
    parentCategory: null,
    saving: false,
  }
}
function confirmDeleteItem(item, cat) {
  deleteModal.value = { open: true, type: 'item', target: item, parentCategory: cat, saving: false }
}

async function confirmDelete() {
  const d = deleteModal.value
  d.saving = true
  try {
    if (d.type === 'category') {
      await supabase.from('menu_categories').delete().eq('id', d.target.id)
      categories.value = categories.value.filter((c) => c.id !== d.target.id)
    } else {
      await supabase.from('menu_items').delete().eq('id', d.target.id)
      const cat = categories.value.find((c) => c.id === d.parentCategory.id)
      if (cat) cat.items = cat.items.filter((i) => i.id !== d.target.id)
    }
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

.menu-page {
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
.icon-btn.small {
  width: 26px;
  height: 26px;
  font-size: 11px;
}

.link-btn {
  background: none;
  border: none;
  color: #c8733a;
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
  font-family: 'DM Sans', sans-serif;
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

/* Categories */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-block {
  background: white;
  border: 1.5px solid #ede9e2;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.category-block:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1.5px solid #f0ece5;
  background: #fdfcfa;
}
.collapsed .category-header {
  border-bottom: none;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  flex-shrink: 0;
}
.collapse-arrow {
  display: inline-block;
  transition: transform 0.2s;
  font-size: 14px;
}
.collapse-arrow.rotated {
  transform: rotate(-90deg);
}

.category-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}
.category-count {
  font-size: 12px;
  color: #bbb;
  background: #f0ece5;
  padding: 2px 8px;
  border-radius: 99px;
}

.category-status {
  display: flex;
  align-items: center;
}
.toggle-btn {
  padding: 4px 12px;
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
.toggle-btn.active {
  border-color: #4ade80;
  color: #16a34a;
  background: #f0fdf4;
}

.category-actions {
  display: flex;
  gap: 6px;
}

.btn-add-item {
  padding: 6px 14px;
  background: #f5f3ef;
  border: 1.5px solid #e2ddd6;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
}
.btn-add-item:hover {
  background: #c8733a;
  border-color: #c8733a;
  color: white;
}

/* Items grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
}

.items-empty {
  grid-column: 1/-1;
  text-align: center;
  padding: 24px;
  color: #bbb;
  font-size: 13px;
}

.item-card {
  border: 1.5px solid #ede9e2;
  border-radius: 10px;
  overflow: hidden;
  background: white;
  transition: all 0.15s;
  position: relative;
}
.item-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  border-color: #d6cfc4;
}
.item-card.unavailable {
  opacity: 0.6;
}

.item-image-wrap {
  position: relative;
  height: 120px;
  background: #f5f3ef;
  overflow: hidden;
}
.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #ccc;
}
.unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.item-body {
  padding: 10px 12px;
}
.item-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 3px;
  line-height: 1.3;
}
.item-desc {
  font-size: 11.5px;
  color: #aaa;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #c8733a;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.avail-toggle {
  padding: 3px 8px;
  border-radius: 99px;
  border: 1px solid #e2ddd6;
  font-size: 10px;
  font-weight: 700;
  color: #aaa;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.avail-toggle.on {
  border-color: #4ade80;
  color: #16a34a;
  background: #f0fdf4;
}

/* ── Modals ───────────────────────────────── */
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
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-lg {
  max-width: 540px;
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
  margin: 0 24px;
  margin-top: 12px;
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
  max-height: 60vh;
  overflow-y: auto;
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
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}
.optional {
  font-weight: 400;
  color: #bbb;
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
.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.price-wrap {
  display: flex;
}
.currency-sym {
  padding: 9px 11px;
  background: #f4f0ea;
  border: 1.5px solid #e2ddd6;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
}
.price-input {
  border-radius: 0 8px 8px 0 !important;
}

/* Image upload */
.image-upload-area {
  height: 140px;
  border: 2px dashed #d6cfc4;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdfcfa;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
}
.image-upload-area:hover,
.image-upload-area.has-image {
  border-color: #c8733a;
  border-style: solid;
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
  gap: 4px;
  color: #aaa;
  font-size: 12px;
}
.upload-icon-lg {
  font-size: 22px;
  color: #c8733a;
}
.upload-hint {
  font-size: 10px;
  color: #ccc;
}
.remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hidden-input {
  display: none;
}

/* Availability toggle */
.availability-row {
  display: flex;
  gap: 8px;
}
.avail-big {
  flex: 1;
  padding: 9px;
  border: 1.5px solid #e2ddd6;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.avail-big.on {
  border-color: #4ade80;
  color: #16a34a;
  background: #f0fdf4;
}
.avail-big.off {
  border-color: #fca5a5;
  color: #dc2626;
  background: #fff5f5;
}

/* Delete warning */
.delete-warning {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}
</style>
