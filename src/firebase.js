import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
const hasValidConfig = Boolean(apiKey && apiKey.length > 10 && !apiKey.includes('placeholder') && !apiKey.includes('YOUR_'));

let app = null;
let authInstance = null;

const getAuthDomain = () => {
  const envDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  if (envDomain) return envDomain;
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'abkharido-auth.firebaseapp.com';
    }
    return host;
  }
  return 'abkharido.com';
};

if (hasValidConfig) {
  try {
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: getAuthDomain(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'abkharido-auth',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'abkharido-auth.firebasestorage.app',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '765362198864',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:765362198864:web:3a4045d7ae05dcb37bf455'
    };
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    if (typeof window !== 'undefined' && authInstance && typeof authInstance.useDeviceLanguage === 'function') {
      try {
        authInstance.useDeviceLanguage();
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[Firebase Client] Initialization skipped:', err?.message || err);
  }
}

export const auth = authInstance;
export default app;
