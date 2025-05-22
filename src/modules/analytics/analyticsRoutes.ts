import { Router } from "express";
import analyticsController from "./analyticsController";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: >
 *       API for retrieving analytics and statistics
 */

/**
 * @swagger
 * /api/analytics/popular-ingredients:
 *   get:
 *     summary: Get the most popular added ingredients
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: List of popular ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   count:
 *                     type: number
 */
router.get("/popular-ingredients", analyticsController.getPopularIngredients);

/**
 * @swagger
 * /api/analytics/popular-groceries:
 *   get:
 *     summary: Get the most popular added groceries
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: List of popular groceries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   count:
 *                     type: number
 */
router.get("/popular-groceries", analyticsController.getPopularGroceries);

/**
 * @swagger
 * /api/analytics/popular-recipes:
 *   get:
 *     summary: Get the most popular recipes
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: List of popular recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   count:
 *                     type: number
 */
router.get("/popular-recipes", analyticsController.getPopularRecipes);

/**
 * @swagger
 * /api/analytics/active-users:
 *   get:
 *     summary: Get the most active users
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: List of active users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   actions:
 *                     type: number
 */
router.get("/active-users", analyticsController.getActiveUsers);

/**
 * @swagger
 * /api/analytics/ingredient-trends:
 *   get:
 *     summary: Get ingredient addition trends over time
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, month]
 *         description: Time interval for trends (default is day)
 *     responses:
 *       200:
 *         description: Ingredient trends over time
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                   count:
 *                     type: number
 */
router.get("/ingredient-trends", analyticsController.getIngredientTrends);

/**
 * @swagger
 * /api/analytics/errors:
 *   get:
 *     summary: Get error statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Error statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalErrors:
 *                   type: number
 *                 last24h:
 *                   type: number
 *                 byType:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 */
router.get("/errors", analyticsController.getErrorStats);

export default router;