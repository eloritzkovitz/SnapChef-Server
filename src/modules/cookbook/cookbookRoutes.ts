import express from "express";
import cookbookController from "./cookbookController";
import { authenticate } from "../../middlewares/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cookbook
 *   description: API for managing saved recipes
 */

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes:
 *   post:
 *     summary: Add a recipe to the cookbook
 *     tags: [Cookbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cookbook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Recipe added to the cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 */
router.post("/:cookbookId/recipes", authenticate, cookbookController.addRecipe);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/{recipeId}:
 *   put:
 *     summary: Update a recipe in the cookbook
 *     tags: [Cookbook]
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
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Recipe updated in the cookbook
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 */
router.put("/:cookbookId/recipes/:recipeId", authenticate, cookbookController.updateRecipe);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/{recipeId}/image:
 *   post:
 *     summary: Generate or update an image for a recipe in the cookbook
 *     tags: [Cookbook]
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
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "A vibrant photo of vegan chili"
 *                 description: Optional custom prompt for image generation
 *     responses:
 *       200:
 *         description: Successfully generated or updated the image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/vegan_chili_123456789.jpg"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Failed to generate image
 */
router.post("/:cookbookId/recipes/:recipeId/image", authenticate, cookbookController.regenerateRecipeImage);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/reorder:
 *   post:
 *     summary: Reorder recipes in a cookbook
 *     tags: [Cookbook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cookbookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the cookbook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedRecipeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["recipeId1", "recipeId2", "recipeId3"]
 *                 description: Array of recipe IDs in the desired order
 *     responses:
 *       200:
 *         description: Recipes reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipes reordered
 *                 cookbook:
 *                   $ref: '#/components/schemas/Cookbook'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Cookbook not found
 *       500:
 *         description: Failed to reorder recipes
 */
router.post("/:cookbookId/recipes/reorder", authenticate, cookbookController.reorderRecipes);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/{recipeId}:
 *   delete:
 *     summary: Remove a recipe from the cookbook
 *     tags: [Cookbook]
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
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe
 *     responses:
 *       200:
 *         description: Recipe removed from the cookbook
 */
router.delete("/:cookbookId/recipes/:recipeId", authenticate, cookbookController.removeRecipe);

/**
 * @swagger
 * /api/cookbook/{cookbookId}:
 *   get:
 *     summary: Get a cookbook with all recipes
 *     tags: [Cookbook]
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
 *         description: The cookbook with all recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cookbook:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     ownerId:
 *                       type: string
 *                     recipes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recipe'
 */
router.get("/:cookbookId", authenticate, cookbookController.getCookbookContent);

export default router;