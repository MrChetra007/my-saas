import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // ← tokens come as ?code= not #hash
    autoRefreshToken: true,
    detectSessionInUrl: true, // ← lets Supabase pick up the code on load
    persistSession: true,
  },
})
