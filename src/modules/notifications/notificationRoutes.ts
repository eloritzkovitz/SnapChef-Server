import express from 'express';
import { createNotification } from './notificationController';

const router = express.Router();

router.post('/', createNotification);

export default router;