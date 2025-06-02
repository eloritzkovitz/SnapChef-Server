import express from "express";
import usersController from "./userController";
import { authenticate } from "../../middlewares/auth";
import upload from "../../middlewares/upload";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - fridgeId
 *         - cookbookId
 *         - preferences
 *         - friends
 *         - joinDate
 *       properties:
 *         _id:
 *           type: string
 *           description: The user's unique identifier
 *           example: "60d21b4667d0d8992e610c85"
 *         email:
 *           type: string
 *           description: The user's email address
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           description: The user's hashed password
 *           example: "$2b$10$abcdef..."
 *         firstName:
 *           type: string
 *           description: The user's first name
 *           example: "John"
 *         lastName:
 *           type: string
 *           description: The user's last name
 *           example: "Doe"
 *         profilePicture:
 *           type: string
 *           description: URL to the user's profile picture
 *           example: "https://example.com/profile/john.jpg"
 *         role:
 *           type: string
 *           description: The user's role
 *           example: "user"
 *         fridgeId:
 *           type: string
 *           description: The user's fridge ID
 *           example: "60d21b4667d0d8992e610c99"
 *         cookbookId:
 *           type: string
 *           description: The user's cookbook ID
 *           example: "60d21b4667d0d8992e610c98"
 *         preferences:
 *           type: object
 *           description: The user's preferences
 *           example:
 *             allergies: ["peanuts"]
 *             dietaryPreferences:
 *               vegan: false
 *               vegetarian: true
 *         friends:
 *           type: array
 *           description: List of friend user IDs
 *           items:
 *             type: string
 *           example: ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c87"]
 *         joinDate:
 *           type: string
 *           description: The date the user joined
 *           example: "2024-06-02T18:00:00.000Z"
 *         refreshToken:
 *           type: string
 *           description: The user's refresh token
 *           example: "some-refresh-token"
 *         fcmToken:
 *           type: string
 *           description: The user's FCM token for push notifications
 *           example: "some-fcm-token"
 *         otp:
 *           type: string
 *           description: The user's current OTP (if any)
 *           example: "123456"
 *           nullable: true
 *         otpExpires:
 *           type: string
 *           format: date-time
 *           description: When the OTP expires
 *           example: "2024-06-02T18:10:00.000Z"
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *           example: false
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user data
 *     description: Retrieve the authenticated user's data.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/me", authenticate, usersController.getUserData);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user data
 *     description: Update the authenticated user's details including first name, last name, password, and profile picture.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/me",
  authenticate,
  upload.single("profilePicture"),
  usersController.updateUser
);

/**
 * @swagger
 * /api/users/me/preferences:
 *   put:
 *     summary: Update current user preferences
 *     description: Update the authenticated user's preferences such as allergies and dietary preferences.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of allergies
 *                 example: ["peanuts", "shellfish"]
 *               dietaryPreferences:
 *                 type: object
 *                 properties:
 *                   vegan:
 *                     type: boolean
 *                     example: true
 *                   vegetarian:
 *                     type: boolean
 *                     example: false
 *                   pescatarian:
 *                     type: boolean
 *                     example: false
 *                   carnivore:
 *                     type: boolean
 *                     example: false
 *                   ketogenic:
 *                     type: boolean
 *                     example: false
 *                   paleo:
 *                     type: boolean
 *                     example: false
 *                   lowCarb:
 *                     type: boolean
 *                     example: false
 *                   lowFat:
 *                     type: boolean
 *                     example: false
 *                   glutenFree:
 *                     type: boolean
 *                     example: false
 *                   dairyFree:
 *                     type: boolean
 *                     example: false
 *                   kosher:
 *                     type: boolean
 *                     example: false
 *                   halal:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preferences updated successfully
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["peanuts", "shellfish"]
 *                     dietaryPreferences:
 *                       type: object
 *                       properties:
 *                         vegan:
 *                           type: boolean
 *                           example: true
 *                         vegetarian:
 *                           type: boolean
 *                           example: false
 *                         pescatarian:
 *                           type: boolean
 *                           example: false
 *                         carnivore:
 *                           type: boolean
 *                           example: false
 *                         ketogenic:
 *                           type: boolean
 *                           example: false
 *                         paleo:
 *                           type: boolean
 *                           example: false
 *                         lowCarb:
 *                           type: boolean
 *                           example: false
 *                         lowFat:
 *                           type: boolean
 *                           example: false
 *                         glutenFree:
 *                           type: boolean
 *                           example: false
 *                         dairyFree:
 *                           type: boolean
 *                           example: false
 *                         kosher:
 *                           type: boolean
 *                           example: false
 *                         halal:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/me/preferences", authenticate, usersController.updatePreferences);

/**
 * @swagger
 * /api/users/me/fcm-token:
 *   put:
 *     summary: Update the FCM token for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: "your-fcm-token"
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *       400:
 *         description: FCM token is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating FCM token
 */
router.put("/me/fcm-token", authenticate, usersController.updateFcmToken);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete current user
 *     description: Delete the authenticated user's account, including their profile picture and associated data.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/me", authenticate, usersController.deleteUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Search users by name
 *     description: Retrieve a list of users whose first or last name matches the query.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query (part of the first or last name)
 *     responses:
 *       200:
 *         description: List of matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d21b4667d0d8992e610c85
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   profilePicture:
 *                     type: string
 *                     example: https://example.com/profile/john.jpg
 *       400:
 *         description: Query parameter is required
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, usersController.findUsersByName);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get another user's public profile
 *     description: Retrieve public profile information for another user by their ID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user's public profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authenticate, usersController.getUserProfile);

/**
 * @swagger
 * /api/users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics for a user, such as ingredient count, recipe count, most popular ingredients, favorite recipe count, and friend count.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ingredientCount:
 *                   type: integer
 *                   example: 12
 *                 recipeCount:
 *                   type: integer
 *                   example: 8
 *                 mostPopularIngredients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "tomato"
 *                       count:
 *                         type: integer
 *                         example: 5
 *                 favoriteRecipeCount:
 *                   type: integer
 *                   example: 3
 *                 friendCount:
 *                   type: integer
 *                   example: 7
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/:id/stats", authenticate, usersController.getUserStats);

export default router;
