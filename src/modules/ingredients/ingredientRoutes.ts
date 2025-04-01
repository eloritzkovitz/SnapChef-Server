import express from "express";
import { handleRecognition } from "./ingredientController";
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
router.post("/recognize/photo", upload.single("file"), (req, res) =>
  handleRecognition(req, res, "photo")
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
router.post("/recognize/receipt", upload.single("file"), (req, res) =>
  handleRecognition(req, res, "receipt")
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
router.post("/recognize/barcode", upload.single("file"), (req, res) =>
  handleRecognition(req, res, "barcode")
);

export default router;
