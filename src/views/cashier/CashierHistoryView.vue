<template>
  <div class="view-page">
    <div class="view-header">
      <div>
        <h1 class="view-title">Order History</h1>
        <p class="view-sub">Today's completed and paid orders.</p>
      </div>
      <div class="revenue-box">
        <span class="revenue-label">Today's Revenue</span>
        <span class="revenue-value">{{ formatCurrency(todayRevenue) }}</span>
      </div>
    </div>

    <div v-if="orders.length === 0" class="empty">No completed orders yet today.</div>

    <div class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-top">
          <div>
            <span class="table-name">{{ order.tables?.name ?? 'Table' }}</span>
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
          </div>
          <span class="badge-paid">Paid</span>
        </div>

        <ul class="items">
          <li v-for="item in order.order_items" :key="item.id">
            <div class="item-main">
              <span class="qty">{{ item.quantity }}×</span>
              <span class="item-name">{{ item.menu_items?.name }}</span>
              <span class="item-price">{{ formatCurrency(item.unit_price * item.quantity) }}</span>
            </div>
            <!-- ✅ Notes -->
            <div class="item-note" v-if="item.notes">
              <span class="note-icon">📝</span> {{ item.notes }}
            </div>
          </li>
        </ul>

        <div class="order-footer">
          <span class="total-label">Total</span>
          <span class="total-value">{{ formatCurrency(orderTotal(order)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const orders = ref([])

function orderTotal(order) {
  return order.order_items?.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) ?? 0
}
function formatCurrency(amount) {
  return `$${Number(amount).toFixed(2)}`
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const todayRevenue = computed(() => orders.value.reduce((sum, order) => sum + orderTotal(order), 0))

onMounted(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('orders')
    .select('*, tables(name), order_items(*, menu_items(name))')
    .eq('restaurant_id', authStore.profile?.restaurant_id)
    .eq('status', 'paid')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
  if (data) orders.value = data
})
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
  gap: 0.75rem;
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
.badge-paid {
  background: #d1fae5;
  color: #059669;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  flex-shrink: 0;
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

.order-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
}
.total-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}
.total-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
}
</style>
