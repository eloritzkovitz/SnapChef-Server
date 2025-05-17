import express from "express";
import usersController from "./userController";
import { authMiddleware } from "../../middleware/auth";
import upload from "../../middleware/upload";

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
 * /users/{id}:
 *   get:
 *     summary: Get user data
 *     description: Retrieve the user data
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
router.get("/:id", authMiddleware, usersController.getUserData);

/**
 * @swagger
 * /users:
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
router.get("/", authMiddleware, usersController.findUsersByName);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user data
 *     description: Update user details including first name, last name, password, and profile picture
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
router.put("/:id", authMiddleware, upload.single("profilePicture"), usersController.updateUser);

/**
 * @swagger
 * /users/{id}/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences such as allergies and dietary preferences.
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
router.put("/:id/preferences", authMiddleware, usersController.updatePreferences);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by their ID, including their profile picture and associated data.
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authMiddleware, usersController.deleteUser);

export default router;