import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'friend' | 'share' | 'update';

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['friend', 'share', 'update'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);