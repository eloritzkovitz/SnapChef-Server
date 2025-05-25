import express from "express";
import recognitionController from "./recognitionController";
import upload from "../../middlewares/upload";
import { authenticate } from "../../middlewares/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ingredient Recognition
 *   description: API for recognizing ingredients from images, receipts, or barcodes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RecognizedIngredient:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the recognized ingredient
 *         category:
 *           type: string
 *           description: Category of the ingredient
 *         confidence:
 *           type: number
 *           format: float
 *           description: Confidence score (0-1) for the recognition
 *         imageURL:
 *           type: string
 *           description: URL of the recognized ingredient image (if available)
 *       example:
 *         name: "Tomato"
 *         category: "Vegetable"
 *         confidence: 0.98
 *         imageURL: "https://example.com/images/tomato.jpg"
 *     BarcodeRequest:
 *       type: object
 *       properties:
 *         barcode:
 *           type: string
 *           description: Barcode string to recognize
 *       required:
 *         - barcode
 */

/**
 * @swagger
 * /api/ingredients/recognition/photo:
 *   post:
 *     summary: Recognize ingredients from a photo
 *     tags: [Ingredient Recognition]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecognizedIngredient'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to recognize image
 */
router.post("/photo", authenticate, upload.single("file"), (req, res) => recognitionController.recognize(req, res, "photo"));

/**
 * @swagger
 * /api/ingredients/recognition/receipt:
 *   post:
 *     summary: Recognize ingredients from a receipt image
 *     tags: [Ingredient Recognition]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecognizedIngredient'
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to recognize image
 */
router.post("/receipt", authenticate, upload.single("file"), (req, res) => recognitionController.recognize(req, res, "receipt"));

/**
 * @swagger
 * /api/ingredients/recognition/barcode:
 *   post:
 *     summary: Recognize ingredients from a barcode string
 *     tags: [Ingredient Recognition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BarcodeRequest'
 *     responses:
 *       200:
 *         description: Recognized ingredients from barcode
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecognizedIngredient'
 *       400:
 *         description: No barcode provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to recognize barcode
 */
router.post("/barcode", authenticate, (req, res) => recognitionController.recognize(req, res, "barcode"));

export default router;