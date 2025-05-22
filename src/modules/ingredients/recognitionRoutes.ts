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
 * /api/ingredients/recognize/photo:
 *   post:
 *     summary: Recognize ingredients from a photo
 *     tags: [Ingredient Recognition]
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
router.post("/recognize/photo", authenticate, upload.single("file"), (req, res) =>  recognitionController.recognize(req, res, "photo"));

/**
 * @swagger
 * /api/ingredients/recognize/receipt:
 *   post:
 *     summary: Recognize ingredients from a receipt image
 *     tags: [Ingredient Recognition]
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
router.post("/recognize/receipt", authenticate, upload.single("file"), (req, res) => recognitionController.recognize(req, res, "receipt"));

/**
 * @swagger
 * /api/ingredients/recognize/barcode:
 *   post:
 *     summary: Recognize ingredients from a barcode image
 *     tags: [Ingredient Recognition]
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
router.post("/recognize/barcode", authenticate, (req, res) => recognitionController.recognize(req, res, "barcode"));

export default router;