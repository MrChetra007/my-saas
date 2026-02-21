<template>
  <div class="kitchen-orders">
    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count" v-if="tabCount(tab.key) > 0">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Orders Grid -->
    <div class="orders-grid">
      <div v-if="filteredOrders.length === 0" class="empty">
        <p>No {{ activeTab }} orders</p>
      </div>

      <div v-for="order in filteredOrders" :key="order.id" class="order-card">
        <div class="order-card-header">
          <span class="table-name">{{ order.tables?.name ?? 'Table' }}</span>
          <span class="order-time">{{ elapsed(order.created_at) }}</span>
        </div>
        <ul class="order-items">
          <li v-for="item in order.order_items" :key="item.id">
            <span class="item-qty">{{ item.quantity }}×</span>
            <span class="item-name">{{ item.menu_items?.name }}</span>
            <span v-if="item.notes" class="item-note">— {{ item.notes }}</span>
          </li>
        </ul>
        <div class="order-actions">
          <button v-if="activeTab === 'pending'" class="btn btn--accept" @click="accept(order.id)">
            Accept
          </button>
          <button v-if="activeTab === 'pending'" class="btn btn--reject" @click="reject(order.id)">
            Reject
          </button>
          <button
            v-if="activeTab === 'cooking'"
            class="btn btn--ready"
            @click="markReady(order.id)"
          >
            Mark Ready
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const orders = ref([])
const activeTab = ref('pending')
let channel = null

const tabs = [
  { key: 'pending', label: '🔔 Pending' },
  { key: 'cooking', label: '🔥 Cooking' },
  { key: 'done', label: '✅ Done' },
]

const filteredOrders = computed(() => orders.value.filter((o) => o.status === activeTab.value))

function tabCount(key) {
  return orders.value.filter((o) => o.status === key).length
}

function elapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 60000)
  return diff < 1 ? 'just now' : `${diff}m ago`
}

async function fetchOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .in('status', ['pending', 'cooking', 'done'])
    .order('created_at', { ascending: true })
  if (data) orders.value = data
}

async function accept(id) {
  await supabase.from('orders').update({ status: 'cooking' }).eq('id', id)
}
async function reject(id) {
  await supabase.from('orders').update({ status: 'rejected' }).eq('id', id)
}
async function markReady(id) {
  await supabase.from('orders').update({ status: 'ready' }).eq('id', id)
}

onMounted(async () => {
  await fetchOrders()
  channel = supabase
    .channel('kitchen-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
    .subscribe()
})
onUnmounted(() => channel && supabase.removeChannel(channel))
</script>

<style scoped>
.kitchen-orders {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #111827;
  color: #f9fafb;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: #1f2937;
  border-bottom: 1px solid #374151;
  flex-shrink: 0;
}
.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1.5px solid #374151;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.tab:hover {
  border-color: #4b5563;
  color: #f9fafb;
}
.tab--active {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}
.tab-count {
  background: #f97316;
  color: white;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
}
.orders-grid {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  align-content: start;
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #4b5563;
  padding: 4rem;
  font-size: 1rem;
}
.order-card {
  background: #1f2937;
  border: 1.5px solid #374151;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f9fafb;
}
.order-time {
  font-size: 0.78rem;
  color: #6b7280;
}
.order-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.order-items li {
  font-size: 0.9rem;
  color: #d1d5db;
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
}
.item-qty {
  font-weight: 700;
  color: #f97316;
  flex-shrink: 0;
}
.item-name {
  font-weight: 500;
}
.item-note {
  font-size: 0.78rem;
  color: #6b7280;
  font-style: italic;
}
.order-actions {
  display: flex;
  gap: 0.5rem;
}
.btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.btn--accept {
  background: #16a34a;
  color: white;
}
.btn--reject {
  background: #374151;
  color: #9ca3af;
}
.btn--ready {
  background: #2563eb;
  color: white;
}
.btn:hover {
  opacity: 0.85;
}
</style>
