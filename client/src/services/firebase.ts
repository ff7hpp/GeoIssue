import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCFOq7LNCENcz5QHDerUiwN84uEII-AEPk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'geoissue-4bd94.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'geoissue-4bd94',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'geoissue-4bd94.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '916627529016',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:916627529016:web:0a188e1ed885f405cbf5cd',
};

// Initialize Firebase for 100% Free Authentication & Hosting
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
};
export type { FirebaseUser };
