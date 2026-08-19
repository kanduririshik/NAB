import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Dynamic storage key scoped per portal path to prevent multi-tab auth collisions
const getStorageKey = () => {
  if (typeof window === 'undefined') return 'sb-portal-auth-token';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'sb-admin-auth-token';
  if (path.startsWith('/staff')) return 'sb-staff-auth-token';
  return 'sb-customer-auth-token';
};

// Configure per-tab and per-portal isolated sessionStorage so multiple tabs (Customer, Admin, Staff)
// maintain independent authentication sessions simultaneously without cross-tab collisions.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: getStorageKey(),
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
