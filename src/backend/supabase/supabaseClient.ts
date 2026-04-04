/**
 * =========================================================================
 * Supabase Client Initialization (supabaseClient.ts)
 * -------------------------------------------------------------------------
 * Configures and exports a unified singleton instance of the Supabase client.
 * It reads credentials from Vite's import.meta.env or Node's process.env
 * to safely handle builds. Error logging triggers if keys are missing.
 * =========================================================================
 */

import { createClient } from '@supabase/supabase-js';

const viteEnv = (import.meta as any)?.env ?? {};

const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] Missing credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

// Keep client creation non-fatal so the app can render a useful login error state.
export const supabase = createClient(
  supabaseUrl || 'https://invalid.supabase.local',
  supabaseAnonKey || 'invalid-anon-key',
  {
    auth: {
      redirectTo: window.location.origin // dynamically uses current origin
    }
  }
);
