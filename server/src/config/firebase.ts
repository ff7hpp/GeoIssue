import admin from 'firebase-admin';
import { config } from './env.js';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  if (
    config.firebase.projectId &&
    config.firebase.clientEmail &&
    config.firebase.privateKey
  ) {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize Firebase Admin SDK:', err);
    }
  } else {
    console.log(
      'Firebase credentials not fully configured. Auth middleware will run in hybrid/mock-compatible mode for local dev & testing.'
    );
  }

  return firebaseApp;
}

export function getFirebaseAuth(): admin.auth.Auth | null {
  const app = initFirebase();
  return app ? app.auth() : null;
}
