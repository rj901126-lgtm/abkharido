import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBELERLA93mJok7ibKf6AMEYTROS4yNFKY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "abkharido-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "abkharido-auth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "abkharido-auth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "765362198864",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:765362198864:web:3a4045d7ae05dcb37bf456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
