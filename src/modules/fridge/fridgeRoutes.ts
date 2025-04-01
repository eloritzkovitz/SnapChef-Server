import express from "express";
import {
  addItem,
  getItems,
  searchItems,
  updateItem,
  deleteItem,
} from "./fridgeController";

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
 *     summary: Add a new item to the fridge
 *     tags: [Fridge]
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

// Add new item
router.post("/", addItem);

/**
 * @swagger
 * /api/fridge:
 *   get:
 *     summary: Get all fridge items
 *     tags: [Fridge]
 *     responses:
 *       200:
 *         description: List of fridge items
 */
// Get all items / filter by category
router.get("/", getItems);

/**
 * @swagger
 * /api/fridge/search:
 *   get:
 *     summary: Search fridge items by name
 *     tags: [Fridge]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name to search
 *     responses:
 *       200:
 *         description: Filtered fridge items
 */

// Search items by name
router.get("/search", searchItems);
/**
 * @swagger
 * /api/fridge/{id}:
 *   put:
 *     summary: Update a fridge item by ID
 *     tags: [Fridge]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Item updated successfully
 */

// Update item by ID
router.put("/:id", updateItem);


/**
 * @swagger
 * /api/fridge/{id}:
 *   delete:
 *     summary: Delete a fridge item by ID
 *     tags: [Fridge]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 */
// Delete item by ID
router.delete("/:id", deleteItem);

export default router;
