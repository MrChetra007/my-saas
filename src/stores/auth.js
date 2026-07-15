import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { setLocale } from '@/i18n'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: true,
    restaurantTimezone: 'UTC',
    restaurantCurrency: 'USD',
    _restaurant: null, // cached restaurant row for admin guard
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    role: (state) => state.profile?.role,
    restaurantId: (state) => state.profile?.restaurant_id,
    isAdmin: (state) => state.profile?.role === 'admin',
    isKitchen: (state) => state.profile?.role === 'kitchen',
    isCashier: (state) => state.profile?.role === 'cashier',
    isWaiter: (state) => state.profile?.role === 'waiter',
    isSuperAdmin: (state) => state.profile?.is_super_admin === true, // 👈 new
  },

  actions: {
    async init() {
      console.log('AuthStore: init start')
      this.loading = true

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('AuthStore: getSession resolved', !!session)

        if (session?.user) {
          this.user = session.user
          await this.fetchProfile()
        }
      } catch (err) {
        console.error('AuthStore: init error', err)
      } finally {
        this.loading = false
        console.log('AuthStore: init end')
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('AuthStore: onAuthStateChange', event, !!session)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            this.user = session.user
            this.fetchProfile().catch((err) => console.error('Background fetchProfile error:', err))
          }
        }
        if (event === 'SIGNED_OUT') {
          this.user = null
          this.profile = null
        }
      })
    },

    async fetchProfile() {
      if (!this.user) return

      console.log('AuthStore: fetchProfile start for', this.user.id)

      const { data, error } = await Promise.race([
        supabase
          .from('users')
          .select('*, is_super_admin') // 👈 explicit select (or keep * if your RLS allows)
          .eq('id', this.user.id)
          .maybeSingle(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('fetchProfile timed out')), 10000),
        ),
      ])

      if (error) {
        console.error('fetchProfile error:', error)
        return
      }

      this.profile = data

      // Apply user's language preference
      if (data?.language) {
        setLocale(data.language)
      }

      // Super admins have no restaurant — skip restaurant fetch
      if (data?.restaurant_id && !data?.is_super_admin) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('timezone, currency, onboarding_completed, plan, trial_ends_at, billing_type, plan_expires_at, grace_period_ends_at')
          .eq('id', data.restaurant_id)
          .single()

        this._restaurant = restaurant
        this.restaurantTimezone = restaurant?.timezone || 'UTC'
        this.restaurantCurrency = restaurant?.currency || 'USD'
        await this._loadPlanPricing()
      }

      console.log('AuthStore: fetchProfile success', !!data, 'super_admin:', !!data?.is_super_admin)
    },

    async refreshRestaurant() {
      if (!this.profile?.restaurant_id || this.isSuperAdmin) return
      const { data } = await supabase
        .from('restaurants')
        .select('timezone, currency, onboarding_completed, plan, trial_ends_at, billing_type, plan_expires_at, grace_period_ends_at')
        .eq('id', this.profile.restaurant_id)
        .single()
      if (data) {
        this._restaurant = data
        this.restaurantTimezone = data.timezone || 'UTC'
        this.restaurantCurrency = data.currency || 'USD'
        await this._loadPlanPricing()
      }
    },

    async _loadPlanPricing() {
      let starterPrice = 15
      let proPrice = 25

      try {
        const { data: settings } = await supabase
          .from('platform_settings')
          .select('app_config')
          .eq('id', true)
          .single()
        if (settings?.app_config) {
          const cfg = settings.app_config
          if (cfg.starter_price_manual) starterPrice = Number(cfg.starter_price_manual)
          if (cfg.pro_price_manual) proPrice = Number(cfg.pro_price_manual)
        } else {
          const { data: starterPlan } = await supabase
            .from('plans')
            .select('monthly_fee')
            .eq('id', 'starter')
            .maybeSingle()
          if (starterPlan?.monthly_fee) starterPrice = starterPlan.monthly_fee

          const { data: proPlan } = await supabase
            .from('plans')
            .select('monthly_fee')
            .eq('id', 'pro')
            .maybeSingle()
          if (proPlan?.monthly_fee) proPrice = proPlan.monthly_fee
        }
      } catch (e) {
        console.warn('Failed to load pricing', e)
      }

      const plan = this._restaurant?.plan || 'trial'
      this._restaurant = {
        ...this._restaurant,
        _plan_pricing: plan === 'pro' ? proPrice : starterPrice,
      }
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },
  },
})
