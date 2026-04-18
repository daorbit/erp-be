import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Pairs of (company, branch) that are subscribed to automatic attendance
// mail/SMS notifications. Separate collection from AttUploadSite so each list
// can be managed independently.
export interface IAttAutoNotification extends Document {
  branch: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAttAutoNotification>(
  {
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: [true, 'Branch is required'] },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ company: 1, branch: 1 }, { unique: true });

const AttAutoNotification: Model<IAttAutoNotification> = mongoose.model<IAttAutoNotification>('AttAutoNotification', schema);
export default AttAutoNotification;
