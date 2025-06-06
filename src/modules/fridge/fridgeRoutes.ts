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
 *     security:
 *       - bearerAuth: []
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
router.post("/", authenticate, fridgeController.createFridge);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items:
 *   get:
 *     summary: Get all items in a fridge
 *     tags: [Fridge]
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
 *         description: List of fridge items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ingredient'
 */
router.get("/:fridgeId/items", authenticate, fridgeController.getFridgeContent);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items:
 *   post:
 *     summary: Add a new item to the fridge
 *     tags: [Fridge]
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
 *         description: Item added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 */
router.post("/:fridgeId/items", authenticate, fridgeController.addFridgeItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items/{itemId}:
 *   put:
 *     summary: Update an item in the fridge
 *     tags: [Fridge]
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
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 */
router.put("/:fridgeId/items/:itemId", authenticate, fridgeController.updateFridgeItem);

/**
 * @swagger
 * /api/fridge/{fridgeId}/ingredients/{itemId}/image:
 *   patch:
 *     summary: Update the imageURL of a fridge ingredient
 *     tags: [Fridge]
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
 *         description: Ingredient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageURL:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *     responses:
 *       200:
 *         description: Ingredient image updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Fridge or ingredient not found
 */
router.patch("/:fridgeId/items/:itemId/image", authenticate, fridgeController.updateFridgeItemImage);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items/reorder:
 *   patch:
 *     summary: Reorder items in a fridge
 *     tags: [Fridge]
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
 *                 description: Array of item IDs in the desired order
 *     responses:
 *       200:
 *         description: Fridge items reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fridge items reordered
 *                 fridge:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Fridge not found
 *       500:
 *         description: Failed to reorder fridge items
 */
router.patch("/:fridgeId/items/reorder", authenticate, fridgeController.reorderFridgeItems);

/**
 * @swagger
 * /api/fridge/{fridgeId}/items/{itemId}:
 *   delete:
 *     summary: Delete an item from the fridge
 *     tags: [Fridge]
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
 *         description: Item deleted successfully
 */
router.delete("/:fridgeId/items/:itemId", authenticate, fridgeController.deleteFridgeItem);

export default router;