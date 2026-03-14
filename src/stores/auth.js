import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: true,
    restaurantTimezone: 'UTC',
    restaurantCurrency: 'USD',
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

      // Super admins have no restaurant — skip restaurant fetch
      if (data?.restaurant_id && !data?.is_super_admin) {
        // 👈 guard
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('timezone, currency')
          .eq('id', data.restaurant_id)
          .single()

        this.restaurantTimezone = restaurant?.timezone || 'UTC'
        this.restaurantCurrency = restaurant?.currency || 'USD'
      }

      console.log('AuthStore: fetchProfile success', !!data, 'super_admin:', !!data?.is_super_admin)
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },
  },
})
