import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILeaveFinyear extends Document {
  dateFrom: Date;
  dateTo: Date;
  label: string;         // e.g. "2024-2025" — derived from year range for display
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ILeaveFinyear>(
  {
    dateFrom: { type: Date, required: [true, 'Date From is required'] },
    dateTo: { type: Date, required: [true, 'Date To is required'] },
    label: { type: String, trim: true, maxlength: 30 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);

// Auto-derive label from dates if caller didn't supply one.
schema.pre('save', function (next) {
  if (!this.label && this.dateFrom && this.dateTo) {
    this.label = `${this.dateFrom.getFullYear()}-${this.dateTo.getFullYear()}`;
  }
  next();
});

schema.index({ dateFrom: 1, dateTo: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const LeaveFinyear: Model<ILeaveFinyear> = mongoose.model<ILeaveFinyear>('LeaveFinyear', schema);
export default LeaveFinyear;
