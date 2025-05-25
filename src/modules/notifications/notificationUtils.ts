import Notification from './Notification';
import logger from '../../utils/logger';

// Delete expired reminders from the database
export const deleteExpiredReminders = async () => {
  const now = new Date();
  const result = await Notification.deleteMany({
    type: { $in: ['expiry', 'grocery'] },
    scheduledTime: { $lt: now }
  });
  if (result.deletedCount && result.deletedCount > 0) {
    logger.info('Deleted %d expired reminders', result.deletedCount);
  }
};