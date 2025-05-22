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
 */
router.get("/", authenticate, groceriesController.getGroceriesList);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries:
 *   post:
 *     summary: Add a new item to the groceries list
 *     tags: [Groceries]
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
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               imageURL:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added to groceries list successfully
 */
router.post("/", authenticate, groceriesController.addGroceryItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/{itemId}:
 *   put:
 *     summary: Update an item in the groceries list
 *     tags: [Groceries]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               imageURL:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item updated successfully in groceries list
 */
router.put("/:itemId", authenticate, groceriesController.updateGroceryItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/{itemId}:
 *   delete:
 *     summary: Delete an item from the groceries list
 *     tags: [Fridge]
 *     parameters:
 *       - in: path
 *         name: id
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