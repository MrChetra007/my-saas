<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal-pro-picker">
          <!-- ── Header ── -->
          <div class="picker-header">
            <div class="header-glow" />
            <button class="picker-close" @click="close">
              <X :size="20" />
            </button>
            <div class="header-icon">
              <Crown :size="24" />
            </div>
            <h2 class="picker-title">{{ $t('settings.upgradeToPro') }}</h2>
            <p class="picker-subtitle">
              <i18n-t keypath="plans.proFeatureDesc" tag="span">
                <template #feature><strong>{{ featureName }}</strong></template>
              </i18n-t>
            </p>
          </div>

          <!-- ── Features ── -->
          <div class="picker-body">
            <ul class="feature-list">
              <li v-for="f in proFeatures" :key="f.label" class="feature-item">
                <div class="feature-icon-wrap">
                  <component :is="f.icon" :size="16" />
                </div>
                <div class="feature-text">
                  <div class="feature-label">{{ f.label }}</div>
                  <div class="feature-desc">{{ f.desc }}</div>
                </div>
              </li>
            </ul>

            <!-- Price -->
            <div class="price-row">
              <div class="price-amount">
                <span class="price-dollar">$</span>{{ proPrice }}<span class="price-mo">/mo</span>
              </div>
              <div class="price-note">{{ $t('plans.cancelAnytime') }}</div>
            </div>

            <!-- Error -->
            <div v-if="error" class="alert-error"><AlertCircle :size="14" /> {{ error }}</div>

            <!-- Actions -->
            <button class="btn-upgrade" @click="goToCheckout" :disabled="loading">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <template v-else> <Zap :size="16" /> {{ $t('settings.upgradeToPro') }} </template>
            </button>
            <button class="btn-cancel" @click="close">{{ $t('plans.maybeLater') }}</button>

            <p class="secure-note"><Lock :size="12" /> {{ $t('trialWall.secureNote') }}</p>
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
  ShieldCheck,
  Utensils,
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  featureName: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'checkout-error'])

const loading = ref(false)
const error = ref('')
const proPrice = ref(99)

const proFeatures = [
  {
    icon: Infinity,
    label: t('trialWall.feature.unlimitedTables'),
    desc: t('plans.featureUnlimitedTablesDesc'),
  },
  {
    icon: Users,
    label: t('trialWall.feature.upTo10Staff'),
    desc: t('plans.featureUpTo10StaffDesc'),
  },
  {
    icon: BarChart2,
    label: t('trialWall.feature.allStaffViews'),
    desc: t('plans.featureAllStaffViewsDesc'),
  },
  {
    icon: Activity,
    label: t('trialWall.feature.analytics'),
    desc: t('plans.featureAnalyticsDesc'),
  },
  {
    icon: Tag,
    label: t('trialWall.feature.promotions'),
    desc: t('plans.featurePromotionsDesc'),
  },
]

onMounted(async () => {
  try {
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('app_config')
      .eq('id', true)
      .single()
    if (settings?.app_config?.pro_price_ls) {
      proPrice.value = settings.app_config.pro_price_ls
    }
  } catch (e) {
    console.warn('Failed to load Pro pricing', e)
  }
})

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
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (e) {
    console.error('[ProPlanPicker] Checkout error:', e)
    error.value = t('trialWall.checkoutError')
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
  padding: 12px;
}

/* ── Modal ── */
.modal-pro-picker {
  background: var(--color-bg-surface);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  max-height: calc(100vh - 24px);
  border: 1px solid var(--color-border-subtle);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.picker-header {
  position: relative;
  padding: 28px 20px 20px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
  flex-shrink: 0;
}

.header-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(200, 115, 58, 0.18) 0%, transparent 70%);
  pointer-events: none;
}

.picker-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
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
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 8px 24px rgba(200, 115, 58, 0.4);
  position: relative;
  z-index: 1;
}

.picker-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 6px;
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

.picker-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  position: relative;
  z-index: 1;
}

.picker-subtitle strong {
  color: var(--color-accent);
}

/* ── Body (scrollable) ── */
.picker-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

/* ── Feature list ── */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
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
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--color-accent-muted);
  border: 1px solid var(--color-accent-border);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text {
  flex: 1;
  min-width: 0;
}

.feature-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  line-height: 1.3;
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
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  margin-bottom: 16px;
}

.price-amount {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 800;
  color: var(--color-accent);
  letter-spacing: -1px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  gap: 1px;
}

.price-dollar {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}

.price-mo {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  align-self: flex-end;
  margin-bottom: 4px;
}

.price-note {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.4;
  text-align: right;
}

/* ── Error ── */
.alert-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

/* ── Buttons ── */
.btn-upgrade {
  width: 100%;
  padding: 14px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
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
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-border-medium);
  border-radius: 14px;
  color: var(--color-text-muted);
  font-size: 15px;
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
  gap: 6px;
  font-size: 12px;
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

/* ── Small screen adjustments ── */
@media (max-width: 380px) {
  .modal-backdrop {
    padding: 8px;
  }

  .picker-header {
    padding: 24px 16px 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .header-icon :deep(svg) {
    width: 22px;
    height: 22px;
  }

  .picker-title {
    font-size: 22px;
  }

  .picker-subtitle {
    font-size: 13px;
  }

  .picker-body {
    padding: 16px;
  }

  .feature-item {
    gap: 10px;
  }

  .feature-icon-wrap {
    width: 28px;
    height: 28px;
  }

  .feature-icon-wrap :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .price-amount {
    font-size: 28px;
  }

  .btn-upgrade {
    padding: 12px;
    font-size: 15px;
  }

  .btn-cancel {
    padding: 10px;
    font-size: 14px;
  }
}

/* ── Height-based adjustments ── */
@media (max-height: 600px) {
  .picker-header {
    padding: 20px 16px 16px;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 8px;
  }

  .feature-list {
    gap: 8px;
  }

  .price-row {
    padding: 10px 14px;
    margin-bottom: 12px;
  }
}
</style>
