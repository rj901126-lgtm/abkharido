import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const hasValidConfig = Boolean(apiKey && apiKey.trim().length > 10 && !apiKey.includes('placeholder') && !apiKey.includes('YOUR_'));

let app = null;
let authInstance = null;

if (hasValidConfig) {
  try {
    const firebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
    };
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (err) {
    console.warn('[Firebase Client] Initialization skipped:', err?.message || err);
  }
}

export const auth = authInstance;
export default app;
