import express from "express";
import ingredientController from "./ingredientController";
import upload from "../../middleware/upload";

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
router.post("/recognize/photo", upload.single("file"), (req, res) =>  ingredientController.recognize(req, res, "photo")
);

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
router.post("/recognize/receipt", upload.single("file"), (req, res) => ingredientController.recognize(req, res, "receipt")
);
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
router.post("/recognize/barcode", upload.single("file"), (req, res) => ingredientController.recognize(req, res, "barcode")
);

router.get("/", (req, res) => {
  // Check if query parameters are provided
  if (Object.keys(req.query).length > 0) {
    ingredientController.getIngredientsByQuery(req, res); // Handle query-based search
  } else {
    ingredientController.getAllIngredients(req, res); // Handle fetching all ingredients
  }
});

router.get("/:id", (req, res) => ingredientController.getIngredientById(req, res));

export default router;
