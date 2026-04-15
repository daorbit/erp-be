import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { DeductionType } from '../../shared/types.js';

export interface ITdsExemption extends Document {
  name: string;                  // "Exemption Name"
  group?: mongoose.Types.ObjectId; // ref TdsGroup
  maxLimit: number;              // "Max. Limit in Curr year"
  deductionType: DeductionType;  // "Deduction Type"
  salaryHeadMap?: mongoose.Types.ObjectId; // ref SalaryHead
  autoExemptedAmountDefineInCurrentYear: boolean;
  isAutoExempted: boolean;
  hraCalculation: boolean;
  hideInCurrentYear: boolean;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITdsExemption>(
  {
    name: { type: String, required: [true, 'Exemption Name is required'], trim: true, maxlength: 150 },
    group: { type: Schema.Types.ObjectId, ref: 'TdsGroup' },
    maxLimit: { type: Number, default: 0, min: 0 },
    deductionType: {
      type: String,
      enum: Object.values(DeductionType),
      required: [true, 'Deduction Type is required'],
      default: DeductionType.DEDUCTION_UNDER_CHAPTER_VI_A,
    },
    salaryHeadMap: { type: Schema.Types.ObjectId, ref: 'SalaryHead' },
    autoExemptedAmountDefineInCurrentYear: { type: Boolean, default: false },
    isAutoExempted: { type: Boolean, default: false },
    hraCalculation: { type: Boolean, default: false },
    hideInCurrentYear: { type: Boolean, default: false },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });

const TdsExemption: Model<ITdsExemption> = mongoose.model<ITdsExemption>('TdsExemption', schema);
export default TdsExemption;
