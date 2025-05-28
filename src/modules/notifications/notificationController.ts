import { Request, Response } from 'express';
import admin from 'firebase-admin';
import Notification from './Notification';
import { getUserId } from '../../utils/requestHelpers';
import logger from '../../utils/logger';

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
    logger.info(`Push notification sent to token: ${token}`);
  } catch (error) {
    logger.error('Error sending push notification: %o', error);
    throw new Error('Failed to send push notification.');
  }
};

// Get notifications for a user
const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const notifications = await Notification.find({ userId }).sort({ scheduledTime: 1 });

    logger.info('Fetched %d notifications for user %s', notifications.length, userId);
    res.status(200).json(notifications);
  } catch (error) {
    logger.error('Failed to fetch notifications for user %s: %o', getUserId(req), error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// Create a notification and (optionally) send a push notification
const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = getUserId(req);
    if (!senderId) {
      logger.warn('Unauthorized notification creation attempt');
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Accept userId in body for recipient (for sharing, etc.)
    const {
      userId: recipientId, // <-- recipient userId
      type,
      title,
      body,
      metadata,
      deviceToken,
      scheduledTime,
      ingredientName,
    } = req.body;

    if (!type || !title || !body) {
      logger.warn('Missing required fields for notification creation (user: %s)', senderId);
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    // For ingredient reminders, require scheduledTime and ingredientName
    if ((type === 'expiry' || type === 'grocery') && (!scheduledTime || !ingredientName)) {
      logger.warn('Missing scheduledTime or ingredientName for %s notification (user: %s)', type, senderId);
      res.status(400).json({ message: 'scheduledTime and ingredientName are required for this notification type.' });
      return;
    }

    // Use recipientId if provided, otherwise default to senderId
    const notificationUserId = recipientId || senderId;    

    // Store the notification in the DB for local and history sync
    const notification = await Notification.create({
      userId: notificationUserId,
      type,
      title,
      body,
      metadata,
      scheduledTime,
      ingredientName,
    });

    logger.info('Notification created for user %s: %j', notificationUserId, notification);

    // Optionally send a push notification if deviceToken is provided
    if (deviceToken) {
      await sendPushNotification(deviceToken, title, body, type, metadata);
    }

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Notification error for user %s: %o', getUserId(req), error);
    res.status(500).json({ message: 'Failed to send notification.' });
  }
};

// Update a notification
const updateNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { type, title, body, metadata, scheduledTime, ingredientName } = req.body;

    // Add this validation:
    if ((type === 'expiry' || type === 'grocery') && (!scheduledTime || !ingredientName)) {
      logger.warn('Missing scheduledTime or ingredientName for %s notification update (user: %s)', type, userId);
      res.status(400).json({ message: 'scheduledTime and ingredientName are required for this notification type.' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { type, title, body, metadata, scheduledTime, ingredientName },
      { new: true }
    );

    if (!notification) {
      logger.warn('Notification not found for update (user: %s, id: %s)', userId, id);
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    logger.info('Notification updated for user %s: %j', userId, notification);
    res.status(200).json(notification);
  } catch (error) {
    logger.error('Failed to update notification for user %s: %o', getUserId(req), error);
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

// Delete a notification
const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await Notification.findOneAndDelete({ _id: id, userId });
    if (!result) {
      logger.warn('Notification not found for deletion (user: %s, id: %s)', userId, id);
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    logger.info('Notification deleted for user %s: %j', userId, result);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete notification for user %s: %o', getUserId(req), error);
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
};

export default { 
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
}