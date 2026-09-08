import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const isConfiguredValue = (value) => typeof value === "string" && value.length > 0 && !value.startsWith("your_");
const isFirebaseConfigured = Object.values(firebaseConfig).every(isConfiguredValue);
// Firebase credentials in the browser are not enough on their own: the API must
// also be configured with Firebase Admin credentials to verify ID tokens. Keep
// each Firebase provider opt-in so local JWT authentication remains reliable.
const isFirebaseEmailAuthEnabled = isFirebaseConfigured && import.meta.env.VITE_EMAIL_AUTH_PROVIDER === "firebase";
const isFirebaseGoogleAuthEnabled = isFirebaseConfigured && import.meta.env.VITE_GOOGLE_AUTH_PROVIDER === "firebase";
const isFirebaseAuthEnabled = isFirebaseEmailAuthEnabled || isFirebaseGoogleAuthEnabled;
const app = isFirebaseAuthEnabled ? !getApps().length ? initializeApp(firebaseConfig) : getApp() : null;
const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();
export {
  app,
  auth,
  createUserWithEmailAndPassword,
  fbSignOut,
  firebaseConfig,
  isFirebaseAuthEnabled,
  isFirebaseEmailAuthEnabled,
  isFirebaseGoogleAuthEnabled,
  isFirebaseConfigured,
  googleProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
};
