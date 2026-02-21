<template>
  <div class="view-page">
    <div class="view-header">
      <div>
        <h1 class="view-title">Ready to Pay</h1>
        <p class="view-sub">Mark orders as paid when customer settles the bill.</p>
      </div>
      <!-- Today's revenue counter -->
      <div class="revenue-box">
        <span class="revenue-label">Today's Revenue</span>
        <span class="revenue-value">{{ formatCurrency(todayRevenue) }}</span>
      </div>
    </div>

    <div v-if="orders.length === 0" class="empty">No orders ready for payment.</div>

    <div class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-top">
          <div>
            <span class="table-name">{{ order.tables?.name ?? 'Table' }}</span>
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
          </div>
          <span class="order-total">{{ formatCurrency(orderTotal(order)) }}</span>
        </div>

        <ul class="items">
          <li v-for="item in order.order_items" :key="item.id">
            <div class="item-main">
              <span class="qty">{{ item.quantity }}×</span>
              <span class="item-name">{{ item.menu_items?.name }}</span>
              <span class="item-price">{{ formatCurrency(item.unit_price * item.quantity) }}</span>
            </div>
            <!-- ✅ Show notes if present -->
            <div class="item-note" v-if="item.notes">
              <span class="note-icon">📝</span> {{ item.notes }}
            </div>
          </li>
        </ul>

        <button class="btn-paid" @click="markPaid(order.id)">Mark as Paid ✓</button>
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
const todayRevenue = ref(0)
let channel = null

function orderTotal(order) {
  return order.order_items?.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0
}
function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function fetchOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'ready')
    .order('created_at', { ascending: true })
  if (data) orders.value = data
}

async function fetchTodayRevenue() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('orders')
    .select('order_items(unit_price, quantity)')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'paid')
    .gte('created_at', today.toISOString())
  if (data) {
    todayRevenue.value = data.reduce(
      (sum, order) =>
        sum + (order.order_items?.reduce((s, i) => s + i.unit_price * i.quantity, 0) ?? 0),
      0,
    )
  }
}

async function markPaid(id) {
  await supabase.from('orders').update({ status: 'paid' }).eq('id', id)
  await fetchTodayRevenue()
}

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchTodayRevenue()])
  channel = supabase
    .channel('cashier-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
    .subscribe()
})
onUnmounted(() => channel && supabase.removeChannel(channel))
</script>

<style scoped>
.view-page {
  padding: 2rem;
  max-width: 760px;
  margin: 0 auto;
  font-family: 'DM Sans', sans-serif;
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
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

/* Revenue Box */
.revenue-box {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  text-align: right;
  flex-shrink: 0;
}
.revenue-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #16a34a;
  margin-bottom: 0.2rem;
}
.revenue-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: #111827;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-size: 0.95rem;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.table-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: block;
}
.order-time {
  font-size: 0.78rem;
  color: #9ca3af;
}
.order-total {
  font-size: 1.1rem;
  font-weight: 800;
  color: #111827;
}

.items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.items li {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.item-main {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.88rem;
  color: #374151;
}
.qty {
  font-weight: 700;
  color: #6b7280;
  flex-shrink: 0;
}
.item-name {
  flex: 1;
}
.item-price {
  margin-left: auto;
  color: #6b7280;
  flex-shrink: 0;
}

/* ✅ Notes */
.item-note {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #6366f1;
  font-style: italic;
  padding-left: 1.4rem;
}
.note-icon {
  font-style: normal;
  font-size: 0.7rem;
}

.btn-paid {
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.7rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-paid:hover {
  background: #15803d;
}
</style>
