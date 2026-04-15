import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { DeductionType } from '../../shared/types.js';

// Top-level grouping for TDS exemptions — e.g. "DEDUCTIONS ON SECTION 80C",
// "HRA". Each Exemption row (below) pins to one of these groups.
export interface ITdsGroup extends Document {
  name: string;                 // Group Name
  maxLimit?: number;
  displayOrder: number;
  sectionHead: DeductionType;   // "Section Head" dropdown
  applyOnNewRegime: boolean;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITdsGroup>(
  {
    name: { type: String, required: [true, 'Group Name is required'], trim: true, maxlength: 150 },
    maxLimit: { type: Number, min: 0, default: 0 },
    displayOrder: { type: Number, default: 0 },
    sectionHead: {
      type: String,
      enum: Object.values(DeductionType),
      default: DeductionType.DEDUCTION_UNDER_CHAPTER_VI_A,
    },
    applyOnNewRegime: { type: Boolean, default: false },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });

const TdsGroup: Model<ITdsGroup> = mongoose.model<ITdsGroup>('TdsGroup', schema);
export default TdsGroup;
