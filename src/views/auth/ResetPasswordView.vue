<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()

// ── State ──
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const error = ref('')
const status = ref('waiting') // 'waiting' | 'ready' | 'invalid'

let authListener = null

// ── On mount: PKCE flow — Supabase auto-exchanges ?code= from the URL ──
onMounted(async () => {
  // Check for error in URL first
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.slice(1))

  if (params.get('error') || hashParams.get('error')) {
    status.value = 'invalid'
    return
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      status.value = 'ready'
      return
    }

    // Fallback listener in case getSession() resolves before Supabase
    // has finished exchanging the code (rare race condition)
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        status.value = 'ready'
      }
    })
    authListener = data

    // Safety timeout — if nothing fires, link is broken/expired
    setTimeout(() => {
      if (status.value === 'waiting') status.value = 'invalid'
    }, 4000)
  } catch (err) {
    status.value = 'invalid'
  }
})

onUnmounted(() => {
  authListener?.subscription?.unsubscribe()
})

// ── Password strength ──
function scorePassword(p) {
  let score = 0
  if (!p) return 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
}

const strength = computed(() => scorePassword(password.value))

const strengthClass = computed(() => {
  if (!password.value) return ''
  if (strength.value <= 1) return 'weak'
  if (strength.value <= 3) return 'fair'
  return 'strong'
})

const strengthWidth = computed(() => {
  if (!password.value) return '0%'
  return `${(strength.value / 5) * 100}%`
})

const strengthLabel = computed(() => {
  if (!password.value) return ''
  if (strength.value <= 1) return 'Weak'
  if (strength.value <= 3) return 'Fair'
  return 'Strong'
})

// ── Handle reset submit ──
async function handleReset() {
  error.value = ''

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true

  const { error: updateError } = await supabase.auth.updateUser({
    password: password.value,
  })

  if (updateError) {
    error.value = updateError.message
    loading.value = false
    return
  }

  await supabase.auth.signOut()
  router.push('/login?reset=success')
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

    <!-- ── Waiting: parsing token ── -->
    <div v-if="status === 'waiting'" class="status-block">
      <div class="status-icon spinner-wrap">
        <svg
          class="spinner"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          />
        </svg>
      </div>
      <h1>Verifying link…</h1>
      <p>Please wait while we verify your reset link.</p>
    </div>

    <!-- ── Invalid / expired link ── -->
    <div v-else-if="status === 'invalid'" class="status-block">
      <div class="status-icon status-icon--error">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>Link expired</h1>
      <p>This password reset link is invalid or has expired. Please request a new one.</p>
      <RouterLink to="/login" class="submit-btn" style="text-decoration: none; text-align: center">
        Back to sign in
      </RouterLink>
    </div>

    <!-- ── Ready: show the form ── -->
    <template v-else>
      <div class="heading">
        <div class="lock-icon">
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
        <h1>Set new password</h1>
        <p>Choose a strong password for your account.</p>
      </div>

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

      <form @submit.prevent="handleReset" class="form">
        <!-- New password -->
        <div class="field">
          <label for="password">New password</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Min. 8 characters"
              autocomplete="new-password"
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
          <!-- Strength indicator -->
          <div class="strength-bar">
            <div class="strength-fill" :class="strengthClass" :style="{ width: strengthWidth }" />
          </div>
          <span v-if="password" class="strength-label" :class="strengthClass">{{
            strengthLabel
          }}</span>
        </div>

        <!-- Confirm password -->
        <div class="field">
          <label for="confirm">Confirm password</label>
          <div class="input-wrapper">
            <input
              id="confirm"
              v-model="confirm"
              :type="showConfirm ? 'text' : 'password'"
              required
              placeholder="••••••••"
              autocomplete="new-password"
              :class="{ 'input-mismatch': confirm && confirm !== password }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirm = !showConfirm"
              :aria-label="showConfirm ? 'Hide password' : 'Show password'"
            >
              <svg
                v-if="!showConfirm"
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
          <span v-if="confirm && confirm !== password" class="mismatch-hint">
            Passwords don't match yet
          </span>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">Update password</span>
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
            Updating…
          </span>
        </button>
      </form>

      <p class="back-cta">
        <RouterLink to="/login">← Back to sign in</RouterLink>
      </p>
    </template>
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

/* ── Status block (waiting / invalid) ── */
.status-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.status-block h1 {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #f0ece5);
  letter-spacing: -0.02em;
}

.status-block p {
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-size: 14px;
  color: var(--text-secondary, #888);
  line-height: 1.5;
  margin-bottom: 8px;
}

.status-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.spinner-wrap {
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.3);
  color: var(--accent, #c8733a);
}

.status-icon--error {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
}

/* ── Heading ── */
.heading {
  margin-bottom: 28px;
}

.lock-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(200, 115, 58, 0.15);
  border: 1px solid rgba(200, 115, 58, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent, #c8733a);
  margin-bottom: 16px;
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
  color: #ef4444;
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
  color: var(--text-secondary, #888);
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

.field input {
  width: 100%;
  padding: 11px 44px 11px 14px;
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
  color: var(--text-muted, #666);
}
.field input:hover {
  border-color: rgba(255, 255, 255, 0.12);
}
.field input:focus {
  border-color: rgba(200, 115, 58, 0.3);
  box-shadow: 0 0 0 3px rgba(200, 115, 58, 0.1);
}

.input-mismatch {
  border-color: rgba(239, 68, 68, 0.4) !important;
}

.mismatch-hint {
  font-size: 12px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  color: #ef4444;
  opacity: 0.8;
}

/* ── Input wrapper / toggle ── */
.input-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
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

/* ── Strength bar ── */
.strength-bar {
  height: 3px;
  background: var(--border-strong, #2a2a2a);
  border-radius: 99px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 99px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.strength-fill.weak {
  background: #ef4444;
}
.strength-fill.fair {
  background: #f59e0b;
}
.strength-fill.strong {
  background: #22c55e;
}

.strength-label {
  font-size: 11px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.strength-label.weak {
  color: #ef4444;
}
.strength-label.fair {
  color: #f59e0b;
}
.strength-label.strong {
  color: #22c55e;
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
  display: block;
  transition:
    background 0.15s,
    box-shadow 0.15s,
    transform 0.1s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-400, #db8a60);
  box-shadow: 0 0 20px rgba(200, 115, 58, 0.3);
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

/* ── Back link ── */
.back-cta {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  font-family: var(--font-body, 'DM Sans', sans-serif);
}

.back-cta a {
  color: var(--text-secondary, #888);
  text-decoration: none;
  transition: color 0.15s;
}

.back-cta a:hover {
  color: var(--text-primary, #f0ece5);
}
</style>
