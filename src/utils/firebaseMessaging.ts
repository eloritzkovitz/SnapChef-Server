import admin from 'firebase-admin';

// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const messaging = admin.messaging();

export { messaging };