import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://leywnjsjihscktddshho.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleXduanNqaWhzY2t0ZGRzaGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTgzMjUsImV4cCI6MjA1MDk3NDMyNX0.ovyU0X3DJajnkTyI9oCkV8VchiZaHbZ4igURUOST2Nk";

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);