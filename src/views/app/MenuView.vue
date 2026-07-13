<template>
  <div class="menu-page">
    <!-- ── Header ──────────────────────────────────────── -->
    <div class="page-header">
      <h1 class="page-title">{{ $t('menu.title') }}</h1>
      <button class="btn-add-item" @click="openAddItem(activeCategory)">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ $t('menu.addItem') }}
      </button>
    </div>

    <!-- ── Loading ─────────────────────────────────────── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <!-- ── Layout ──────────────────────────────────────── -->
    <div v-else class="menu-layout">
      <!-- ── Sidebar ───────────────────────────────────── -->
      <aside class="sidebar">
        <p class="sidebar-label">{{ $t('menu.categories') }}</p>

        <div class="category-list">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-item"
            :class="{ active: activeCategory?.id === cat.id }"
            @click="activeCategory = cat"
          >
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">({{ cat.items?.length || 0 }})</span>
            <div class="cat-actions" @click.stop>
              <button class="cat-action-btn" @click="openEditCategory(cat)" :title="$t('menu.edit')">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                class="cat-action-btn cat-action-btn--danger"
                @click="confirmDeleteCategory(cat)"
                :title="$t('menu.delete')"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="btn-add-category" @click="openAddCategory">{{ $t('menu.addCategory') }}</button>
      </aside>

      <!-- ── Items area ─────────────────────────────────── -->
      <div class="items-area">
        <!-- Search -->
        <div class="search-wrap">
          <svg
            class="search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="$t('menu.searchPlaceholder')"
          />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Empty category -->
        <div v-if="!activeCategory" class="empty-state">
          <p>{{ $t('menu.selectCategory') }}</p>
        </div>

        <!-- Items grid -->
        <div v-else-if="filteredItems.length === 0" class="empty-state">
          <p v-if="searchQuery">{{ $t('menu.noMatchingItems') }} "{{ searchQuery }}"</p>
          <p v-else>
            {{ $t('menu.noItems') }}
            <button class="link-btn" @click="openAddItem(activeCategory)">{{ $t('menu.addFirstItem') }}</button>
          </p>
        </div>

        <div v-else class="items-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="item-card"
            :class="{ 'item-card--unavailable': !item.is_available }"
          >
            <!-- Image -->
            <div class="item-image-wrap">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.name"
                class="item-image"
              />
              <div v-else class="item-image-placeholder">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div v-if="!item.is_available" class="item-image-overlay">
                <span>{{ $t('menu.soldOut') }}</span>
              </div>
            </div>

            <!-- Body -->
            <div class="item-card-body">
              <div class="item-main">
                <div class="item-name-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span v-if="!item.is_available" class="sold-out-badge">{{ $t('menu.soldOut') }}</span>
                </div>
                <p class="item-desc" v-if="item.description">{{ item.description }}</p>
                <span class="item-price"
                  >{{ currencySymbol }}{{ Number(item.price).toFixed(2) }}</span
                >
              </div>

              <div class="item-controls">
                <button
                  class="ctrl-btn ctrl-btn--avail"
                  :class="{
                    'ctrl-btn--on': item.is_available,
                    'ctrl-btn--off': !item.is_available,
                  }"
                  @click="toggleItem(item)"
                  :title="item.is_available ? $t('menu.markUnavailable') : $t('menu.markAvailable')"
                >
                  <svg
                    v-if="item.is_available"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg
                    v-else
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <button
                  class="ctrl-btn ctrl-btn--edit"
                  @click="openEditItem(item, activeCategory)"
                  :title="$t('menu.edit')"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  class="ctrl-btn ctrl-btn--delete"
                  @click="confirmDeleteItem(item, activeCategory)"
                  :title="$t('menu.delete')"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ CATEGORY MODAL ════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="categoryModal.open"
        class="modal-backdrop"
        @click.self="categoryModal.open = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ categoryModal.editing ? $t('menu.editCategory') : $t('menu.newCategory') }}
            </h2>
            <button class="modal-close" @click="categoryModal.open = false">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-error" v-if="categoryModal.error">{{ categoryModal.error }}</div>
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">{{ $t('menu.categoryNameLabel') }}</label>
              <input
                v-model="categoryModal.name"
                type="text"
                class="field-input"
                :placeholder="$t('menu.categoryNamePlaceholder')"
                @keyup.enter="saveCategory"
                autofocus
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="categoryModal.open = false">{{ $t('common.cancel') }}</button>
            <button class="btn-primary" :disabled="categoryModal.saving" @click="saveCategory">
              {{
                categoryModal.saving ? $t('common.saving') : categoryModal.editing ? $t('common.saveChanges') : $t('menu.createCategory')
              }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ ITEM MODAL ════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="itemModal.open" class="modal-backdrop" @click.self="itemModal.open = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">{{ itemModal.editing ? $t('menu.editItem') : $t('menu.newItem') }}</h2>
            <button class="modal-close" @click="itemModal.open = false">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-error" v-if="itemModal.error">{{ itemModal.error }}</div>
          <div class="modal-body">
            <!-- Image upload -->
            <div class="field-group">
              <label class="field-label">{{ $t('menu.photo') }} <span class="optional">{{ $t('common.optional') }}</span></label>
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
                  <span>{{ $t('menu.clickToUpload') }}</span>
                  <span class="upload-hint">{{ $t('menu.uploadHint') }}</span>
                </div>
                <button
                  v-if="itemModal.imagePreview"
                  class="remove-image"
                  @click.stop="removeImage"
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
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleImageChange"
              />
            </div>

            <div class="field-group">
              <label class="field-label">{{ $t('menu.itemNameLabel') }}</label>
              <input
                v-model="itemModal.name"
                type="text"
                class="field-input"
                :placeholder="$t('menu.itemNamePlaceholder')"
              />
            </div>

            <div class="field-group">
              <label class="field-label"
                >{{ $t('menu.description') }} <span class="optional">{{ $t('common.optional') }}</span></label
              >
              <textarea
                v-model="itemModal.description"
                class="field-input field-textarea"
                :placeholder="$t('menu.descriptionPlaceholder')"
                rows="2"
              />
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">{{ $t('menu.priceLabel') }}</label>
                <div class="price-wrap">
                  <span class="currency-sym">{{ currencySymbol }}</span>
                  <input
                    v-model="itemModal.price"
                    type="number"
                    step="0.01"
                    min="0"
                    class="field-input price-input"
                    :placeholder="$t('menu.pricePlaceholder')"
                  />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">{{ $t('menu.categoryLabel') }}</label>
                <select v-model="itemModal.categoryId" class="field-input">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">{{ $t('menu.availability') }}</label>
              <div class="availability-row">
                <button
                  class="avail-big"
                  :class="{ on: itemModal.isAvailable }"
                  @click="itemModal.isAvailable = true"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {{ $t('menu.available') }}
                </button>
                <button
                  class="avail-big"
                  :class="{ off: !itemModal.isAvailable }"
                  @click="itemModal.isAvailable = false"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {{ $t('menu.soldOutToggle') }}
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="itemModal.open = false">{{ $t('common.cancel') }}</button>
            <button class="btn-primary" :disabled="itemModal.saving" @click="saveItem">
              {{ itemModal.saving ? $t('common.saving') : itemModal.editing ? $t('common.saveChanges') : $t('menu.addItem') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══ DELETE CONFIRM ════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="modal-backdrop" @click.self="deleteModal.open = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h2 class="modal-title">
              {{ deleteModal.type === 'category' ? $t('menu.deleteCategoryTitle') : $t('menu.deleteItemTitle') }}
            </h2>
            <button class="modal-close" @click="deleteModal.open = false">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              <span v-if="deleteModal.type === 'category'">
                {{ $t('menu.deleteWarning') }} <strong>{{ deleteModal.target?.name }}</strong> {{ $t('menu.deleteCategoryWarning') }}
              </span>
              <span v-else>
                {{ $t('menu.deleteWarning') }} <strong>{{ deleteModal.target?.name }}</strong>.
              </span>
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="deleteModal.open = false">{{ $t('common.cancel') }}</button>
            <button class="btn-danger" :disabled="deleteModal.saving" @click="confirmDelete">
              {{ deleteModal.saving ? $t('menu.deleting') : $t('menu.confirmDelete') }}
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
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()
const loading = ref(true)
const categories = ref([])
const activeCategory = ref(null)
const searchQuery = ref('')
const restaurantId = ref(null)
const currency = ref('USD')
const imageInput = ref(null)

const currencySymbol = computed(() => {
  const currency = authStore.restaurantCurrency || 'USD'
  const map = { USD: '$', EUR: '€', GBP: '£', KHR: '៛', THB: '฿', SGD: 'S$', AUD: 'A$', JPY: '¥' }

  // Known currency — use the map
  if (map[currency]) return map[currency]

  // Custom currency: "RM MYR" → extract symbol before the space
  const spaceIndex = currency.indexOf(' ')
  if (spaceIndex !== -1) return currency.slice(0, spaceIndex)

  // Fallback
  return currency || '$'
})

const filteredItems = computed(() => {
  const items = activeCategory.value?.items || []
  if (!searchQuery.value.trim()) return items
  const q = searchQuery.value.toLowerCase()
  return items.filter(
    (i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q),
  )
})

// ── Modals ──────────────────────────────────────────────

const categoryModal = ref({
  open: false,
  editing: false,
  id: null,
  name: '',
  saving: false,
  error: '',
})
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
const deleteModal = ref({
  open: false,
  type: null,
  target: null,
  parentCategory: null,
  saving: false,
})

// ── Load ─────────────────────────────────────────────────

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
      items: items?.filter((i) => i.category_id === c.id) || [],
    }))
    if (!activeCategory.value && categories.value.length) activeCategory.value = categories.value[0]
    else if (activeCategory.value) {
      activeCategory.value =
        categories.value.find((c) => c.id === activeCategory.value.id) || categories.value[0]
    }
  }
  loading.value = false
}

// ── Category CRUD ─────────────────────────────────────────

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
    m.error = t('menu.categoryNameRequired')
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
    } else {
      const { error } = await supabase.from('menu_categories').insert({
        restaurant_id: restaurantId.value,
        name: m.name.trim(),
        sort_order: categories.value.length,
      })
      if (error) throw error
    }
    await loadMenu()
    categoryModal.value.open = false
  } catch (e) {
    m.error = e.message
  } finally {
    m.saving = false
  }
}

// ── Item CRUD ─────────────────────────────────────────────

function openAddItem(category) {
  if (!category) return
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
    itemModal.value.error = t('menu.imageTooLarge')
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
    m.error = t('menu.itemNameRequired')
    return
  }
  m.saving = true
  m.error = ''
  try {
    let image_url = m.imagePreview && !m.imageFile ? m.imagePreview : null
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
      const { error } = await supabase
        .from('menu_items')
        .insert({ ...payload, restaurant_id: restaurantId.value, sort_order: 0 })
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

// ── Delete ─────────────────────────────────────────────────

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
    } else {
      await supabase.from('menu_items').delete().eq('id', d.target.id)
    }
    await loadMenu()
    deleteModal.value.open = false
  } catch (e) {
    console.error(e)
  } finally {
    d.saving = false
  }
}
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────── */
.menu-page {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── Header ──────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.page-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.5px;
}
.btn-add-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: var(--color-accent, #c8733a);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill, 999px);
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
  box-shadow: var(--shadow-glow, 0 8px 24px rgba(200, 115, 58, 0.3));
}
.btn-add-item:hover {
  background: var(--color-accent-hover, #d4844e);
}

/* ── Loading ─────────────────────────────────────────────── */
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-top-color: var(--color-accent, #c8733a);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Layout ──────────────────────────────────────────────── */
.menu-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: start;
}
.sidebar-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  padding: 0 8px;
  margin-bottom: 6px;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}
.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  position: relative;
}
.category-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text-primary, #fff);
}
.category-item:hover .cat-actions {
  opacity: 1;
}
.category-item.active {
  background: var(--color-accent-muted, rgba(200, 115, 58, 0.12));
  border: 1px solid var(--color-accent-border, rgba(200, 115, 58, 0.25));
  color: var(--color-accent, #c8733a);
}
.category-item.active .cat-count {
  color: rgba(200, 115, 58, 0.6);
}
.cat-name {
  flex: 1;
  font-size: 13.5px;
  font-weight: 500;
}
.cat-count {
  font-size: 12px;
  color: var(--color-text-faint, rgba(255, 255, 255, 0.2));
}
.cat-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.12s;
}
.cat-action-btn {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: none;
  border: none;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    color 0.12s;
}
.cat-action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary, #fff);
}
.cat-action-btn--danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.btn-add-category {
  margin-top: 8px;
  padding: 9px 12px;
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px dashed var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
  width: 100%;
  text-align: center;
}
.btn-add-category:hover {
  border-color: var(--color-accent-border-strong, rgba(200, 115, 58, 0.45));
  color: var(--color-accent, #c8733a);
}

/* ── Items Area ───────────────────────────────────────────── */
.items-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* ── Search ──────────────────────────────────────────────── */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 12px 40px 12px 42px;
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  font-size: 14px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-primary, #fff);
  outline: none;
  transition: border-color 0.15s;
}
.search-input::placeholder {
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.search-input:focus {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
}
.search-clear {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.12s;
}
.search-clear:hover {
  color: var(--color-text-primary, #fff);
}

/* ── Empty ───────────────────────────────────────────────── */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  font-size: 13.5px;
}
.link-btn {
  background: none;
  border: none;
  color: var(--color-accent, #c8733a);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  text-decoration: underline;
  padding: 0;
}

/* ── Items Grid ──────────────────────────────────────────── */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}
.item-card {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-card, 10px);
  overflow: hidden;
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.item-card:hover {
  border-color: var(--color-border-medium, rgba(255, 255, 255, 0.12));
  transform: translateY(-1px);
}
.item-card--unavailable {
  opacity: 0.55;
}

/* Image */
.item-image-wrap {
  position: relative;
  width: 100%;
  height: 150px;
  background: var(--color-bg-elevated, #0e0e0e);
  overflow: hidden;
  flex-shrink: 0;
}
.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.item-card:hover .item-image {
  transform: scale(1.04);
}
.item-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-faint, rgba(255, 255, 255, 0.15));
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.015) 10px,
    rgba(255, 255, 255, 0.015) 20px
  );
}
.item-image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-image-overlay span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 4px 12px;
  border-radius: 999px;
}

.item-card-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}
.item-main {
  flex: 1;
  min-width: 0;
}
.item-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}
.item-name {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.2px;
}
.sold-out-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  padding: 2px 8px;
  border-radius: 999px;
}
.item-desc {
  font-size: 12.5px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-price {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-accent, #c8733a);
}

/* Controls */
.item-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}
.ctrl-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  background: var(--color-bg-elevated, #0e0e0e);
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}
.ctrl-btn--avail.ctrl-btn--on {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.3);
  color: #4ade80;
}
.ctrl-btn--avail.ctrl-btn--off:hover {
  background: rgba(74, 222, 128, 0.08);
  border-color: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}
.ctrl-btn--edit:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--color-border-bright, rgba(255, 255, 255, 0.22));
  color: var(--color-text-primary, #fff);
}
.ctrl-btn--delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* ── Modals ──────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-surface, #161616);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-panel, 16px);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-float, 0 24px 56px rgba(0, 0, 0, 0.5));
  overflow: hidden;
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-lg {
  max-width: 540px;
}
.modal-sm {
  max-width: 380px;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
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
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
}
.modal-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary, #fff);
}
.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: none;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    color 0.12s;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary, #fff);
}

.modal-error {
  margin: 12px 24px 0;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #f87171;
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-medium, rgba(255, 255, 255, 0.12)) transparent;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.07));
  background: var(--color-bg-elevated, #0e0e0e);
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
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
}
.optional {
  font-weight: 400;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.field-input {
  width: 100%;
  padding: 9px 13px;
  background: var(--color-bg-elevated, #0e0e0e);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--color-text-primary, #fff);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  appearance: none;
}
.field-input::placeholder {
  color: var(--color-text-muted, rgba(255, 255, 255, 0.3));
}
.field-input:focus {
  border-color: var(--color-accent-border-strong, rgba(200, 115, 58, 0.45));
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.08);
}
.field-textarea {
  resize: vertical;
  min-height: 64px;
}

.price-wrap {
  display: flex;
}
.currency-sym {
  padding: 9px 12px;
  background: var(--color-bg-base, #111);
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
}
.price-input {
  border-radius: 0 8px 8px 0 !important;
}

/* Image upload */
.image-upload-area {
  height: 130px;
  border: 1.5px dashed var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated, #0e0e0e);
  overflow: hidden;
  position: relative;
  transition: border-color 0.15s;
}
.image-upload-area:hover {
  border-color: var(--color-accent-border-strong, rgba(200, 115, 58, 0.45));
}
.image-upload-area.has-image {
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
  gap: 6px;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  font-size: 12px;
}
.upload-hint {
  font-size: 10px;
  color: var(--color-text-faint, rgba(255, 255, 255, 0.2));
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
}
.hidden-input {
  display: none;
}

.availability-row {
  display: flex;
  gap: 8px;
}
.avail-big {
  flex: 1;
  padding: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  background: var(--color-bg-elevated, #0e0e0e);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}
.avail-big.on {
  border-color: rgba(74, 222, 128, 0.35);
  color: #4ade80;
  background: rgba(74, 222, 128, 0.07);
}
.avail-big.off {
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
  background: rgba(239, 68, 68, 0.07);
}

/* Buttons */
.btn-primary {
  padding: 9px 20px;
  background: var(--color-accent, #c8733a);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #d4844e);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 9px 18px;
  background: transparent;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  border: 1px solid var(--color-border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  border-color: var(--color-border-bright, rgba(255, 255, 255, 0.22));
  color: var(--color-text-primary, #fff);
}

.btn-danger {
  padding: 9px 20px;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}
.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-warning {
  font-size: 14px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.55));
  line-height: 1.6;
}
.delete-warning strong {
  color: var(--color-text-primary, #fff);
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .menu-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    align-self: auto;
  }
  .category-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }
  .items-grid {
    grid-template-columns: 1fr;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
