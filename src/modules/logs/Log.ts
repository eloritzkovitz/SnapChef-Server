import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: any;
  createdAt: Date;
}

const LogSchema: Schema = new Schema(
  {
    action: { type: String, required: true }, // e.g., 'add', 'update', 'delete'
    entityType: { type: String, required: true }, // e.g., 'fridge', 'ingredient'
    entityId: { type: Schema.Types.ObjectId }, // ID of the affected entity
    userId: { type: Schema.Types.ObjectId }, // User who performed the action
    details: { type: Schema.Types.Mixed }, // Any additional details
    createdAt: { type: Date, default: Date.now }
  }
);

export default mongoose.model<ILog>('Logs', LogSchema);