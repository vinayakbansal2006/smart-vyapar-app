/**
 * Backend — Barrel Export
 * ───────────────────────
 * Central re-export for every backend provider (Firebase + Supabase).
 *
 * Usage:
 *   import { supabase, db, loginWithGoogle } from '../backend';
 */

// ── Firebase ──────────────────────────────────────────────────────
export {
  firebaseApp,
  analytics,
  db,
  loginWithGoogle,
  logoutFirebase,
  onFirebaseAuthStateChanged,
  auth as firebaseAuth,
  provider as googleProvider,
} from './firebase';

// ── Supabase ──────────────────────────────────────────────────────
export { supabase } from './supabase';
