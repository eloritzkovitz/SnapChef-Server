import express from "express";
import { authenticate } from "../../middlewares/auth";
import friendsController from "./friendsController";

const router = express.Router();

/**
 * @swagger
 * /api/users/{id}/friend-request:
 *   post:
 *     summary: Send a friend request to a user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to send a friend request to
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/friend-request", authenticate, friendsController.sendFriendRequest);

/**
 * @swagger
 * /api/friend-requests:
 *   get:
 *     summary: Get pending friend requests for the current user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending friend requests
 *       401:
 *         description: Unauthorized
 */
router.get("/friend-requests", authenticate, friendsController.getFriendRequests);

/**
 * @swagger
 * /api/friend-requests/{requestId}/accept:
 *   post:
 *     summary: Accept a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request accepted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.post("/friend-requests/:requestId/accept", authenticate, friendsController.acceptFriendRequest);

/**
 * @swagger
 * /api/friend-requests/{requestId}/decline:
 *   post:
 *     summary: Decline a friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request declined
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.post("/friend-requests/:requestId/decline", authenticate, friendsController.declineFriendRequest);

/**
 * @swagger
 * /api/users/me/friends:
 *   get:
 *     summary: Get the current user's friends list
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
 *       401:
 *         description: Unauthorized
 */
router.get("/me/friends", authenticate, friendsController.getFriends);

export default router;