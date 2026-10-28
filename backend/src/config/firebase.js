const admin = require('firebase-admin');

let firebaseApp = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('[Firebase Admin] Initialized for FCM Push Notifications');
  } else {
    console.log('[Firebase Admin] Skipping initialization (credentials not set in .env)');
  }
} catch (error) {
  console.warn('[Firebase Admin Warning] Initialization failed:', error.message);
}

module.exports = { admin, firebaseApp };
