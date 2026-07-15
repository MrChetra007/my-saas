<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-plan-picker">
          <!-- ── Header ───────────────────────────────── -->
          <div class="picker-header">
            <div class="picker-header-left">
              <div class="picker-logo">
                <Zap :size="18" />
              </div>
              <div>
                <h2 class="picker-title">{{ $t('settings.choosePlan') }}</h2>
                <p class="picker-subtitle">{{ $t('plans.secureCheckout') }}</p>
              </div>
            </div>
            <button class="picker-close" @click="close">
              <X :size="20" />
            </button>
          </div>

          <!-- ── Body (scrollable) ─────────────────────── -->
          <div class="picker-body">
            <div class="plan-options">
              <!-- Starter -->
              <div
                class="plan-option"
                :class="{ selected: selectedPlan === 'starter' }"
                @click="selectedPlan = 'starter'"
              >
                <div class="option-top">
                  <div class="option-name">{{ $t('plans.starter') }}</div>
                  <div class="option-price">
                    <span class="price-dollar">$</span>{{ starterPrice }}<span class="price-mo">/mo</span>
                  </div>
                </div>

                <p class="option-tagline">{{ $t('trialWall.starterTagline') }}</p>

                <ul class="option-features">
                  <li><Check :size="14" /> {{ $t('trialWall.feature.upTo15Tables') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.upTo3Staff') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.unlimitedOrders') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.qrOrdering') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.allStaffViews') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.menuManagement') }}</li>
                </ul>

                <div class="option-select-indicator">
                  <div class="radio-ring" :class="{ checked: selectedPlan === 'starter' }">
                    <div v-if="selectedPlan === 'starter'" class="radio-dot" />
                  </div>
                  <span>{{ selectedPlan === 'starter' ? $t('plans.selected') : $t('plans.selectStarter') }}</span>
                </div>
              </div>

              <!-- Pro -->
              <div
                class="plan-option plan-option-pro"
                :class="{ selected: selectedPlan === 'pro' }"
                @click="selectedPlan = 'pro'"
              >
                <div class="pro-badge"><Star :size="12" /> {{ $t('trialWall.proBadge') }}</div>

                <div class="option-top">
                  <div class="option-name option-name-pro">{{ $t('plans.pro') }}</div>
                  <div class="option-price option-price-pro">
                    <span class="price-dollar">$</span>{{ proPrice }}<span class="price-mo">/mo</span>
                  </div>
                </div>

                <p class="option-tagline">
                  {{ $t('trialWall.proTagline') }}
                </p>

                <ul class="option-features">
                  <li><Check :size="14" /> {{ $t('trialWall.feature.unlimitedTables') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.upTo10Staff') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.unlimitedOrders') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.qrOrdering') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.allStaffViews') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.menuManagement') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.analytics') }}</li>
                  <li><Check :size="14" /> {{ $t('trialWall.feature.promotions') }}</li>
                </ul>

                <div class="option-select-indicator">
                  <div class="radio-ring" :class="{ checked: selectedPlan === 'pro' }">
                    <div v-if="selectedPlan === 'pro'" class="radio-dot" />
                  </div>
                  <span>{{ selectedPlan === 'pro' ? $t('plans.selected') : $t('plans.selectPro') }}</span>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="billingError" class="alert error">
              <AlertCircle :size="16" /> {{ billingError }}
            </div>

            <!-- CTA -->
            <button class="btn-checkout" @click="goToCheckout" :disabled="!selectedPlan || loading">
              <Loader2 v-if="loading" :size="18" class="spin" />
              <template v-else>
                {{ $t('plans.continueToCheckout') }}
                <ArrowRight :size="18" />
              </template>
            </button>

            <p class="secure-note"><Lock :size="14" /> {{ $t('trialWall.secureNote') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { supabase } from '@/lib/supabase'
import { Zap, X, Star, Check, ArrowRight, Lock, Loader2, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'checkout-started', 'checkout-error'])

const selectedPlan = ref('pro')
const loading = ref(false)
const billingError = ref('')
const starterPrice = ref(49)
const proPrice = ref(99)

onMounted(async () => {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('app_config')
      .eq('id', true)
      .single()
    if (settings?.app_config) {
      if (settings.app_config.starter_price_ls) starterPrice.value = settings.app_config.starter_price_ls
      if (settings.app_config.pro_price_ls) proPrice.value = settings.app_config.pro_price_ls
    }
  } catch (e) {
    console.warn('Failed to load plan pricing', e)
  }
})

function close() {
  emit('update:modelValue', false)
}

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
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (err) {
    console.error('[PlanPicker] Checkout error:', err)
    billingError.value = t('trialWall.checkoutError')
    emit('checkout-error', billingError.value)
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
  padding: 12px;
}

/* ── Modal shell ── */
.modal-plan-picker {
  background: var(--color-bg-surface);
  border-radius: 24px;
  width: 100%;
  max-width: 680px;
  max-height: calc(100vh - 24px);
  border: 1px solid var(--color-border-subtle);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header (sticky) ── */
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  flex-shrink: 0;
}

.picker-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.picker-header-left > div:last-child {
  min-width: 0;
}

.picker-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.picker-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-subtitle {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-close {
  width: 38px;
  height: 38px;
  border-radius: 10px;
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

/* ── Body (scrollable) ── */
.picker-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* ── Plan options ── */
.plan-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.plan-option {
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border-subtle);
  border-radius: 18px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.18s;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* ── Pro badge ── */
.pro-badge {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 30px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.02em;
  z-index: 1;
}

/* ── Option top ── */
.option-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.option-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.option-name-pro {
  color: var(--color-accent);
}

.option-price {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  white-space: nowrap;
}

.option-price-pro {
  color: var(--color-accent);
}

.price-dollar {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
}

.price-mo {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  margin-bottom: 3px;
  margin-left: 2px;
}

.option-tagline {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
}

/* ── Features ── */
.option-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.option-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
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
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
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

.radio-ring.checked {
  border-color: var(--color-accent);
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent);
}

/* ── Alert ── */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
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
  padding: 15px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
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
  font-size: 11px;
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
    gap: 20px;
  }

  .picker-body {
    padding: 16px;
  }

  .plan-option {
    padding: 16px;
  }

  .option-top {
    flex-wrap: nowrap;
  }

  .option-price {
    font-size: 22px;
  }

  .btn-checkout {
    padding: 14px;
    font-size: 15px;
  }
}

@media (max-width: 380px) {
  .modal-backdrop {
    padding: 8px;
  }

  .picker-header {
    padding: 14px 16px;
  }

  .picker-logo {
    width: 36px;
    height: 36px;
  }

  .picker-title {
    font-size: 16px;
  }

  .picker-subtitle {
    font-size: 10px;
  }

  .picker-close {
    width: 36px;
    height: 36px;
  }

  .picker-body {
    padding: 14px;
  }

  .plan-option {
    padding: 14px;
    gap: 10px;
  }

  .option-name {
    font-size: 16px;
  }

  .option-price {
    font-size: 20px;
  }

  .price-dollar {
    font-size: 12px;
    margin-top: 3px;
  }

  .price-mo {
    font-size: 11px;
  }

  .option-features li {
    font-size: 11px;
    gap: 6px;
  }

  .option-features li svg {
    width: 12px;
    height: 12px;
  }

  .pro-badge {
    font-size: 10px;
    padding: 3px 12px;
  }

  .btn-checkout {
    padding: 12px;
    font-size: 14px;
  }

  .secure-note {
    font-size: 10px;
  }
}

/* ── Height-based adjustments ── */
@media (max-height: 700px) {
  .plan-options {
    gap: 12px;
  }

  .plan-option {
    padding: 14px;
    gap: 10px;
  }

  .option-features {
    gap: 4px;
  }

  .option-select-indicator {
    padding-top: 10px;
  }
}

@media (max-height: 600px) {
  .option-features li {
    font-size: 11px;
  }

  .option-features {
    gap: 3px;
  }
}
</style>
