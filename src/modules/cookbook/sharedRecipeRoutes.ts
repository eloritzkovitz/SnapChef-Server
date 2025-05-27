import express from "express";
import { authenticate } from "../../middlewares/auth";
import sharedRecipeController from "./sharedRecipeController";

const router = express.Router();

/**
 * @swagger
 * /api/cookbook/{cookbookId}/shared:
 *   get:
 *     summary: Get recipes shared with the authenticated
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
 *         description: List of shared recipes for the user and cookbook
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
 *   patch:
 *     summary: Update the status of a shared recipe
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, viewed, imported]
 *     responses:
 *       200:
 *         description: Shared recipe status updated
 *       404:
 *         description: Shared recipe not found
 *       500:
 *         description: Failed to update shared recipe
 */
router.patch("/:cookbookId/shared/:sharedRecipeId", authenticate, sharedRecipeController.updateSharedRecipeStatus);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/shared/{sharedRecipeId}:
 *   delete:
 *     summary: Remove a shared recipe from the user's shared list
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