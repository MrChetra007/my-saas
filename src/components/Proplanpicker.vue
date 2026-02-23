<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-pro-picker">
          <!-- ── Header ── -->
          <div class="picker-header">
            <div class="header-glow" />
            <button class="picker-close" @click="close">
              <X :size="16" />
            </button>
            <div class="header-icon">
              <Crown :size="22" />
            </div>
            <h2 class="picker-title">Upgrade to Pro</h2>
            <p class="picker-subtitle">
              <strong>{{ featureName }}</strong> is a Pro feature. Unlock it and everything else
              below with one upgrade.
            </p>
          </div>

          <!-- ── Features ── -->
          <div class="picker-body">
            <ul class="feature-list">
              <li v-for="f in proFeatures" :key="f.label" class="feature-item">
                <div class="feature-icon-wrap">
                  <component :is="f.icon" :size="15" />
                </div>
                <div>
                  <div class="feature-label">{{ f.label }}</div>
                  <div class="feature-desc">{{ f.desc }}</div>
                </div>
              </li>
            </ul>

            <!-- Price -->
            <div class="price-row">
              <div class="price-amount">
                <span class="price-dollar">$</span>69<span class="price-mo">/mo</span>
              </div>
              <div class="price-note">Cancel anytime · No hidden fees</div>
            </div>

            <!-- Error -->
            <div v-if="error" class="alert-error"><AlertCircle :size="14" /> {{ error }}</div>

            <!-- Actions -->
            <button class="btn-upgrade" @click="goToCheckout" :disabled="loading">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <template v-else> <Zap :size="15" /> Upgrade to Pro </template>
            </button>
            <button class="btn-cancel" @click="close">Maybe later</button>

            <p class="secure-note"><Lock :size="11" /> Secured by Lemon Squeezy</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  X,
  Crown,
  Zap,
  Lock,
  Loader2,
  AlertCircle,
  Activity,
  Tag,
  Users,
  BarChart2,
  Infinity,
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /**
   * Name of the feature they tried to access, e.g. "Analytics" or "Promotions".
   * Shown in the subtitle so the modal feels contextual.
   */
  featureName: { type: String, default: 'This feature' },
})

const emit = defineEmits(['update:modelValue', 'checkout-error'])

const loading = ref(false)
const error = ref('')

const proFeatures = [
  { icon: Activity, label: 'Analytics & Charts', desc: 'Revenue trends, top items, peak hours.' },
  { icon: Tag, label: 'Promotions & Discounts', desc: 'Create deals and coupon codes.' },
  { icon: Infinity, label: 'Unlimited Tables', desc: 'No cap on tables or QR codes.' },
  { icon: Users, label: 'Up to 10 Staff Accounts', desc: 'Give your whole team access.' },
  { icon: BarChart2, label: 'All Staff Role Views', desc: 'Kitchen, cashier, and manager views.' },
]

function close() {
  emit('update:modelValue', false)
}

async function goToCheckout() {
  error.value = ''
  loading.value = true
  try {
    const { data, err } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan: 'pro' },
    })
    if (err) throw err
    if (data?.url) {
      window.location.href = data.url
      // loading stays true — page is navigating away
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (e) {
    console.error('[ProPlanPicker] Checkout error:', e)
    error.value = 'Could not start checkout. Please try again or contact support.'
    emit('checkout-error', error.value)
    loading.value = false
  }
}
</script>

<style scoped>
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

/* ── Modal ── */
.modal-pro-picker {
  background: var(--color-bg-surface);
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border-subtle);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* ── Header ── */
.picker-header {
  position: relative;
  padding: 32px 24px 24px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
}
.header-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(200, 115, 58, 0.18) 0%, transparent 70%);
  pointer-events: none;
}
.picker-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.14s;
  z-index: 1;
}
.picker-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
}
.header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
  position: relative;
  z-index: 1;
}
.picker-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  position: relative;
  z-index: 1;
}
.picker-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  position: relative;
  z-index: 1;
}
.picker-subtitle strong {
  color: var(--color-accent);
}

/* ── Body ── */
.picker-body {
  padding: 22px 24px 26px;
}

/* ── Feature list ── */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.feature-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.feature-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}
.feature-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* ── Price ── */
.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  margin-bottom: 16px;
}
.price-amount {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  color: var(--color-accent);
  letter-spacing: -1px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  gap: 1px;
}
.price-dollar {
  font-size: 16px;
  font-weight: 700;
  margin-top: 5px;
}
.price-mo {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  margin-bottom: 3px;
}
.price-note {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

/* ── Error ── */
.alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* ── Buttons ── */
.btn-upgrade {
  width: 100%;
  padding: 13px;
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
  margin-bottom: 10px;
}
.btn-upgrade:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}
.btn-upgrade:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.btn-cancel {
  width: 100%;
  padding: 11px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-pill);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.14s;
  margin-bottom: 14px;
}
.btn-cancel:hover {
  border-color: var(--color-accent-border);
  color: var(--color-text-secondary);
}

/* ── Secure note ── */
.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.secure-note svg {
  color: var(--color-accent);
}

/* ── Transition ── */
.modal-enter-active {
  transition: opacity 0.2s;
}
.modal-leave-active {
  transition: opacity 0.18s;
}
.modal-enter-active .modal-pro-picker {
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s;
}
.modal-leave-active .modal-pro-picker {
  transition:
    transform 0.18s ease-in,
    opacity 0.18s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-pro-picker {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}
.modal-leave-to .modal-pro-picker {
  transform: scale(0.97);
  opacity: 0;
}
</style>
