import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { HeadType } from '../../shared/types.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ISalaryHead extends Document {
  name: string;          // "Salary Head Name" — human label, e.g. "BASIC"
  printName: string;     // Appears on payslips; often a short version
  headType: HeadType;    // addition | deduction
  displayOrder: number;  // "Order" column on the list
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const salaryHeadSchema = new Schema<ISalaryHead>(
  {
    name: {
      type: String,
      required: [true, 'Salary Head name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    printName: {
      type: String,
      required: [true, 'Print name is required'],
      trim: true,
      maxlength: [50, 'Print name cannot exceed 50 characters'],
    },
    headType: {
      type: String,
      enum: Object.values(HeadType),
      required: [true, 'Head Type is required'],
      default: HeadType.ADDITION,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

salaryHeadSchema.index({ name: 1, company: 1 }, { unique: true });
salaryHeadSchema.index({ isActive: 1 });
salaryHeadSchema.index({ headType: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const SalaryHead: Model<ISalaryHead> = mongoose.model<ISalaryHead>('SalaryHead', salaryHeadSchema);

export default SalaryHead;
