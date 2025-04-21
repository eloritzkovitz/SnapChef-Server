// src/modules/logs/logController.ts
import { Request, Response } from 'express';
import LogModel from './Log';

// Get logs with pagination
const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    
    // Apply filters if provided
    if (req.query.entityType) filter.entityType = req.query.entityType;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.userId = req.query.userId;
    
    const logs = await LogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');
    
    const total = await LogModel.countDocuments(filter);
    
    res.status(200).json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs', error: (error as Error).message });
  }
};

export default {
  getLogs
};