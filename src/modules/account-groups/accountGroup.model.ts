import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Constants ────────────────────────────────────────────────────────────────

export const GROUP_NATURE_OPTIONS = ['ASSETS', 'EXPENSES', 'INCOME', 'LIABILITY'] as const;
export type GroupNature = (typeof GROUP_NATURE_OPTIONS)[number];

export const SCHEDULE_GROUP_OPTIONS = [
  '(A) MSME',
  '(B) OTHERS',
  'AFTER EXTRAORDINARY ADJUSTMENT',
  'BASIC',
  'BEFORE EXTRAORDINARY ITEMS',
  'CAPITAL WORK-IN-PROGRESS',
  'CASH AND CASH EQUIVALENTS',
  'COST OF CONSTRUCTION',
  'CURRENT INVESTMENTS',
  'CURRENT TAX',
  'DEFERRED TAX',
  'DEFERRED TAX ASSETS (NET)',
  'DEFERRED TAX LIABILITIES (NET)',
  'DEPRECIATION AND AMORTIZATION EXPENSES',
  'EMPLOYEE BENEFIT EXPENSES',
  'EXCEPTIONAL ITEMS',
  'EXCESS/SHORT PROVISION RELATING EARLIER YEAR TAX',
  'EXPENSES PAYABLE',
  'EXTRAORDINARY ITEMS',
  'FINANCE COSTS',
  'FIXED ASSETS',
  'GENERAL RESERVES AND SURPLUS',
  'INVENTORIES',
  'LONG TERM BORROWINGS',
  'LONG TERM PROVISIONS',
  'LONG-TERM LOANS AND ADVANCES',
  'MISCELLANEOUS EXPENSES',
  'OTHER CURRENT ASSETS',
  'OTHER CURRENT LIABILITIES',
  'OTHER INCOME',
  'OTHER LONG-TERM LIABILITIES',
  'OTHER NON-CURRENT ASSETS',
  'REVENUE FROM OPERATIONS',
  'SHARE CAPITAL',
  'SHORT-TERM BORROWINGS',
  'SHORT-TERM LOANS AND ADVANCES',
  'SHORT-TERM PROVISIONS',
  'TRADE PAYABLES',
  'TRADE RECEIVABLES',
] as const;

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAccountGroup extends Document {
  name: string;
  isMainGroup: boolean;
  scheduleGroup?: string;
  orderNo: number;
  groupNature: GroupNature;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const accountGroupSchema = new Schema<IAccountGroup>(
  {
    name: {
      type: String,
      required: [true, 'Account Group Name is required'],
      trim: true,
      maxlength: [150, 'Account Group Name cannot exceed 150 characters'],
    },
    isMainGroup: {
      type: Boolean,
      default: true,
    },
    scheduleGroup: {
      type: String,
      trim: true,
    },
    orderNo: {
      type: Number,
      default: 0,
    },
    groupNature: {
      type: String,
      enum: GROUP_NATURE_OPTIONS,
      required: [true, 'Group Nature is required'],
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
  { timestamps: true },
);

accountGroupSchema.index({ company: 1, name: 1 }, { unique: true });

// ─── Model ───────────────────────────────────────────────────────────────────

type AccountGroupModel = Model<IAccountGroup>;
const AccountGroup: AccountGroupModel =
  mongoose.models.AccountGroup ||
  mongoose.model<IAccountGroup>('AccountGroup', accountGroupSchema);

export default AccountGroup;
