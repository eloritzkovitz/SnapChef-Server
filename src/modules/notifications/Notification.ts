import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'expiry' | 'grocery' | 'notice' | 'friend' | 'share' | 'update';

export interface INotification extends Document {
  recipientId: string;
  senderId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  ingredientName?: string;
  scheduledTime?: Date;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipientId: { type: String, required: true },
  senderId: { type: String, required: true },
  type: { type: String, enum: ['expiry', 'grocery', 'notice', 'friend', 'share', 'update'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  ingredientName: { type: String },
  scheduledTime: { type: Date },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);