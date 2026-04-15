import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IBank extends Document {
  name: string;
  currentAccountNo: string;
  address?: string;
  ifscCode?: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IBank>(
  {
    name: { type: String, required: [true, 'Bank Name is required'], trim: true, maxlength: 150 },
    currentAccountNo: { type: String, required: [true, 'Current A/C is required'], trim: true, maxlength: 50 },
    address: { type: String, trim: true, maxlength: 300 },
    ifscCode: { type: String, trim: true, maxlength: 20 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, currentAccountNo: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const Bank: Model<IBank> = mongoose.model<IBank>('Bank', schema);
export default Bank;
