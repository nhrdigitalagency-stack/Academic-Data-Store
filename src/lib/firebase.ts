/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyD9DT541sAEDGhM3a_zNvxDFbQDEdoN4fA",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "academic-data-store.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "academic-data-store",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "academic-data-store.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "434659010881",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:434659010881:web:b547f4cdc60b59523319c0"
};

const databaseId = metaEnv.VITE_FIRESTORE_DATABASE_ID || "ai-studio-academicdatastor-70e5e4dd-682c-4b6e-84e4-ebc88e3fdf52";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
