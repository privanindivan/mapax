// In your auth.js or supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const redirectTo = import.meta.env.DEV 
  ? 'http://localhost:8080'
  : 'https://mapax.netlify.app'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})