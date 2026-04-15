import mongoose, { Schema, type Document, type Model } from 'mongoose';

// "Message From Management" — broadcast to a selected set of employees.
export interface IManageMessage extends Document {
  title: string;
  description: string;
  date: Date;
  isActive: boolean;
  attachmentUrl?: string;
  recipients: mongoose.Types.ObjectId[];  // User IDs the CheckAll/UncheckAll ships
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IManageMessage>(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 5000 },
    date: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    attachmentUrl: { type: String, trim: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ date: -1 });

const ManageMessage: Model<IManageMessage> = mongoose.model<IManageMessage>('ManageMessage', schema);
export default ManageMessage;
