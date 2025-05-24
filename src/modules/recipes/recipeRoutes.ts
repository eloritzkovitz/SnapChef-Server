import express from 'express';
import { generateRecipe, generateRecipeImage } from './recipeController';
import { authenticate } from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: API for generating recipes using user input and preferences
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - mealType
 *         - cuisineType
 *         - difficulty
 *         - prepTime
 *         - cookingTime
 *         - ingredients
 *         - instructions
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the recipe
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         mealType:
 *           type: string
 *         cuisineType:
 *           type: string
 *         difficulty:
 *           type: string
 *         prepTime:
 *           type: number
 *         cookingTime:
 *           type: number
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *         instructions:
 *           type: string
 *         imageURL:
 *           type: string
 *         rating:
 *           type: number
 *           nullable: true
 *       example:
 *         _id: "abc123"
 *         title: "Spaghetti Bolognese"
 *         description: "A classic Italian pasta dish."
 *         mealType: "Dinner"
 *         cuisineType: "Italian"
 *         difficulty: "Medium"
 *         prepTime: 15
 *         cookingTime: 45
 *         ingredients:
 *           - "spaghetti"
 *           - "ground beef"
 *           - "tomato sauce"
 *         instructions: "1. Boil the spaghetti. 2. Cook the beef. 3. Mix with sauce."
 *         imageURL: "https://example.com/spaghetti.jpg"
 *         rating: 4.5
 */

/**
 * @swagger
 * /api/recipes/generation:
 *   post:
 *     summary: Generate a recipe based on ingredients and preferences
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
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
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/spaghetti_bolognese_123456789.jpg"
 *       400:
 *         description: Invalid input or generation error
 */
router.post('/generation', authenticate, generateRecipe);

/**
 * @swagger
 * /api/recipes/generation/image:
 *   post:
 *     summary: Generate an image for a recipe
 *     tags: [Recipes]
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
 *                 example: "Spaghetti Bolognese"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["spaghetti", "ground beef", "tomato sauce"]
 *     responses:
 *       200:
 *         description: Successfully generated an image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/spaghetti_bolognese_123456789.jpg"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Failed to generate image
 */
router.post('/generation/image', authenticate, generateRecipeImage);

export default router;