import express from 'express';
import notificationController from './notificationController';
import { authenticate } from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API for managing user notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - title
 *         - body
 *         - createdAt
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the notification
 *         userId:
 *           type: string
 *           description: ID of the user receiving the notification
 *         type:
 *           type: string
 *           enum: [expiry, grocery, friend, share, update]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         body:
 *           type: string
 *           description: Notification message content
 *         ingredientName:
 *           type: string
 *           description: Ingredient name (for expiry/grocery notifications)
 *         scheduledTime:
 *           type: string
 *           format: date-time
 *           description: Scheduled time for the notification (if applicable)
 *         metadata:
 *           type: object
 *           description: Additional metadata for the notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date of the notification
 *       example:
 *         _id: "abc123"
 *         userId: "user456"
 *         type: "expiry"
 *         title: "Ingredient Expiry Reminder"
 *         body: "Your milk is about to expire."
 *         ingredientName: "Milk"
 *         scheduledTime: "2024-06-01T10:00:00.000Z"
 *         metadata: { "fridgeId": "fridge789" }
 *         createdAt: "2024-05-23T12:00:00.000Z"
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the notification
 *               body:
 *                 type: string
 *                 description: Notification message content
 *               type:
 *                 type: string
 *                 description: Type of notification (e.g., info, warning)
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the notification
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled time for the notification (if applicable)
 *               ingredientName:
 *                 type: string
 *                 description: Ingredient name (for expiry/grocery notifications)
 *               deviceToken:
 *                 type: string
 *                 description: Device token for push notification (optional)
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, notificationController.createNotification);

/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Update a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               type:
 *                 type: string
 *               metadata:
 *                 type: object
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *               ingredientName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, notificationController.updateNotification);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     responses:
 *       204:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;