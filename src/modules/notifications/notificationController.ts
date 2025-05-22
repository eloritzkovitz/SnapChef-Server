import { Request, Response } from 'express';
import admin from 'firebase-admin';
import Notification from './Notification';
import { getUserId } from '../../utils/requestHelpers';

// Helper to send a push notification using Firebase Cloud Messaging
const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  type: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        type,
        ...(metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)])) : {}),
      },
    };

    await admin.messaging().send(message);
    console.log(`Push notification sent to token: ${token}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw new Error('Failed to send push notification.');
  }
};

// Create a notification and (optionally) send a push notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {    
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { type, title, body, metadata, deviceToken } = req.body;

    if (!type || !title || !body) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    // Store the notification in the DB for local and history sync
    const notification = await Notification.create({
      userId: userId,
      type,
      title,
      body,
      metadata,
    });

    // Optionally send a push notification if deviceToken is provided
    if (deviceToken) {
      await sendPushNotification(deviceToken, title, body, type, metadata);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ message: 'Failed to send notification.' });
  }
};