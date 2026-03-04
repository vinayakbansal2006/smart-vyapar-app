/**
 * Firebase Google Authentication
 * ───────────────────────────────
 * Handles Google sign-in via Firebase Auth and persists
 * the authenticated user into the Firestore `users` collection.
 */

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig';
import db from './firestoreClient';

/** Firebase Auth instance */
const auth = getAuth(app);

/** Google OAuth provider */
const provider = new GoogleAuthProvider();

/**
 * Sign in with Google popup.
 * On success the user document is upserted into Firestore (`users/{uid}`).
 * Returns the Firebase `User` object.
 */
export const loginWithGoogle = async (): Promise<User | undefined> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Save / update user record in Firestore
    await setDoc(
      doc(db, 'users', user.uid),
      {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(), // only written on first create (merge)
      },
      { merge: true }
    );

    console.log('[firebaseAuth] User logged in & saved to Firestore:', user.displayName);
    return user;
  } catch (error) {
    console.error('[firebaseAuth] Login error:', error);
    throw error;
  }
};

/**
 * Sign the current user out of Firebase Auth.
 */
export const logoutFirebase = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('[firebaseAuth] User signed out');
  } catch (error) {
    console.error('[firebaseAuth] Sign-out error:', error);
    throw error;
  }
};

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export const onFirebaseAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, provider };
