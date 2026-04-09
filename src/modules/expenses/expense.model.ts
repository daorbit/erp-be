import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  OFFICE_SUPPLIES = 'office_supplies',
  TRAINING = 'training',
  MEDICAL = 'medical',
  OTHER = 'other',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed',
}

// ─── Sub-Interface ──────────────────────────────────────────────────────────

export interface IReceipt {
  name: string;
  fileUrl: string;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IExpense extends Document {
  employee: mongoose.Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
  receipts: IReceipt[];
  status: ExpenseStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approverRemarks?: string;
  reimbursedAt?: Date;
  reimbursementRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schema ─────────────────────────────────────────────────────────────

const receiptSchema = new Schema<IReceipt>(
  {
    name: {
      type: String,
      required: [true, 'Receipt name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
  },
  { _id: true },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const expenseSchema = new Schema<IExpense>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      maxlength: [5, 'Currency code cannot exceed 5 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    receipts: [receiptSchema],
    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.DRAFT,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    approverRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    reimbursedAt: {
      type: Date,
    },
    reimbursementRef: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference cannot exceed 100 characters'],
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

expenseSchema.index({ employee: 1, status: 1 });
expenseSchema.index({ employee: 1, date: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ approvedBy: 1 });
expenseSchema.index({ title: 'text', description: 'text' });

// ─── Model ───────────────────────────────────────────────────────────────────

const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
