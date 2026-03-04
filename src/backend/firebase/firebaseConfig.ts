/**
 * Firebase App Initialization
 * ────────────────────────────
 * Central configuration for the Firebase SDK.
 * Every other Firebase service (Auth, Firestore, Analytics, etc.)
 * imports the `app` instance from here.
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBdY81045B5O6bH4hOaUVjZEWcs3abH8_E',
  authDomain: 'vyaparika-7b3f8.firebaseapp.com',
  projectId: 'vyaparika-7b3f8',
  storageBucket: 'vyaparika-7b3f8.firebasestorage.app',
  messagingSenderId: '769430383972',
  appId: '1:769430383972:web:98c54a0f9295a0d2cd9e71',
  measurementId: 'G-L15GJQBEFV',
};

/** Initialised Firebase application instance */
const app = initializeApp(firebaseConfig);

/** Firebase Analytics (only available in browser environments) */
let analytics: Analytics | null = null;
try {
  analytics = getAnalytics(app);
} catch {
  // Analytics may fail in SSR / test environments — safe to ignore
}

export { analytics };
export default app;
