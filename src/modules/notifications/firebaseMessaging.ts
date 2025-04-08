import admin from 'firebase-admin';

admin.initializeApp();

const messaging = admin.messaging();

export { messaging };