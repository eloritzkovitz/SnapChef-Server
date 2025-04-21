import express from 'express';
import logController from '../logs/logController';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// You might want to add an admin check middleware here
router.get('/', authMiddleware, logController.getLogs);

export default router;