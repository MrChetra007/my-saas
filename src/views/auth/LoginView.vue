<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const route = useRoute()

// ── Login state ──
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const successMessage = ref('')

// ── Forgot password state ──
const showResetModal = ref(false)
const resetEmail = ref('')
const resetSent = ref(false)
const resetLoading = ref(false)
const resetError = ref('')

onMounted(() => {
  if (route.query.reset === 'success') {
    successMessage.value = 'Password updated successfully. Please sign in.'
  }
})

// ── Handlers ──
async function handleLogin() {
  loading.value = true
  error.value = ''
  successMessage.value = ''

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
  } else if (profile.role === 'cashier' || profile.role === 'waiter') {
    router.push('/app/orders')
  } else {
    router.push('/app/dashboard')
  }

  loading.value = false
}

function openResetModal() {
  resetEmail.value = email.value // pre-fill with whatever they typed
  resetSent.value = false
  resetError.value = ''
  showResetModal.value = true
}

function closeResetModal() {
  showResetModal.value = false
}

async function handleForgotPassword() {
  if (!resetEmail.value) {
    resetError.value = 'Please enter your email address.'
    return
  }
  resetLoading.value = true
  resetError.value = ''

  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.value, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (resetErr) {
    resetError.value = resetErr.message
  } else {
    resetSent.value = true
  }

  resetLoading.value = false
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

    <!-- Success message (after password reset) -->
    <div v-if="successMessage" class="success-banner" role="status">
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
          <button type="button" class="forgot-link" @click="openResetModal">
            Forgot password?
          </button>
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

    <!-- ── Forgot Password Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <!-- Close button -->
            <button class="modal-close" @click="closeResetModal" aria-label="Close">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <!-- Icon -->
            <div class="modal-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div class="modal-heading">
              <h2 id="modal-title">Reset your password</h2>
              <p>Enter your account email and we'll send you a secure reset link.</p>
            </div>

            <!-- Success state -->
            <div v-if="resetSent" class="success-banner">
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
              Check your inbox — a reset link is on its way.
            </div>

            <!-- Form state -->
            <template v-else>
              <div v-if="resetError" class="error-banner">
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
                {{ resetError }}
              </div>

              <div class="field">
                <label for="reset-email">Email address</label>
                <input
                  id="reset-email"
                  v-model="resetEmail"
                  type="email"
                  placeholder="you@restaurant.com"
                  autocomplete="email"
                  @keyup.enter="handleForgotPassword"
                />
              </div>

              <button class="submit-btn" :disabled="resetLoading" @click="handleForgotPassword">
                <span v-if="!resetLoading">Send reset link</span>
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
                  Sending…
                </span>
              </button>
            </template>

            <!-- Back to login -->
            <button class="back-link" @click="closeResetModal">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to sign in
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
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

/* ── Banners ── */
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

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 14px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: var(--radius, 10px);
  color: #22c55e;
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  line-height: 1.4;
}

.success-banner svg {
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
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: var(--accent, #c8733a);
  cursor: pointer;
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
  box-sizing: border-box;
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

/* ════════════════════════════════════════
   Forgot Password Modal
   ════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  position: relative;
  background: var(--bg-card, #1e1e1e);
  border: 1px solid var(--border-strong, #2a2a2a);
  border-radius: 14px;
  padding: 32px 28px 28px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

/* Close button */
.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-strong, #2a2a2a);
  border-radius: 6px;
  color: var(--text-muted, #666);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary, #888);
}

/* Icon */
.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent-20, rgba(200, 115, 58, 0.15));
  border: 1px solid var(--accent-30, rgba(200, 115, 58, 0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #c8733a);
}

/* Heading */
.modal-heading h2 {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.modal-heading p {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 13px;
  color: var(--text-secondary, #888);
  line-height: 1.5;
}

/* Override margin inside modal */
.modal .error-banner,
.modal .success-banner {
  margin-bottom: 0;
}

.modal .submit-btn {
  margin-top: 0;
}

/* Back link */
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s;
  padding: 4px 0 0;
}
.back-link:hover {
  color: var(--text-primary, #f0ece5);
}

/* ── Modal transition ── */
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal {
  animation: modal-slide-in 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.modal-leave-active .modal {
  animation: modal-slide-out 0.15s ease both;
}

@keyframes modal-slide-in {
  from {
    transform: translateY(12px) scale(0.97);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
@keyframes modal-slide-out {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(8px) scale(0.97);
    opacity: 0;
  }
}
</style>
