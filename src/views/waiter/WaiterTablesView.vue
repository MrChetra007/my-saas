<template>
  <div class="tables-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('waiter.tables.title') }}</h1>
        <p class="page-subtitle">{{ $t('waiter.tables.subtitle') }}</p>
      </div>
      <div class="stats-pill" v-if="!loading && tables.length > 0">
        <span class="stats-active">{{ activeCount }}</span>
        <span class="stats-separator">/</span>
        <span class="stats-total">{{ tables.length }}</span>
        <span class="stats-label">{{ $t('waiter.tables.active') }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('waiter.tables.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="tables.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <LayoutGrid class="empty-icon" />
      </div>
      <h3 class="empty-title">{{ $t('waiter.tables.emptyTitle') }}</h3>
      <p class="empty-subtitle">{{ $t('waiter.tables.emptySubtitle') }}</p>
    </div>

    <!-- Tables Grid -->
    <div class="tables-grid" v-else>
      <div
        v-for="table in tables"
        :key="table.id"
        class="table-card"
        :class="{
          'table-card--active': table.is_active,
          'table-card--inactive': !table.is_active,
          'table-card--toggling': toggling === table.id,
        }"
      >
        <div class="table-card-content">
          <div class="table-icon-wrap" :class="{ 'table-icon--active': table.is_active }">
            <Armchair class="table-icon" />
          </div>
          <div class="table-info">
            <h3 class="table-name">{{ table.name }}</h3>
            <div class="table-status">
              <span class="status-dot" :class="{ 'status-dot--active': table.is_active }"></span>
              <span class="status-text">{{ table.is_active ? $t('waiter.tables.statusActive') : $t('waiter.tables.statusInactive') }}</span>
            </div>
            <p class="table-hint" v-if="!table.is_active">{{ $t('waiter.tables.qrDisabled') }}</p>
          </div>
        </div>

        <!-- Toggle -->
        <button
          class="toggle-btn"
          :class="{ 'toggle-btn--on': table.is_active }"
          @click="toggleTable(table)"
          :disabled="toggling === table.id"
          :aria-label="table.is_active ? $t('waiter.tables.deactivate', { name: table.name }) : $t('waiter.tables.activate', { name: table.name })"
        >
          <span class="toggle-track">
            <span class="toggle-thumb">
              <Power class="thumb-icon" :class="{ 'thumb-icon--on': table.is_active }" />
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Info Footer -->
    <div class="info-footer" v-if="!loading && tables.length > 0">
      <Info class="info-icon" />
      <p>{{ $t('waiter.tables.infoFooter') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { LayoutGrid, Armchair, Power, Info } from 'lucide-vue-next'

const authStore = useAuthStore()
const tables = ref([])
const loading = ref(true)
const toggling = ref(null)

const activeCount = computed(() => tables.value.filter((t) => t.is_active).length)

async function fetchTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('id, name, is_active')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .order('name')

  if (!error && data) tables.value = data
  loading.value = false
}
let realtimeChannel = null

function subscribeRealtime() {
  const restaurantId = authStore.profile?.restaurant_id
  if (!restaurantId) return

  realtimeChannel = supabase
    .channel('kitchen-tables')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => fetchTables(),
    )
    .subscribe()
}

onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

async function toggleTable(table) {
  toggling.value = table.id
  const newValue = !table.is_active

  try {
    const { error } = await supabase
      .from('tables')
      .update({ is_active: newValue })
      .eq('id', table.id)

    if (!error) {
      // Optimistic update
      table.is_active = newValue
    } else {
      console.error('Toggle error:', error)
    }
  } catch (err) {
    console.error('Toggle failed:', err)
  } finally {
    toggling.value = null
  }
}

onMounted(async () => {
  await fetchTables()
  subscribeRealtime()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=DM+Sans:wght@400;500;600&display=swap');

.tables-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  min-height: 100vh;
  padding-bottom: 100px;
}

@media (max-width: 640px) {
  .tables-page {
    padding: 16px;
  }
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
}

.page-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  max-width: 480px;
  line-height: 1.5;
}

.stats-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 10px 18px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 999px;
  font-family: 'Fraunces', serif;
}

.stats-active {
  font-size: 24px;
  font-weight: 700;
  color: #4ade80;
}

.stats-separator {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 2px;
}

.stats-total {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-left: 6px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: rgba(255, 255, 255, 0.55);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.07);
  border-top-color: #c8733a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 60px 24px;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.35);
}

.empty-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

/* ── Tables Grid ── */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

.table-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #161616;
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.table-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.table-card--active {
  border-color: rgba(74, 222, 128, 0.25);
  background: linear-gradient(135deg, #161616 0%, rgba(74, 222, 128, 0.05) 100%);
}

.table-card--inactive {
  border-color: rgba(255, 255, 255, 0.07);
  background: #161616;
}

.table-card--toggling {
  opacity: 0.7;
  pointer-events: none;
}

.table-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.table-icon-wrap {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.table-icon-wrap.table-icon--active {
  background: rgba(74, 222, 128, 0.15);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
}

.table-icon {
  width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.55);
  transition: all 0.3s ease;
}

.table-icon-wrap.table-icon--active .table-icon {
  color: #4ade80;
}

.table-info {
  flex: 1;
  min-width: 0;
}

.table-name {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  line-height: 1.2;
}

.table-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transition: all 0.3s ease;
}

.status-dot--active {
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

.status-text {
  color: rgba(255, 255, 255, 0.55);
  transition: all 0.3s ease;
}

.table-card--active .status-text {
  color: #4ade80;
}

.table-hint {
  font-size: 12px;
  color: rgba(239, 68, 68, 0.8);
  margin: 6px 0 0;
  font-style: italic;
}

/* ── Toggle Button ── */
.toggle-btn {
  width: 56px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-track {
  display: block;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.toggle-btn--on .toggle-track {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toggle-btn--on .toggle-thumb {
  transform: translateX(24px);
  background: #4ade80;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.5);
}

.thumb-icon {
  width: 14px;
  height: 14px;
  color: rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.thumb-icon--on {
  color: #ffffff;
}

/* Hover effects */
.toggle-btn:hover:not(:disabled) .toggle-track {
  border-color: rgba(255, 255, 255, 0.2);
}

.toggle-btn--on:hover:not(:disabled) .toggle-track {
  border-color: rgba(74, 222, 128, 0.6);
  background: rgba(74, 222, 128, 0.25);
}

/* ── Info Footer ── */
.info-footer {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px 20px;
  background: rgba(200, 115, 58, 0.1);
  border: 1px solid rgba(200, 115, 58, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.5;
}

.info-icon {
  width: 18px;
  height: 18px;
  color: #c8733a;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-footer p {
  margin: 0;
}
</style>
