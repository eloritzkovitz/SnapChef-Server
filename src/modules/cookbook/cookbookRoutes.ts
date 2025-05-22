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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               mealType:
 *                 type: string
 *               cuisineType:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               cookingTime:
 *                 type: number
 *               prepTime:
 *                 type: number
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageURL:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recipe added to the cookbook
 */
router.post("/:cookbookId/recipes", authenticate, cookbookController.addRecipe);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/{recipeId}:
 *   put:
 *     summary: Update a recipe in the cookbook
 *     tags: [Cookbook]
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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               mealType:
 *                 type: string
 *               cuisineType:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               cookingTime:
 *                 type: number
 *               prepTime:
 *                 type: number
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageURL:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recipe updated in the cookbook
 */
router.put("/:cookbookId/recipes/:recipeId", authenticate, cookbookController.updateRecipe);

/**
 * @swagger
 * /api/cookbook/{cookbookId}/recipes/{recipeId}:
 *   delete:
 *     summary: Remove a recipe from the cookbook
 *     tags: [Cookbook]
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
 */
router.get("/:cookbookId", authenticate, cookbookController.getCookbookContent);

export default router;