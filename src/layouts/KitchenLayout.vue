<template>
  <div class="kitchen-layout">
    <header class="kitchen-header">
      <div class="header-left">
        <div class="logo-wrap">
          <img v-if="restaurantLogo" :src="restaurantLogo" alt="logo" class="logo-img" />
          <span v-else class="logo">🍽️</span>
        </div>
        <span class="restaurant-name">{{ restaurantName }}</span>
      </div>
      <div class="header-right">
        <span class="clock">{{ currentTime }}</span>
        <button class="btn-signout" @click="signOut">{{ $t('layouts.signOut') }}</button>
      </div>
    </header>
    <main class="kitchen-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const restaurantName = ref('')
const restaurantLogo = ref('')
const now = ref(new Date())
let timer = null

// Show clock in restaurant's local timezone
const currentTime = computed(() => {
  const timezone = authStore.restaurantTimezone || 'UTC'
  return now.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
  })
})

onMounted(async () => {
  const { data } = await supabase
    .from('restaurants')
    .select('name, logo_url, timezone')
    .eq('id', authStore.profile?.restaurant_id)
    .single()

  if (data) {
    restaurantName.value = data.name
    restaurantLogo.value = data.logo_url || ''
    if (!authStore.restaurantTimezone && data.timezone) {
      authStore.restaurantTimezone = data.timezone
    }
  }

  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => clearInterval(timer))

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.kitchen-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #111827;
  color: #f9fafb;
  font-family: 'DM Sans', 'Noto Sans Khmer', sans-serif;
}
.kitchen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #1f2937;
  border-bottom: 1px solid #374151;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 7px;
}
.logo {
  font-size: 1rem;
}
.restaurant-name {
  font-size: 0.85rem;
  color: #9ca3af;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.clock {
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #f9fafb;
}
.btn-signout {
  background: #374151;
  border: none;
  color: #9ca3af;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-signout:hover {
  background: #4b5563;
  color: #f9fafb;
}
.kitchen-main {
  flex: 1;
  overflow: hidden;
}
</style>
