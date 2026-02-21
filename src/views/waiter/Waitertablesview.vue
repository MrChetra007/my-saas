<template>
  <div class="view-page">
    <div class="view-header">
      <h1 class="view-title">Tables</h1>
      <p class="view-sub">
        Toggle tables active or inactive. Inactive tables won't accept new orders via QR.
      </p>
    </div>

    <div v-if="loading" class="loading">Loading tables...</div>

    <div v-else-if="tables.length === 0" class="empty">No tables found.</div>

    <div class="tables-grid" v-else>
      <div
        v-for="table in tables"
        :key="table.id"
        class="table-card"
        :class="table.is_active ? 'table-card--active' : 'table-card--inactive'"
      >
        <div class="table-card-info">
          <span class="table-icon">🪑</span>
          <div>
            <span class="table-name">{{ table.name }}</span>
            <span class="table-status">{{ table.is_active ? 'Active' : 'Inactive' }}</span>
          </div>
        </div>

        <!-- Toggle -->
        <button
          class="toggle"
          :class="{ 'toggle--on': table.is_active }"
          @click="toggleTable(table)"
          :disabled="toggling === table.id"
        >
          <span class="toggle-thumb"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const tables = ref([])
const loading = ref(true)
const toggling = ref(null)

async function fetchTables() {
  const { data } = await supabase
    .from('tables')
    .select('id, name, is_active')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .order('name')
  if (data) tables.value = data
  loading.value = false
}

async function toggleTable(table) {
  toggling.value = table.id
  const newValue = !table.is_active

  const { error } = await supabase.from('tables').update({ is_active: newValue }).eq('id', table.id)

  if (!error) {
    // Update locally — no need to refetch
    table.is_active = newValue
  }

  toggling.value = null
}

onMounted(fetchTables)
</script>

<style scoped>
.view-page {
  padding: 2rem;
  max-width: 680px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
}
.view-header {
  margin-bottom: 1.5rem;
}
.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;
}
.view-sub {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
}
.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.table-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 1.5px solid;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.table-card--active {
  border-color: #86efac;
  background: #f0fdf4;
}
.table-card--inactive {
  border-color: #e5e7eb;
  background: #fafafa;
}

.table-card-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.table-icon {
  font-size: 1.5rem;
}
.table-name {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: #111827;
}
.table-status {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.table-card--active .table-status {
  color: #16a34a;
}
.table-card--inactive .table-status {
  color: #9ca3af;
}

/* Toggle Switch */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: #d1d5db;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}
.toggle--on {
  background: #16a34a;
}
.toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.toggle--on .toggle-thumb {
  transform: translateX(20px);
}
</style>
