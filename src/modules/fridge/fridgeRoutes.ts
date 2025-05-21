import express from "express";
import fridgeController from "./fridgeController";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fridge
 *   description: API for managing fridge items
 */

/**
 * @swagger
 * /api/fridge:
 *   post:
 *     summary: Create a new fridge for a user
 *     tags: [Fridge]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fridge created successfully
 */
// Create a new fridge
router.post("/", authMiddleware, fridgeController.createFridge);

/**
 * @swagger
 * /api/fridge/{id}:
 *   get:
 *     summary: Get all items in a fridge
 *     tags: [Fridge]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fridge ID
 *     responses:
 *       200:
 *         description: List of fridge items
 */
// Get fridge content
router.get("/:fridgeId/items", authMiddleware, fridgeController.getFridgeContent);

/**
 * @swagger
 * /api/fridge/{id}/items:
 *   post:
 *     summary: Add a new item to the fridge
 *     tags: [Fridge]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               quantity:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               imageURL:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added successfully
 */
// Add a new item to the fridge
router.post("/:fridgeId/items", authMiddleware, fridgeController.addFridgeItem);

/**
 * @swagger
 * /api/fridge/{id}/items/{itemId}:
 *   put:
 *     summary: Update an item in the fridge
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
 *               quantity:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               imageURL:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
// Update an item in the fridge
router.put("/:fridgeId/items/:itemId", authMiddleware, fridgeController.updateFridgeItem);

/**
 * @swagger
 * /api/fridge/{id}/items/{itemId}:
 *   delete:
 *     summary: Delete an item from the fridge
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
 *         description: Item deleted successfully
 */
// Delete an item from the fridge
router.delete("/:fridgeId/items/:itemId", authMiddleware, fridgeController.deleteFridgeItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries:
 *   get:
 *     summary: Get all items in the groceries list
 *     tags: [Fridge]
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
router.get("/:fridgeId/groceries", authMiddleware, fridgeController.getGroceriesList);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries:
 *   post:
 *     summary: Add a new item to the groceries list
 *     tags: [Fridge]
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
router.post("/:fridgeId/groceries", authMiddleware, fridgeController.addGroceryItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/groceries/{itemId}:
 *   put:
 *     summary: Update an item in the groceries list
 *     tags: [Fridge]
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
router.put("/:fridgeId/groceries/:itemId", authMiddleware, fridgeController.updateGroceryItem);

/**
 * @swagger
 * /api/fridge/{id}/groceries/{itemId}:
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
router.delete("/:fridgeId/groceries/:itemId", authMiddleware, fridgeController.deleteGroceryItem);

export default router;