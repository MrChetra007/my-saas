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
const showPassword = ref(false)

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
    <!-- Brand mark -->
    <div class="brand">
      <div class="brand-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" />
        </svg>
      </div>
      <span class="brand-name">RestoOS</span>
    </div>

    <!-- Heading -->
    <div class="heading">
      <h1>Welcome back</h1>
      <p>Sign in to continue to your dashboard</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner" role="alert">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin" class="form">
      <!-- Email -->
      <div class="field">
        <label for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="you@restaurant.com"
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="field">
        <div class="label-row">
          <label for="password">Password</label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <!-- Eye open -->
            <svg
              v-if="!showPassword"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <!-- Eye closed -->
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
              />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="!loading">Sign in</span>
        <span v-else class="loading-state">
          <svg
            class="spinner"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            />
          </svg>
          Signing in…
        </span>
      </button>
    </form>

    <!-- Divider -->
    <div class="divider"><span>or</span></div>

    <!-- Sign up CTA -->
    <p class="signup-cta">
      Don't have an account?
      <RouterLink to="/signup">Start free trial</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
/* ── Brand ── */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent-20, rgba(200, 115, 58, 0.2));
  border: 1px solid var(--accent-30, rgba(200, 115, 58, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #c8733a);
}

.brand-name {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #f0ece5);
  letter-spacing: -0.01em;
}

/* ── Heading ── */
.heading {
  margin-bottom: 28px;
}

.heading h1 {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 6px;
}

.heading p {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 14px;
  color: var(--text-secondary, #888888);
  line-height: 1.5;
}

/* ── Error banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius, 10px);
  color: var(--danger, #ef4444);
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  line-height: 1.4;
}

.error-banner svg {
  flex-shrink: 0;
}

/* ── Form ── */
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Field ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #888888);
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forgot-link {
  font-size: 12px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--accent, #c8733a);
  text-decoration: none;
  transition: color 0.15s;
}
.forgot-link:hover {
  color: var(--accent-400, #db8a60);
}

.field input {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-card, #1e1e1e);
  border: 1px solid var(--border-strong, #2a2a2a);
  border-radius: var(--radius, 10px);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 14px;
  color: var(--text-primary, #f0ece5);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  -webkit-appearance: none;
}

.field input::placeholder {
  color: var(--text-muted, #666666);
}

.field input:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.field input:focus {
  border-color: var(--accent-30, rgba(200, 115, 58, 0.3));
  box-shadow: 0 0 0 3px var(--accent-10, rgba(200, 115, 58, 0.1));
}

/* ── Password input with toggle ── */
.input-wrapper {
  position: relative;
}

.input-wrapper input {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #666666);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}
.toggle-password:hover {
  color: var(--text-secondary, #888888);
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent, #c8733a);
  border: none;
  border-radius: var(--radius, 10px);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s,
    transform 0.1s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-400, #db8a60);
  box-shadow: var(--shadow-glow, 0 0 20px rgba(200, 115, 58, 0.3));
}

.submit-btn:active:not(:disabled) {
  background: var(--accent-600, #b05d2e);
  transform: scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Loading spinner ── */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-strong, #2a2a2a);
}

.divider span {
  font-size: 12px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--text-subtle, #555555);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Sign up CTA ── */
.signup-cta {
  text-align: center;
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--text-secondary, #888888);
}

.signup-cta a {
  color: var(--accent, #c8733a);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.signup-cta a:hover {
  color: var(--accent-400, #db8a60);
}
</style>
