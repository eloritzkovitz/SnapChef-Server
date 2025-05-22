import express from 'express';
import { createNotification } from './notificationController';
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
 *               message:
 *                 type: string
 *                 description: Notification message content
 *               type:
 *                 type: string
 *                 description: Type of notification (e.g., info, warning)
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, createNotification);

export default router;