<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { setAuthReady } from '@/router'
import InstallPwaBanner from '@/components/InstallPwaBanner.vue'
import UpdatePwaBanner from '@/components/UpdatePwaBanner.vue'

const authStore = useAuthStore()

// Register the init promise BEFORE awaiting it so the router guard
// can await the same promise during the very first navigation.
// Without this, the guard runs with authStore.user = null and lets
// an already-logged-in user through to the landing page.
const initPromise = authStore.init()
setAuthReady(initPromise)

onMounted(async () => {
  await initPromise
})
</script>

<template>
  <RouterView />
  <InstallPwaBanner />
  <UpdatePwaBanner />
</template>
