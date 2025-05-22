import express from "express";
import ingredientController from "./ingredientController";
import upload from "../../middleware/upload";
import { authenticate } from "../../middleware/auth";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Ingredients
 *   description: API for recognizing ingredients from images, receipts or barcodes
 */

/**
 * @swagger
 * /api/ingredients/recognize/photo:
 *   post:
 *     summary: Recognize ingredients from a photo
 *     tags: [Ingredients]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to analyze
 *     responses:
 *       200:
 *         description: Recognized ingredients from photo
 */
// Define routes
router.post("/recognize/photo", authenticate, upload.single("file"), (req, res) =>  ingredientController.recognize(req, res, "photo"));

/**
 * @swagger
 * /api/ingredients/recognize/receipt:
 *   post:
 *     summary: Recognize ingredients from a receipt image
 *     tags: [Ingredients]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file of a receipt
 *     responses:
 *       200:
 *         description: Recognized ingredients from receipt
 */
router.post("/recognize/receipt", authenticate, upload.single("file"), (req, res) => ingredientController.recognize(req, res, "receipt"));

/**
 * @swagger
 * /api/ingredients/recognize/barcode:
 *   post:
 *     summary: Recognize ingredients from a barcode image
 *     tags: [Ingredients]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file of a barcode
 *     responses:
 *       200:
 *         description: Recognized ingredients from barcode
 */
router.post("/recognize/barcode", authenticate, (req, res) => ingredientController.recognize(req, res, "barcode"));

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Get all ingredients or search by query
 *     tags: [Ingredients]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search ingredients by name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Search ingredients by category
 *     responses:
 *       200:
 *         description: A list of ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ingredient'
 */
router.get("/", (req, res) => {
  // Check if query parameters are provided
  if (Object.keys(req.query).length > 0) {
    ingredientController.getIngredientsByQuery(req, res); // Handle query-based search
  } else {
    ingredientController.getAllIngredients(req, res); // Handle fetching all ingredients
  }
});

/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     summary: Get an ingredient by ID
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ingredient
 *     responses:
 *       200:
 *         description: The ingredient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *       404:
 *         description: Ingredient not found
 */
router.get("/:id", (req, res) => ingredientController.getIngredientById(req, res));

/**
 * @swagger
 * /api/ingredients/add:
 *   post:
 *     summary: Add a new ingredient
 *     tags: [Ingredients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique identifier for the ingredient
 *               name:
 *                 type: string
 *                 description: Name of the ingredient
 *               category:
 *                 type: string
 *                 description: Category of the ingredient
 *     responses:
 *       200:
 *         description: Ingredient added successfully
 *       400:
 *         description: Ingredient with the same ID already exists
 *       500:
 *         description: Error adding ingredient
 */
router.post("/add", authenticate, (req, res) => ingredientController.addIngredient(req, res));

/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     summary: Edit an existing ingredient
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ingredient to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name of the ingredient
 *               category:
 *                 type: string
 *                 description: New category of the ingredient
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Ingredient not found
 *       500:
 *         description: Error editing ingredient
 */
router.put("/:id", authenticate, (req, res) => ingredientController.editIngredient(req, res));

/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     summary: Delete an ingredient
 *     tags: [Ingredients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ingredient to delete
 *     responses:
 *       200:
 *         description: Ingredient deleted successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Ingredient not found
 *       500:
 *         description: Error deleting ingredient
 */
router.delete("/:id", authenticate, (req, res) => ingredientController.deleteIngredient(req, res));

export default router;