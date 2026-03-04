/**
 * Firebase — Barrel Export
 * ────────────────────────
 * Re-exports every Firebase-related module so consumers
 * can import from `@/backend/firebase` in one place.
 */

// Firebase app
export { default as firebaseApp, analytics } from './firebaseConfig';

// Firestore
export { default as db } from './firestoreClient';

// Auth
export {
  loginWithGoogle,
  logoutFirebase,
  onFirebaseAuthStateChanged,
  auth,
  provider,
} from './firebaseAuth';
