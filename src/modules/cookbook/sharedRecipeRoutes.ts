import express from "express";
import { authenticate } from "../../middlewares/auth";
import sharedRecipeController from "./sharedRecipeController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shared Recipes
 *   description: API for managing shared recipes
 */

/**
 * @swagger
 * /api/cookbook/{cookbookId}/shared:
 *   get:
 *     summary: Get recipes shared with and by the authenticated user
 *     tags: [Shared Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cookbook
 *     responses:
 *       200:
 *         description: List of recipes shared with and by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/:cookbookId/shared", authenticate, sharedRecipeController.getSharedRecipes);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/shared/{sharedRecipeId}:
 *   delete:
 *     summary: Remove a recipe shared with or by the authenticated user
 *     tags: [Shared Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cookbook
 *       - in: path
 *         name: sharedRecipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the shared recipe
 *     responses:
 *       200:
 *         description: Shared recipe removed
 *       404:
 *         description: Shared recipe not found
 *       500:
 *         description: Failed to remove shared recipe
 */
router.delete("/:cookbookId/shared/:sharedRecipeId", authenticate, sharedRecipeController.deleteSharedRecipe);

export default router;