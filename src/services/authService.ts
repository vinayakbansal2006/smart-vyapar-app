import { supabase } from './supabaseClient';

// ─── Google OAuth ────────────────────────────────────────────────────────────

/**
 * Initiate Google OAuth sign-in via Supabase.
 * Redirects the user to Google's consent screen; after approval
 * Supabase redirects back to the app with a session.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    console.error('[authService] Google sign-in failed:', error.message);
    throw error;
  }
}

// ─── Phone OTP ───────────────────────────────────────────────────────────────

/**
 * Send a 6-digit OTP to the given phone number via Supabase.
 * Phone must include country code, e.g. "+919876543210".
 */
export async function sendPhoneOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    console.error('[authService] Failed to send OTP:', error.message);
    throw error;
  }
}

/**
 * Verify the OTP the user entered.
 * On success Supabase creates / returns a session.
 */
export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<{ userId: string; phone: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) {
    console.error('[authService] OTP verification failed:', error.message);
    throw error;
  }
  const userId = data.user?.id ?? '';
  return { userId, phone };
}

// ─── User profile persistence ────────────────────────────────────────────────

/**
 * Upsert essential user fields into the `user_profiles` table
 * after any successful authentication (Google or Phone).
 */
export async function upsertUserProfile(profile: {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
}): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert(
    {
      id: profile.id,
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      name: profile.name ?? null,
      avatar_url: profile.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('[authService] Failed to upsert user profile:', error.message);
    // Non-blocking — the user is still logged in
  }
}

// ─── Password reset ─────────────────────────────────────────────────────────

/**
 * Send a password reset email via Supabase.
 */
export async function resetPasswordForEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) {
    console.error('[authService] Password reset failed:', error.message);
    throw error;
  }
}

// ─── Session helpers ─────────────────────────────────────────────────────────

/**
 * Return the current Supabase session (or null).
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Sign the user out of Supabase.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[authService] Sign-out error:', error.message);
}

/**
 * Subscribe to Supabase auth state changes (login, logout, token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
