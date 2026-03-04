/**
 * Supabase Client
 * ────────────────
 * Single Supabase client instance shared across the entire app.
 * Environment variables SUPABASE_URL and SUPABASE_ANON_KEY must
 * be set in your .env file.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. ' +
      'Set them in your .env file so Supabase features work correctly.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
