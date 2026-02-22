<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-plan-picker">
          <!-- Header -->
          <div class="picker-header">
            <div class="picker-header-left">
              <div class="picker-logo">
                <Zap :size="16" />
              </div>
              <div>
                <h2 class="picker-title">Choose Your Plan</h2>
                <p class="picker-subtitle">
                  {{
                    featureName
                      ? `${featureName} requires a paid plan`
                      : 'Secure checkout via Lemon Squeezy · Cancel anytime'
                  }}
                </p>
              </div>
            </div>
            <button class="picker-close" @click="$emit('update:modelValue', false)">
              <X :size="16" />
            </button>
          </div>

          <!-- Body -->
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
            <div v-if="error" class="checkout-error"><AlertCircle :size="14" /> {{ error }}</div>

            <!-- CTA -->
            <button class="btn-checkout" @click="goToCheckout" :disabled="!selectedPlan || loading">
              <Loader2 v-if="loading" :size="16" class="spin" />
              <template v-else> Continue to Checkout <ArrowRight :size="16" /> </template>
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
import { X, Zap, Star, Check, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: Boolean, // v-model for open/close
  featureName: {
    // e.g. "Analytics" — shown in subtitle
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const selectedPlan = ref('pro')
const loading = ref(false)
const error = ref('')

async function goToCheckout() {
  if (!selectedPlan.value) return
  error.value = ''
  loading.value = true
  try {
    const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan: selectedPlan.value },
    })
    if (fnError) throw fnError
    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (err) {
    error.value = 'Could not start checkout. Please try again.'
    loading.value = false
  }
}
</script>

<style scoped>
/* paste the modal styles from Settings.vue here —
   everything from .modal-backdrop down to the end */
</style>
