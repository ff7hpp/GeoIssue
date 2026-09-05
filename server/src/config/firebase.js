import admin from "firebase-admin";
import { config } from "./env.js";
let firebaseApp = null;
function initFirebase() {
  if (firebaseApp) return firebaseApp;
  if (config.firebase.projectId) {
    try {
      const options = {
        projectId: config.firebase.projectId
      };
      if (config.firebase.clientEmail && config.firebase.privateKey) {
        options.credential = admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey
        });
      }
      firebaseApp = admin.initializeApp(options);
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Firebase Admin SDK:", err);
    }
  } else {
    console.log(
      "FIREBASE_PROJECT_ID is not configured. Firebase ID tokens cannot be accepted by the backend."
    );
  }
  return firebaseApp;
}
function getFirebaseAuth() {
  const app = initFirebase();
  return app ? app.auth() : null;
}
export {
  getFirebaseAuth,
  initFirebase
};
