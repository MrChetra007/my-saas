<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
    return
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role, restaurant_id')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    error.value = 'Profile not found. Please contact support.'
    loading.value = false
    return
  }

  // Redirect based on role
  if (profile.role === 'kitchen') {
    router.push('/app/kitchen')
  } else if (profile.role === 'cashier') {
    router.push('/app/orders')
  } else if (profile.role === 'waiter') {
    router.push('/app/orders')
  } else {
    router.push('/app/dashboard')
  }

  loading.value = false
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-xl font-semibold text-gray-800 mb-6">Welcome back</h2>

    <!-- Error message -->
    <div
      v-if="error"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
    >
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="you@restaurant.com"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <!-- Link to signup -->
    <p class="text-center text-sm text-gray-500 mt-6">
      Don't have an account?
      <RouterLink to="/signup" class="text-blue-600 hover:underline font-medium">
        Start free trial
      </RouterLink>
    </p>
  </AuthLayout>
</template>
