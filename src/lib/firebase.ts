import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

const app      = getApps().find(a => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);
const adminApp = getApps().find(a => a.name === 'admin')     ?? initializeApp(firebaseConfig, 'admin');

export const db        = getDatabase(app);
export const auth      = getAuth(app);
export const adminDb   = getDatabase(adminApp);
export const adminAuth = getAuth(adminApp);
auth.languageCode      = 'ja';
adminAuth.languageCode = 'ja';
