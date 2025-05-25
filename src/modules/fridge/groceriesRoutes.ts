import express from "express";
import groceriesController from "./groceriesController";
import { authenticate } from "../../middlewares/auth";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Groceries
 *   description: API for managing groceries
 */

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries:
 *   get:
 *     summary: Get all items in the groceries list
 *     tags: [Groceries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fridgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *     responses:
 *       200:
 *         description: List of grocery items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ingredient'
 */
router.get("/", authenticate, groceriesController.getGroceriesList);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries:
 *   post:
 *     summary: Add a new item to the groceries list
 *     tags: [Groceries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fridgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ingredient'
 *     responses:
 *       201:
 *         description: Item added to groceries list successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 */
router.post("/", authenticate, groceriesController.addGroceryItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/{itemId}:
 *   put:
 *     summary: Update an item in the groceries list
 *     tags: [Groceries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fridgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ingredient'
 *     responses:
 *       200:
 *         description: Item updated successfully in groceries list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 */
router.put("/:itemId", authenticate, groceriesController.updateGroceryItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/reorder:
 *   post:
 *     summary: Reorder groceries in a fridge
 *     tags: [Groceries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fridgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedItemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["itemId1", "itemId2", "itemId3"]
 *                 description: Array of grocery item IDs in the desired order
 *     responses:
 *       200:
 *         description: Groceries reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Groceries reordered
 *                 groceries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ingredient'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Fridge not found
 *       500:
 *         description: Failed to reorder groceries
 */
router.post("/reorder", authenticate, groceriesController.reorderGroceries);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/{itemId}:
 *   delete:
 *     summary: Delete an item from the groceries list
 *     tags: [Groceries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fridgeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted from groceries list successfully
 */
router.delete("/:itemId", authenticate, groceriesController.deleteGroceryItem);

export default router;