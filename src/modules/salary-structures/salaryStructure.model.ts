import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { CalculationType, PayType } from '../../shared/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// SalaryStructureTemplate — a named, reusable salary template (e.g.
// "STRUCTURE-1"). Attached salary heads live in SalaryStructureHead so heads
// can be added / removed independently.
//
// NAMING: the Mongoose model is `SalaryStructureTemplate` because the legacy
// payroll module already registers a `SalaryStructure` model (per-employee
// salary record). The UI surfaces this as "Salary Structure" — the model
// name collision is the only reason for the `Template` suffix internally.
// ═══════════════════════════════════════════════════════════════════════════

export interface ISalaryStructureTemplate extends Document {
  name: string;          // "Salary Structure" — the template name
  isInactive: boolean;   // "In-Active Salary Structure" checkbox on the form
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const salaryStructureSchema = new Schema<ISalaryStructureTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Salary Structure name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    isInactive: {
      type: Boolean,
      default: false,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
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

salaryStructureSchema.index({ name: 1, company: 1 }, { unique: true });
salaryStructureSchema.index({ isInactive: 1 });

const SalaryStructureTemplate: Model<ISalaryStructureTemplate> =
  mongoose.model<ISalaryStructureTemplate>('SalaryStructureTemplate', salaryStructureSchema);

export default SalaryStructureTemplate;

// ═══════════════════════════════════════════════════════════════════════════
// SalaryStructureHead — links a template to a SalaryHead, plus the attributes
// that determine how this head is computed inside the structure (calculation
// type, pay type, attendance scaling, and PF/NPS/ESI applicability).
// ═══════════════════════════════════════════════════════════════════════════

export interface ISalaryStructureHead extends Document {
  structure: mongoose.Types.ObjectId;  // ref: SalaryStructureTemplate
  salaryHead: mongoose.Types.ObjectId; // ref: SalaryHead
  calculationType: CalculationType;    // lumpsum | formula | fixed_amount | remaining_amount
  payType: PayType;                    // how value scales with attendance
  showOrder: number;
  // PF/NPS/ESI only apply to "Addition" heads per the UI note; we store the
  // flag + percent (0-100) and rely on the UI to enforce applicability.
  pfEnabled: boolean;
  pfPercent: number;
  npsEnabled: boolean;
  npsPercent: number;
  esiEnabled: boolean;
  esiPercent: number;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salaryStructureHeadSchema = new Schema<ISalaryStructureHead>(
  {
    structure: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructureTemplate',
      required: true,
      index: true,
    },
    salaryHead: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryHead',
      required: true,
    },
    calculationType: {
      type: String,
      enum: Object.values(CalculationType),
      default: CalculationType.LUMPSUM,
      required: true,
    },
    payType: {
      type: String,
      enum: Object.values(PayType),
      default: PayType.PAY_DAY_WISE,
      required: true,
    },
    showOrder: { type: Number, default: 0 },
    pfEnabled: { type: Boolean, default: false },
    pfPercent: { type: Number, default: 100, min: 0, max: 100 },
    npsEnabled: { type: Boolean, default: false },
    npsPercent: { type: Number, default: 100, min: 0, max: 100 },
    esiEnabled: { type: Boolean, default: false },
    esiPercent: { type: Number, default: 100, min: 0, max: 100 },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
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

// A salary head can appear at most once per template.
salaryStructureHeadSchema.index({ structure: 1, salaryHead: 1 }, { unique: true });

export const SalaryStructureHead: Model<ISalaryStructureHead> =
  mongoose.model<ISalaryStructureHead>('SalaryStructureHead', salaryStructureHeadSchema);
