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
