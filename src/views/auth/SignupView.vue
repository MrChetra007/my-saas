<template>
  <AuthLayout>
    <h2 class="text-xl font-semibold text-gray-800 mb-1">Create your account</h2>
    <p class="text-sm text-gray-500 mb-6">14-day free trial, no credit card required</p>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
    >
      {{ error }}
    </div>

    <!-- Success -->
    <div
      v-if="successMessage"
      class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
    >
      {{ successMessage }}
    </div>

    <form @submit.prevent="handleSignup" class="space-y-4">
      <!-- Full Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
        <input
          v-model="fullName"
          type="text"
          required
          placeholder="John Doe"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Restaurant Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
        <input
          v-model="restaurantName"
          type="text"
          required
          placeholder="Pizza Palace"
          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p v-if="restaurantName" class="text-xs text-gray-400 mt-1">
          Your URL: /order/{{ slugPreview }}/...
        </p>
      </div>

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
          placeholder="Min. 6 characters"
          class="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="password && password.length < 6 ? 'border-red-300' : 'border-gray-300'"
        />
        <p v-if="password && password.length < 6" class="text-xs text-red-500 mt-1">
          Password must be at least 6 characters
        </p>
        <p v-else-if="password && password.length >= 6" class="text-xs text-green-500 mt-1">
          ✓ Password meets requirements
        </p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {{ loading ? 'Creating account...' : 'Start free trial' }}
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-6">
      Already have an account?
      <RouterLink to="/login" class="text-blue-600 hover:underline font-medium">
        Sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()

const fullName = ref('')
const restaurantName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Slug preview shown to user (no suffix — just for display)
const slugPreview = computed(() => generateBaseSlug(restaurantName.value))

function generateBaseSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Actual slug used on creation — includes short random suffix to avoid collisions
function generateSlug(name) {
  const base = generateBaseSlug(name)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ])

async function handleSignup() {
  error.value = ''
  successMessage.value = ''

  // Client-side validation
  if (!fullName.value || !restaurantName.value || !email.value || !password.value) {
    error.value = 'Please fill in all fields.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  loading.value = true

  try {
    // ── Step 1: Sign up with Supabase Auth ──────────────────────────────────
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({ email: email.value, password: password.value }),
    )

    if (authError) {
      error.value = authError.message
      return
    }

    if (!authData.user) {
      throw new Error('No user returned from Supabase.')
    }

    // Email confirmation required — no session yet, can't proceed further
    if (!authData.session) {
      successMessage.value =
        'Account created! Please check your email to confirm your address, then sign in.'
      return
    }

    // ── Step 2: Create restaurant + user profile via secure RPC ─────────────
    // Uses a security definer function to bypass RLS during initial setup.
    const { data: restaurantId, error: rpcError } = await withTimeout(
      supabase.rpc('create_restaurant_and_profile', {
        p_user_id: authData.user.id,
        p_full_name: fullName.value,
        p_restaurant_name: restaurantName.value,
        p_slug: generateSlug(restaurantName.value),
      }),
    )

    if (rpcError) {
      // Surface a friendly message for the most common failure (duplicate slug)
      if (rpcError.message?.includes('duplicate') || rpcError.code === '23505') {
        error.value = 'That restaurant name is already taken. Please try a slightly different one.'
      } else {
        error.value = `Setup error: ${rpcError.message}`
      }
      return
    }

    console.log('Restaurant created, ID:', restaurantId)

    // ── Step 3: Redirect to onboarding ──────────────────────────────────────
    router.push('/onboarding')
  } catch (err) {
    if (err.message === 'Request timed out') {
      error.value = 'The request timed out. Please check your connection and try again.'
    } else {
      error.value = err.message || 'An unexpected error occurred.'
    }
  } finally {
    loading.value = false
  }
}
</script>
