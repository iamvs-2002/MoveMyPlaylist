const admin = require("firebase-admin");

/**
 * Firebase Admin SDK Configuration
 * Initialize Firestore for transfer statistics
 */

let firestore = null;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      firestore = admin.firestore();
      console.log("Firebase already initialized");
      return firestore;
    }

    // Initialize Firebase Admin SDK
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account key from environment variable
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account file path
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Use default credentials (for local development)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "movemyplaylist-dev",
      });
    }

    firestore = admin.firestore();
    console.log("Firebase Admin SDK initialized successfully");

    return firestore;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
};

/**
 * Get Firestore instance
 */
const getFirestore = () => {
  if (!firestore) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }
  return firestore;
};

/**
 * Close Firebase connection
 */
const closeFirebase = async () => {
  try {
    if (admin.apps.length > 0) {
      await admin.app().delete();
      firestore = null;
      console.log("Firebase connection closed");
    }
  } catch (error) {
    console.error("Error closing Firebase connection:", error);
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  closeFirebase,
};
