import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBelERlA93mJok7ibKf6AMEYTROS4yNFKY').trim();
const hasValidConfig = Boolean(apiKey && apiKey.length > 10 && !apiKey.includes('placeholder') && !apiKey.includes('YOUR_'));

let app = null;
let authInstance = null;

if (hasValidConfig) {
  try {
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || 'abkharido-auth.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'abkharido-auth',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'abkharido-auth.firebasestorage.app',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '765362198864',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:765362198864:web:3a4045d7ae05dcb37bf455'
    };
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (err) {
    console.warn('[Firebase Client] Initialization skipped:', err?.message || err);
  }
}

export const auth = authInstance;
export default app;
