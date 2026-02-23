<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-plan-picker">
          <!-- ── Header ───────────────────────────────── -->
          <div class="picker-header">
            <div class="picker-header-left">
              <div class="picker-logo">
                <Zap :size="16" />
              </div>
              <div>
                <h2 class="picker-title">Choose Your Plan</h2>
                <p class="picker-subtitle">Secure checkout via Lemon Squeezy · Cancel anytime</p>
              </div>
            </div>
            <button class="picker-close" @click="close">
              <X :size="16" />
            </button>
          </div>

          <!-- ── Body ─────────────────────────────────── -->
          <div class="picker-body">
            <div class="plan-options">
              <!-- Starter -->
              <div
                class="plan-option"
                :class="{ selected: selectedPlan === 'starter' }"
                @click="selectedPlan = 'starter'"
              >
                <div class="option-top">
                  <div class="option-name">Starter</div>
                  <div class="option-price">
                    <span class="price-dollar">$</span>29<span class="price-mo">/mo</span>
                  </div>
                  <p class="option-tagline">Perfect for small restaurants getting started.</p>
                </div>

                <ul class="option-features">
                  <li><Check :size="13" /> Up to 15 tables</li>
                  <li><Check :size="13" /> Up to 3 staff accounts</li>
                  <li><Check :size="13" /> Unlimited orders</li>
                  <li><Check :size="13" /> QR code ordering</li>
                  <li><Check :size="13" /> Kitchen & cashier views</li>
                  <li><Check :size="13" /> Menu management</li>
                </ul>

                <div class="option-select-indicator">
                  <div class="radio-ring" :class="{ checked: selectedPlan === 'starter' }">
                    <div v-if="selectedPlan === 'starter'" class="radio-dot" />
                  </div>
                  <span>{{ selectedPlan === 'starter' ? 'Selected' : 'Select Starter' }}</span>
                </div>
              </div>

              <!-- Pro -->
              <div
                class="plan-option plan-option-pro"
                :class="{ selected: selectedPlan === 'pro' }"
                @click="selectedPlan = 'pro'"
              >
                <div class="pro-badge"><Star :size="10" /> Recommended</div>

                <div class="option-top">
                  <div class="option-name option-name-pro">Pro</div>
                  <div class="option-price option-price-pro">
                    <span class="price-dollar">$</span>69<span class="price-mo">/mo</span>
                  </div>
                  <p class="option-tagline">
                    For restaurants running their full operation digitally.
                  </p>
                </div>

                <ul class="option-features">
                  <li><Check :size="13" /> Unlimited tables</li>
                  <li><Check :size="13" /> Up to 10 staff accounts</li>
                  <li><Check :size="13" /> Unlimited orders</li>
                  <li><Check :size="13" /> QR code ordering</li>
                  <li><Check :size="13" /> All staff role views</li>
                  <li><Check :size="13" /> Menu management</li>
                  <li><Check :size="13" /> Analytics & charts</li>
                  <li><Check :size="13" /> Promotions & discounts</li>
                </ul>

                <div class="option-select-indicator option-select-pro">
                  <div
                    class="radio-ring radio-ring-pro"
                    :class="{ checked: selectedPlan === 'pro' }"
                  >
                    <div v-if="selectedPlan === 'pro'" class="radio-dot" />
                  </div>
                  <span>{{ selectedPlan === 'pro' ? 'Selected' : 'Select Pro' }}</span>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="billingError" class="alert error">
              <AlertCircle :size="14" /> {{ billingError }}
            </div>

            <!-- CTA -->
            <button class="btn-checkout" @click="goToCheckout" :disabled="!selectedPlan || loading">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <template v-else>
                Continue to Checkout
                <ArrowRight :size="16" />
              </template>
            </button>

            <p class="secure-note">
              <Lock :size="12" /> Payments secured by Lemon Squeezy · Cancel anytime · No hidden
              fees
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { Zap, X, Star, Check, ArrowRight, Lock, Loader2, AlertCircle } from 'lucide-vue-next'

// ── Props & emits ──────────────────────────────────
const props = defineProps({
  /**
   * Controls modal visibility — use with v-model:
   *   <PlanPicker v-model="showPlanPicker" />
   */
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue', // v-model support
  'checkout-started', // fired when redirect begins (parent can react if needed)
  'checkout-error', // fired on failure, payload: error message string
])

// ── Local state ────────────────────────────────────
const selectedPlan = ref('pro')
const loading = ref(false)
const billingError = ref('')

// ── Helpers ────────────────────────────────────────
function close() {
  emit('update:modelValue', false)
}

// ── Checkout ───────────────────────────────────────
async function goToCheckout() {
  if (!selectedPlan.value || loading.value) return

  billingError.value = ''
  loading.value = true

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan: selectedPlan.value },
    })

    if (error) throw error

    if (data?.url) {
      emit('checkout-started', selectedPlan.value)
      window.location.href = data.url
      // Note: loading stays true intentionally — the page is navigating away.
      // If the redirect somehow fails, the user is still on the page and the
      // finally block below will reset loading.
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (err) {
    console.error('[PlanPicker] Checkout error:', err)
    billingError.value = 'Could not start checkout. Please try again or contact support.'
    emit('checkout-error', billingError.value)
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Spin ── */
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* ── Modal shell ── */
.modal-plan-picker {
  background: var(--color-bg-surface);
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* ── Header ── */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 28px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}
.picker-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.picker-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.picker-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--color-text-primary);
}
.picker-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
}
.picker-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.14s;
  flex-shrink: 0;
}
.picker-close:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

/* ── Body ── */
.picker-body {
  padding: 24px 28px 28px;
}

/* ── Plan options ── */
.plan-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

.plan-option {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-subtle);
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.plan-option:hover {
  border-color: var(--color-accent-border);
  transform: translateY(-2px);
}
.plan-option.selected {
  border-color: var(--color-accent);
}

.plan-option-pro {
  border-color: rgba(200, 115, 58, 0.3);
  background: rgba(200, 115, 58, 0.04);
}
.plan-option-pro.selected {
  border-color: var(--color-accent);
}

/* ── Pro badge ── */
.pro-badge {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.04em;
}

/* ── Option top ── */
.option-top {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.option-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.option-name-pro {
  color: var(--color-accent);
}
.option-price {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -1.5px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
}
.option-price-pro {
  color: var(--color-accent);
}
.price-dollar {
  font-size: 18px;
  font-weight: 700;
  margin-top: 6px;
}
.price-mo {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  margin-bottom: 4px;
  margin-left: 2px;
}
.option-tagline {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}

/* ── Features ── */
.option-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}
.option-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.option-features li svg {
  color: var(--color-accent);
  flex-shrink: 0;
}

/* ── Select indicator ── */
.option-select-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding-top: 14px;
  border-top: 1px solid var(--color-border-subtle);
}
.option-select-pro {
  color: var(--color-accent);
}
.radio-ring {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--color-border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.14s;
  flex-shrink: 0;
}
.radio-ring.checked,
.radio-ring-pro.checked {
  border-color: var(--color-accent);
}
.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
}

/* ── Alert ── */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.alert.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* ── Checkout button ── */
.btn-checkout {
  width: 100%;
  padding: 14px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: -0.1px;
}
.btn-checkout:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.btn-checkout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ── Secure note ── */
.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  margin-top: 12px;
}
.secure-note svg {
  color: var(--color-accent);
  flex-shrink: 0;
}

/* ── Modal transition ── */
.modal-enter-active {
  transition: opacity 0.2s;
}
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-active .modal-plan-picker {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s;
}
.modal-leave-active .modal-plan-picker {
  transition:
    transform 0.18s ease-in,
    opacity 0.18s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-plan-picker {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}
.modal-leave-to .modal-plan-picker {
  transform: scale(0.97);
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .plan-options {
    grid-template-columns: 1fr;
  }
  .picker-header {
    padding: 18px 20px;
  }
  .picker-body {
    padding: 20px;
  }
}
</style>
