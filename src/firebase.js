import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBelERlA93mJok7ibKf6AMEYTROS4yNFKY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "abkharido-auth.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "abkharido-auth",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "abkharido-auth.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "765362198864",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:765362198864:web:3a4045d7ae05dcb37bf455"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
