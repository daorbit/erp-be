import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum PayslipStatus {
  DRAFT = 'Draft',
  GENERATED = 'Generated',
  APPROVED = 'Approved',
  PAID = 'Paid',
}

export enum PaymentMode {
  BANK_TRANSFER = 'BankTransfer',
  CHEQUE = 'Cheque',
  CASH = 'Cash',
}

// ─── SalaryStructure Interface ──────────────────────────────────────────────

export interface ISalaryStructure extends Document {
  employee: mongoose.Types.ObjectId;
  basic: number;
  hra: number;
  da: number;
  specialAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  ctc: number;
  effectiveFrom: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SalaryStructure Schema ─────────────────────────────────────────────────

const salaryStructureSchema = new Schema<ISalaryStructure>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
      unique: true,
    },
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative'],
    },
    hra: {
      type: Number,
      default: 0,
      min: [0, 'HRA cannot be negative'],
    },
    da: {
      type: Number,
      default: 0,
      min: [0, 'DA cannot be negative'],
    },
    specialAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Special allowance cannot be negative'],
    },
    medicalAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative'],
    },
    travelAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Travel allowance cannot be negative'],
    },
    pf: {
      type: Number,
      default: 0,
      min: [0, 'PF cannot be negative'],
    },
    esi: {
      type: Number,
      default: 0,
      min: [0, 'ESI cannot be negative'],
    },
    professionalTax: {
      type: Number,
      default: 0,
      min: [0, 'Professional tax cannot be negative'],
    },
    tds: {
      type: Number,
      default: 0,
      min: [0, 'TDS cannot be negative'],
    },
    otherDeductions: {
      type: Number,
      default: 0,
      min: [0, 'Other deductions cannot be negative'],
    },
    grossSalary: {
      type: Number,
      required: [true, 'Gross salary is required'],
      min: [0, 'Gross salary cannot be negative'],
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: [0, 'Total deductions cannot be negative'],
    },
    netSalary: {
      type: Number,
      required: [true, 'Net salary is required'],
      min: [0, 'Net salary cannot be negative'],
    },
    ctc: {
      type: Number,
      required: [true, 'CTC is required'],
      min: [0, 'CTC cannot be negative'],
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
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
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── SalaryStructure Indexes ────────────────────────────────────────────────

salaryStructureSchema.index({ employee: 1 });
salaryStructureSchema.index({ isActive: 1 });
salaryStructureSchema.index({ effectiveFrom: -1 });

// ─── Payslip Interface ──────────────────────────────────────────────────────

export interface IPayslipEarnings {
  basic: number;
  hra: number;
  da: number;
  specialAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  overtime: number;
  bonus: number;
}

export interface IPayslipDeductions {
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  lop: number;
  otherDeductions: number;
}

export interface IPayslip extends Document {
  employee: mongoose.Types.ObjectId;
  month: number;
  year: number;
  salaryStructure: mongoose.Types.ObjectId;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  earnings: IPayslipEarnings;
  deductions: IPayslipDeductions;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
  paymentDate?: Date;
  paymentMode?: PaymentMode;
  transactionId?: string;
  generatedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Payslip Sub-Schemas ────────────────────────────────────────────────────

const payslipEarningsSchema = new Schema<IPayslipEarnings>(
  {
    basic: { type: Number, default: 0, min: 0 },
    hra: { type: Number, default: 0, min: 0 },
    da: { type: Number, default: 0, min: 0 },
    specialAllowance: { type: Number, default: 0, min: 0 },
    medicalAllowance: { type: Number, default: 0, min: 0 },
    travelAllowance: { type: Number, default: 0, min: 0 },
    overtime: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const payslipDeductionsSchema = new Schema<IPayslipDeductions>(
  {
    pf: { type: Number, default: 0, min: 0 },
    esi: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },
    tds: { type: Number, default: 0, min: 0 },
    lop: { type: Number, default: 0, min: 0 },
    otherDeductions: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// ─── Payslip Schema ─────────────────────────────────────────────────────────

const payslipSchema = new Schema<IPayslip>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be at least 2000'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    salaryStructure: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      required: [true, 'Salary structure is required'],
    },
    workingDays: {
      type: Number,
      required: [true, 'Working days is required'],
      min: [0, 'Working days cannot be negative'],
    },
    presentDays: {
      type: Number,
      required: [true, 'Present days is required'],
      min: [0, 'Present days cannot be negative'],
    },
    lopDays: {
      type: Number,
      default: 0,
      min: [0, 'LOP days cannot be negative'],
    },
    earnings: {
      type: payslipEarningsSchema,
      required: [true, 'Earnings are required'],
    },
    deductions: {
      type: payslipDeductionsSchema,
      required: [true, 'Deductions are required'],
    },
    grossEarnings: {
      type: Number,
      required: [true, 'Gross earnings is required'],
      min: [0, 'Gross earnings cannot be negative'],
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: [0, 'Total deductions cannot be negative'],
    },
    netPay: {
      type: Number,
      required: [true, 'Net pay is required'],
      min: [0, 'Net pay cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PayslipStatus),
      default: PayslipStatus.DRAFT,
    },
    paymentDate: {
      type: Date,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PaymentMode),
    },
    transactionId: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Payslip Indexes ────────────────────────────────────────────────────────

payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payslipSchema.index({ employee: 1, year: 1 });
payslipSchema.index({ status: 1 });
payslipSchema.index({ year: 1, month: 1 });

// ─── Models ─────────────────────────────────────────────────────────────────

const SalaryStructure: Model<ISalaryStructure> = mongoose.model<ISalaryStructure>(
  'SalaryStructure',
  salaryStructureSchema,
);

const Payslip: Model<IPayslip> = mongoose.model<IPayslip>('Payslip', payslipSchema);

export { SalaryStructure, Payslip };
