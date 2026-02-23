import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: true,
    restaurantTimezone: 'UTC', // 👈 add this
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    role: (state) => state.profile?.role,
    restaurantId: (state) => state.profile?.restaurant_id,
    isAdmin: (state) => state.profile?.role === 'admin',
    isKitchen: (state) => state.profile?.role === 'kitchen',
    isCashier: (state) => state.profile?.role === 'cashier',
    isWaiter: (state) => state.profile?.role === 'waiter',
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
            // Don't await here to avoid blocking auth flow
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
        supabase.from('users').select('*').eq('id', this.user.id).maybeSingle(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('fetchProfile timed out')), 10000),
        ),
      ])

      if (error) {
        console.error('fetchProfile error:', error)
        return
      }

      this.profile = data

      // 👇 fetch timezone right after profile is set
      if (data?.restaurant_id) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('timezone')
          .eq('id', data.restaurant_id)
          .single()

        this.restaurantTimezone = restaurant?.timezone || 'UTC'
      }
      console.log('AuthStore: fetchProfile success', !!data)
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
    },
  },
})
