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
          <circle cx="12" cy="12" r="4" />
        </svg>
      </div>
      <span class="brand-name">RestoOS</span>
    </div>

    <!-- Heading -->
    <div class="heading">
      <h1>Create your account</h1>
      <p>14-day free trial &mdash; no credit card required</p>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="banner banner--error" role="alert">
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

    <!-- Success banner -->
    <div v-if="successMessage" class="banner banner--success" role="status">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {{ successMessage }}
    </div>

    <form @submit.prevent="handleSignup" class="form">
      <!-- Full Name + Restaurant Name: side by side on wider layouts -->
      <div class="field-row">
        <div class="field">
          <label for="fullName">Your name</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            required
            placeholder="John Doe"
            autocomplete="name"
          />
        </div>

        <div class="field">
          <label for="restaurantName">Restaurant name</label>
          <input
            id="restaurantName"
            v-model="restaurantName"
            type="text"
            required
            placeholder="Pizza Palace"
            autocomplete="organization"
          />
          <p v-if="restaurantName" class="field-hint">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            /order/{{ slugPreview }}/…
          </p>
        </div>
      </div>

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
        <label for="password">Password</label>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Min. 6 characters"
            autocomplete="new-password"
            :class="{ 'input--error': password && password.length < 6 }"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
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

        <!-- Password strength bar -->
        <div v-if="password" class="strength-row">
          <div class="strength-bar">
            <div
              class="strength-fill"
              :style="{ width: strengthPercent + '%' }"
              :class="strengthClass"
            />
          </div>
          <span class="strength-label" :class="strengthClass">{{ strengthLabel }}</span>
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="!loading">Start free trial</span>
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
          Creating account…
        </span>
      </button>
    </form>

    <!-- Divider -->
    <div class="divider"><span>or</span></div>

    <p class="signin-cta">
      Already have an account?
      <RouterLink to="/login">Sign in</RouterLink>
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
const showPassword = ref(false)

// ── Slug preview ────────────────────────────────────────────────────────────
const slugPreview = computed(() => generateBaseSlug(restaurantName.value))

function generateBaseSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function generateSlug(name) {
  const base = generateBaseSlug(name)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

// ── Password strength ───────────────────────────────────────────────────────
const strengthPercent = computed(() => {
  const p = password.value
  if (!p) return 0
  if (p.length < 6) return 20
  let score = 40
  if (p.length >= 8) score += 20
  if (/[A-Z]/.test(p)) score += 15
  if (/[0-9]/.test(p)) score += 15
  if (/[^A-Za-z0-9]/.test(p)) score += 10
  return Math.min(score, 100)
})

const strengthLabel = computed(() => {
  const s = strengthPercent.value
  if (s < 30) return 'Too short'
  if (s < 55) return 'Weak'
  if (s < 80) return 'Good'
  return 'Strong'
})

const strengthClass = computed(() => {
  const s = strengthPercent.value
  if (s < 30) return 'strength--danger'
  if (s < 55) return 'strength--warning'
  if (s < 80) return 'strength--ok'
  return 'strength--strong'
})

// ── Helpers ─────────────────────────────────────────────────────────────────
const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ])

// ── Submit ───────────────────────────────────────────────────────────────────
async function handleSignup() {
  error.value = ''
  successMessage.value = ''

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
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({ email: email.value, password: password.value }),
    )

    if (authError) {
      error.value = authError.message
      return
    }
    if (!authData.user) throw new Error('No user returned from Supabase.')

    if (!authData.session) {
      successMessage.value =
        'Account created! Please check your email to confirm your address, then sign in.'
      return
    }

    const { data: restaurantId, error: rpcError } = await withTimeout(
      supabase.rpc('create_restaurant_and_profile', {
        p_user_id: authData.user.id,
        p_full_name: fullName.value,
        p_email: email.value,
        p_restaurant_name: restaurantName.value,
        p_slug: generateSlug(restaurantName.value),
      }),
    )

    if (rpcError) {
      error.value =
        rpcError.message?.includes('duplicate') || rpcError.code === '23505'
          ? 'That restaurant name is already taken. Please try a slightly different one.'
          : `Setup error: ${rpcError.message}`
      return
    }

    console.log('Restaurant created, ID:', restaurantId)
    router.push('/onboarding')
  } catch (err) {
    error.value =
      err.message === 'Request timed out'
        ? 'The request timed out. Please check your connection and try again.'
        : err.message || 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Brand ── */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
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
  margin-bottom: 24px;
}
.heading h1 {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 6px;
}
.heading p {
  font-size: 13px;
  color: var(--text-secondary, #888);
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

/* ── Banners ── */
.banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: var(--radius, 10px);
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  line-height: 1.45;
}
.banner svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.banner--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger, #ef4444);
}
.banner--success {
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.2);
  color: var(--success, #4ade80);
}

/* ── Form ── */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Side-by-side pair ── */
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 440px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

/* ── Field ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #888);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.field input {
  width: 100%;
  padding: 10px 13px;
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
  color: var(--text-muted, #666);
}
.field input:hover {
  border-color: rgba(255, 255, 255, 0.12);
}
.field input:focus {
  border-color: var(--accent-30, rgba(200, 115, 58, 0.3));
  box-shadow: 0 0 0 3px var(--accent-10, rgba(200, 115, 58, 0.1));
}
.field input.input--error {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

/* ── Hint text below restaurant name ── */
.field-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-subtle, #555);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-variant-numeric: tabular-nums;
}

/* ── Password toggle ── */
.input-wrapper {
  position: relative;
}
.input-wrapper input {
  padding-right: 42px;
}
.toggle-password {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #666);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}
.toggle-password:hover {
  color: var(--text-secondary, #888);
}

/* ── Password strength ── */
.strength-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}
.strength-bar {
  flex: 1;
  height: 3px;
  background: var(--border-strong, #2a2a2a);
  border-radius: 999px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: 999px;
  transition:
    width 0.35s ease,
    background-color 0.35s ease;
}
.strength-label {
  font-size: 11px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-weight: 500;
  white-space: nowrap;
}

/* Strength tiers */
.strength--danger .strength-fill,
.strength-fill.strength--danger {
  background: var(--danger, #ef4444);
}
.strength--warning .strength-fill,
.strength-fill.strength--warning {
  background: var(--warning, #fbbf24);
}
.strength--ok .strength-fill,
.strength-fill.strength--ok {
  background: var(--info, #3b82f6);
}
.strength--strong .strength-fill,
.strength-fill.strength--strong {
  background: var(--success, #4ade80);
}

.strength--danger {
  color: var(--danger, #ef4444);
}
.strength--warning {
  color: var(--warning, #fbbf24);
}
.strength--ok {
  color: var(--info, #3b82f6);
}
.strength--strong {
  color: var(--success, #4ade80);
}

/* ── Submit ── */
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
  to {
    transform: rotate(360deg);
  }
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 18px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-strong, #2a2a2a);
}
.divider span {
  font-size: 11px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--text-subtle, #555);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Sign in CTA ── */
.signin-cta {
  text-align: center;
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--text-secondary, #888);
}
.signin-cta a {
  color: var(--accent, #c8733a);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.signin-cta a:hover {
  color: var(--accent-400, #db8a60);
}
</style>
