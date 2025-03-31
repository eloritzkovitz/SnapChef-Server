import express from 'express';
import { handleRecognition } from './ingredientController';
import upload from '../../middleware/upload';

const router = express.Router();

// Define routes
router.post('/recognize/photo', upload.single('file'), (req, res) => handleRecognition(req, res, 'photo'));
router.post('/recognize/receipt', upload.single('file'), (req, res) => handleRecognition(req, res, 'receipt'));
router.post('/recognize/barcode', upload.single('file'), (req, res) => handleRecognition(req, res, 'barcode'));

export default router;