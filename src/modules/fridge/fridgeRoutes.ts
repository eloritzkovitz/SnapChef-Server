import express from "express";
import fridgeController from "./fridgeController";
import { authenticate } from "../../middlewares/auth";

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
router.post("/", authenticate, fridgeController.createFridge);

/**
 * @swagger
 * /api/fridge/{fridgeId}:
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
router.get("/:fridgeId/items", authenticate, fridgeController.getFridgeContent);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items:
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
router.post("/:fridgeId/items", authenticate, fridgeController.addFridgeItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items/{itemId}:
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
router.put("/:fridgeId/items/:itemId", authenticate, fridgeController.updateFridgeItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items/{itemId}:
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
router.delete("/:fridgeId/items/:itemId", authenticate, fridgeController.deleteFridgeItem);

export default router;