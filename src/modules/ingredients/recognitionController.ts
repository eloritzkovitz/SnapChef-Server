import { Request, Response } from 'express';
import fs from 'fs/promises';
import { recognizePhoto, recognizeReceipt, recognizeBarcode } from './imageRecognition';
import logger from '../../utils/logger';
import { getUserId } from '../../utils/requestHelpers';

// Handle ingredient recognition
export const recognize = async (req: Request, res: Response, type: string): Promise<void> => {
  const userId = getUserId(req); // <-- Get userId for logging
  logger.info(`Received POST request at /recognize/${type} (user: ${userId})`);
  try {
    let result;

    // For barcode: expect a barcode string in the request body
    if (type === 'barcode') {      
      const barcode = req.body.barcode;
      if (!barcode) {
        logger.warn('No barcode provided for barcode recognition (user: %s)', userId);
        res.status(400).json({ error: 'No barcode provided.' });
        return;
      }
      result = await recognizeBarcode(barcode);
      logger.info('Barcode recognized: %s, ingredients: %j (user: %s)', barcode, result, userId);
      res.json(result);
      return;
    }

    // For photo/receipt: expect image file
    const file = req.file;
    if (!file) {
      logger.warn('No file uploaded for %s recognition (user: %s)', type, userId);
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    try {
      switch (type) {
        case 'photo':
          result = await recognizePhoto(file.path);
          logger.info('Photo recognized: %s, ingredients: %j (user: %s)', file.path, result, userId);
          break;
        case 'receipt':
          result = await recognizeReceipt(file.path);
          logger.info('Receipt recognized: %s, ingredients: %j (user: %s)', file.path, result, userId);
          break;
        default:
          res.status(400).json({ error: 'Invalid recognition type.' });
          return;
      }
      res.json(result);
    } finally {
      // Delete the file after processing
      await fs.unlink(file.path).catch((err) => {
        logger.error('Error deleting file %s: %o (user: %s)', file.path, err, userId);
      });
    }
  } catch (error) {
    logger.error('Error recognizing %s (user: %s): %o', type, userId, error);
    res.status(500).json({ error: 'Failed to recognize image.' });
  }
};

export default {
  recognize,  
};