import { Router } from "express";
import analyticsController from "./analyticsController";
import { authenticate, requireAdmin } from "../../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: >
 *       API for retrieving analytics and statistics for the admin dashboard.
 */

/**
 * @swagger
 * /api/analytics/popular-ingredients:
 *   get:
 *     summary: Get the most popular added ingredients
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
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
router.get("/popular-ingredients", authenticate, requireAdmin, analyticsController.getPopularIngredients);

/**
 * @swagger
 * /api/analytics/popular-groceries:
 *   get:
 *     summary: Get the most popular added groceries
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
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
router.get("/popular-groceries", authenticate, requireAdmin, analyticsController.getPopularGroceries);

/**
 * @swagger
 * /api/analytics/active-users:
 *   get:
 *     summary: Get the most active users
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Time period for activity (default is daily)
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
router.get("/active-users", authenticate, requireAdmin, analyticsController.getActiveUsers);

/**
 * @swagger
 * /api/analytics/ingredient-trends:
 *   get:
 *     summary: Get ingredient addition trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
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
router.get("/ingredient-trends", authenticate, requireAdmin, analyticsController.getIngredientTrends);

/**
 * @swagger
 * /api/analytics/errors:
 *   get:
 *     summary: Get error statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
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
router.get("/errors", authenticate, requireAdmin, analyticsController.getErrorStats);

/**
 * @swagger
 * /api/analytics/logs/errors:
 *   get:
 *     summary: Get recent error logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return (default 100)
 *     responses:
 *       200:
 *         description: List of error logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/logs/errors", authenticate, requireAdmin, analyticsController.getErrors);

/**
 * @swagger
 * /api/analytics/logs/warnings:
 *   get:
 *     summary: Get recent warning logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return (default 100)
 *     responses:
 *       200:
 *         description: List of warning logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/logs/warnings", authenticate, requireAdmin, analyticsController.getWarnings);

/**
 * @swagger
 * /api/analytics/logs/info:
 *   get:
 *     summary: Get recent info logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return (default 100)
 *     responses:
 *       200:
 *         description: List of info logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/logs/info", authenticate, requireAdmin, analyticsController.getInfo);

/**
 * @swagger
 * /api/analytics/logs:
 *   get:
 *     summary: Get recent logs (all levels)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of logs to return (default 100)
 *     responses:
 *       200:
 *         description: List of logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/logs", authenticate, requireAdmin, analyticsController.getLogs);

/**
 * @swagger
 * /api/analytics/dashboard-summary:
 *   get:
 *     summary: Get a summary for the admin dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popularIngredients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: number
 *                 popularGroceries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: number
 *                 errorStats:
 *                   type: object
 *                   properties:
 *                     totalErrors:
 *                       type: number
 *                     last24h:
 *                       type: number
 *                     byType:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                 activeUsers:
 *                   type: number
 */
router.get("/dashboard-summary", authenticate, requireAdmin, analyticsController.getDashboardSummary);

export default router;