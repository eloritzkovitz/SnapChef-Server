import LogModel, { ILog } from '../modules/logs/Log';

export const logActivity = async (
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
): Promise<ILog> => {
  try {
    if (!userId) {
      throw new Error('userId is required for logging');
    }
    
    const log = new LogModel({
      userId,
      action,
      entityType,
      entityId,
      details
    });
    
    return await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};