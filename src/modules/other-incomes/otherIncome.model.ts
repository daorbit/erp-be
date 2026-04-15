import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IOtherIncome extends Document {
  name: string;          // "Other Income" on the form
  incomeType: string;    // Free-form categorical type
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IOtherIncome>(
  {
    name: { type: String, required: [true, 'Other Income is required'], trim: true, maxlength: 150 },
    incomeType: { type: String, required: [true, 'Income Type is required'], trim: true, maxlength: 100 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const OtherIncome: Model<IOtherIncome> = mongoose.model<IOtherIncome>('OtherIncome', schema);
export default OtherIncome;
