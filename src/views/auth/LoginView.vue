<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

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
    successMessage.value = t('auth.login.successMessage')
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
    error.value = t('auth.login.errorProfileNotFound')
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
  resetEmail.value = email.value
  resetSent.value = false
  resetError.value = ''
  showResetModal.value = true
}

function closeResetModal() {
  showResetModal.value = false
}

async function handleForgotPassword() {
  if (!resetEmail.value) {
    resetError.value = t('auth.forgotPassword.errorMissingEmail')
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
    <!-- Heading -->
    <div class="heading">
      <h1>{{ $t('auth.login.title') }}</h1>
      <p>{{ $t('auth.login.subtitle') }}</p>
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
        <label for="email">{{ $t('auth.login.emailLabel') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          :placeholder="$t('auth.login.emailPlaceholder')"
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="field">
        <div class="label-row">
          <label for="password">{{ $t('auth.login.passwordLabel') }}</label>
          <button type="button" class="forgot-link" @click="openResetModal">
            {{ $t('auth.login.forgotPasswordLink') }}
          </button>
        </div>
        <div class="input-wrapper">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            :placeholder="$t('auth.login.passwordPlaceholder')"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? $t('auth.login.hidePassword') : $t('auth.login.showPassword')"
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
      </div>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="loading">
        <span v-if="!loading">{{ $t('auth.login.submit') }}</span>
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
          {{ $t('auth.login.submitting') }}
        </span>
      </button>
    </form>

    <!-- Divider -->
    <div class="divider"><span>{{ $t('auth.login.divider') }}</span></div>

    <!-- Sign up CTA -->
    <p class="signup-cta">
      {{ $t('auth.login.signupCta') }}
      <RouterLink to="/signup">{{ $t('auth.login.signupLink') }}</RouterLink>
    </p>

    <!-- ── Forgot Password Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <!-- Close button -->
            <button class="modal-close" @click="closeResetModal" :aria-label="$t('auth.forgotPassword.close')">
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
              <h2 id="modal-title">{{ $t('auth.forgotPassword.title') }}</h2>
              <p>{{ $t('auth.forgotPassword.subtitle') }}</p>
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
              {{ $t('auth.forgotPassword.success') }}
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
                <label for="reset-email">{{ $t('auth.forgotPassword.emailLabel') }}</label>
                <input
                  id="reset-email"
                  v-model="resetEmail"
                  type="email"
                  :placeholder="$t('auth.forgotPassword.emailPlaceholder')"
                  autocomplete="email"
                  @keyup.enter="handleForgotPassword"
                />
              </div>

              <button class="submit-btn" :disabled="resetLoading" @click="handleForgotPassword">
                <span v-if="!resetLoading">{{ $t('auth.forgotPassword.submit') }}</span>
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
                  {{ $t('auth.forgotPassword.submitting') }}
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
              {{ $t('auth.forgotPassword.backLink') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AuthLayout>
</template>

<style scoped>
/* ── Heading ── */
.heading {
  margin-bottom: 28px;
}
.heading h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 6px;
}
.heading p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-muted);
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
  border-radius: var(--radius-card);
  color: #ef4444;
  font-size: 13px;
  font-family: var(--font-body);
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
  background: rgba(74, 222, 128, 0.08);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: var(--radius-card);
  color: var(--color-status-success);
  font-size: 13px;
  font-family: var(--font-body);
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
  color: var(--color-text-secondary);
  font-family: var(--font-body);
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
  font-family: var(--font-body);
  color: var(--color-accent);
  cursor: pointer;
  transition: color 0.15s;
}
.forgot-link:hover {
  color: var(--color-accent-hover);
}

.field input {
  width: 100%;
  padding: 11px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-card);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  -webkit-appearance: none;
  box-sizing: border-box;
}
.field input::placeholder {
  color: var(--color-text-faint);
}
.field input:hover {
  border-color: var(--color-border-bright);
}
.field input:focus {
  border-color: var(--color-accent-border);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
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
  color: var(--color-text-faint);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;
}
.toggle-password:hover {
  color: var(--color-text-muted);
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-card);
  font-family: var(--font-body);
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
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}
.submit-btn:active:not(:disabled) {
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
  background: var(--color-border-subtle);
}
.divider span {
  font-size: 12px;
  font-family: var(--font-body);
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Sign up CTA ── */
.signup-cta {
  text-align: center;
  font-size: 13px;
  font-family: var(--font-body);
  color: var(--color-text-muted);
}
.signup-cta a {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.signup-cta a:hover {
  color: var(--color-accent-hover);
}

/* ── Modal ── */
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
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-panel);
  padding: 32px 28px 28px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}
.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  color: var(--color-text-faint);
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
  color: var(--color-text-muted);
}
.modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}
.modal-heading h2 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.modal-heading p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.modal .error-banner,
.modal .success-banner {
  margin-bottom: 0;
}
.modal .submit-btn {
  margin-top: 0;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s;
  padding: 4px 0 0;
}
.back-link:hover {
  color: var(--color-text-primary);
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
