import express from "express";
const router = express.Router();
import usersController from "./userController";
import { authMiddleware } from "../../middleware/auth";
import upload from "../../middleware/upload";

/**
* @swagger
* tags:
*   name: Auth
*   description: API for managing user authentication
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
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email address
 *         password:
 *           type: string
 *           description: The user's password
 *       example:
 *         email: "user@example.com"
 *         password: "123456"
 */

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google sign-in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: The Google ID token
 *     responses:
 *       200:
 *         description: Successful sign-in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 _id:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109ca
 *       400:
 *         description: Invalid ID token
 *       500:
 *         description: Server error
 */
router.post("/google", usersController.googleSignIn);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/register", usersController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                 _id:
 *                   type: string
 *                   description: User ID
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", usersController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT refresh token
 *       400:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh", usersController.refresh);

/**
 * @swagger
 * /auth/user:
 *   get:
 *     summary: Get user data
 *     description: Retrieve the user data
 *     tags:
 *       - Auth
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
 *       500:
 *         description: Server error
 */
router.get("/user/:id", authMiddleware, usersController.getUserData);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Search users by name
 *     description: Retrieve a list of users whose first or last name matches the query.
 *     tags:
 *       - Auth
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
router.get("/users", authMiddleware, usersController.findUsersByName);

/**
 * @swagger
 * /auth/user/{userId}:
 *   put:
 *     summary: Update user data
 *     description: Update user details including first name, last name, password, and profile picture
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
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
router.put("/user/:id", authMiddleware, upload.single("profilePicture"), usersController.updateUser);

/**
 * @swagger
 * /auth/user/{userId}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences such as allergies and dietary preferences.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
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
router.put("/user/:id/preferences", authMiddleware, usersController.updatePreferences);

/**
 * @swagger
 * /auth/user/{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by their ID, including their profile picture and associated data.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
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
router.delete("/user/:id", authMiddleware, usersController.deleteUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to invalidate
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post("/logout", usersController.logout);

export default router;