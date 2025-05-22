import Notification from './Notification';
import logger from '../../utils/logger';

export const deleteExpiredReminders = async () => {
  const now = new Date();
  const result = await Notification.deleteMany({
    type: { $in: ['expiry', 'grocery'] },
    scheduledTime: { $lt: now }
  });
  logger.info('Deleted %d expired reminders', result.deletedCount);
};