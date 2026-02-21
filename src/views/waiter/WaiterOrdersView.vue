<template>
  <div class="view-page">
    <div class="view-header">
      <h1 class="view-title">My Orders</h1>
      <p class="view-sub">Live status of orders you've placed today.</p>
    </div>

    <div v-if="orders.length === 0" class="empty">No orders placed yet.</div>

    <div class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-top">
          <span class="table-name">{{ order.tables?.name ?? 'Table' }}</span>
          <span class="badge" :class="`badge--${order.status}`">{{ order.status }}</span>
        </div>
        <ul class="items">
          <li v-for="item in order.order_items" :key="item.id">
            <span class="qty">{{ item.quantity }}×</span>
            <span>{{ item.menu_items?.name }}</span>
          </li>
        </ul>
        <span class="order-time">{{ formatTime(order.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const orders = ref([])
let channel = null

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function fetchOrders() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .gte('created_at', today.toISOString())
    .not('status', 'in', '(paid,rejected)')
    .order('created_at', { ascending: false })
  if (data) orders.value = data
}

onMounted(async () => {
  await fetchOrders()
  channel = supabase
    .channel('waiter-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
    .subscribe()
})
onUnmounted(() => channel && supabase.removeChannel(channel))
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
.empty {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.order-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}
.badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: capitalize;
}
.badge--pending {
  background: #fef3c7;
  color: #d97706;
}
.badge--cooking {
  background: #fee2e2;
  color: #dc2626;
}
.badge--ready {
  background: #d1fae5;
  color: #059669;
}
.items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.items li {
  display: flex;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #374151;
}
.qty {
  font-weight: 700;
  color: #6b7280;
}
.order-time {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>
