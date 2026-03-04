/**
 * Firestore Database Connection
 * ──────────────────────────────
 * Provides a singleton Firestore instance used across the app
 * for reading / writing documents.
 */

import { getFirestore } from 'firebase/firestore';
import app from './firebaseConfig';

/** Firestore database instance */
const db = getFirestore(app);

export default db;
