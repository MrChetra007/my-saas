import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useBillingStatus() {
  const authStore = useAuthStore()

  const billingStatus = computed(() => {
    const r = authStore._restaurant
    if (!r) return 'loading'

    const now = new Date()
    const planExpires = r.plan_expires_at ? new Date(r.plan_expires_at) : null
    const graceEnds = r.grace_period_ends_at ? new Date(r.grace_period_ends_at) : null
    const trialEnds = r.trial_ends_at ? new Date(r.trial_ends_at) : null
    const billingType = r.billing_type || 'manual'
    const plan = r.plan || 'trial'

    // Blocked: no active plan, no grace, trial expired (for manual billing this means plan fully expired)
    if (plan === 'expired') return 'blocked'

    // Manual billing: check grace period first
    if (billingType === 'manual') {
      if (graceEnds && now < graceEnds) return 'grace'
      if (planExpires && now >= planExpires) return 'blocked'
    }

    // LemonSqueezy: trial check
    if (billingType === 'lemonsqueezy') {
      if (['pro', 'starter'].includes(plan)) return 'active'
      if (trialEnds && now >= trialEnds) return 'blocked'
    }

    // Trial fallback
    if (plan === 'trial' && trialEnds && now >= trialEnds) return 'blocked'

    return 'active'
  })

  const graceEndsAt = computed(() => authStore._restaurant?.grace_period_ends_at || null)
  const planExpiresAt = computed(() => authStore._restaurant?.plan_expires_at || null)
  const planName = computed(() => authStore._restaurant?.plan || 'trial')

  return { billingStatus, graceEndsAt, planExpiresAt, planName }
}
