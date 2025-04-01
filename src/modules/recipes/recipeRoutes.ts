import express from 'express';
import { generateRecipe } from './recipeController';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: API for generating recipes using user input and preferences
 */

/**
 * @swagger
 * /api/recipes/generate:
 *   post:
 *     summary: Generate a recipe based on ingredients and preferences
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["chicken", "rice", "tomato"]
 *                 description: List of available ingredients
 *               preferences:
 *                 type: string
 *                 example: "low carb"
 *                 description: Dietary preferences (optional)
 *               category:
 *                 type: string
 *                 example: "main"
 *                 description: Recipe category (e.g., dessert, vegan, etc.)
 *     responses:
 *       200:
 *         description: Successfully generated a recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "Grilled Chicken with Tomato Rice"
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["chicken breast", "rice", "tomato sauce"]
 *                 instructions:
 *                   type: string
 *                   example: "1. Grill the chicken... 2. Cook the rice..."
 *       400:
 *         description: Invalid input or generation error
 */

router.post('/generate', generateRecipe);

export default router;