import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum LeaveRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export enum HalfDayType {
  FIRST_HALF = 'FirstHalf',
  SECOND_HALF = 'SecondHalf',
}

export enum ApplicableFor {
  ALL = 'All',
  MALE = 'Male',
  FEMALE = 'Female',
}

// ─── LeaveType Interface ────────────────────────────────────────────────────

export interface ILeaveType extends Document {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  carryForward: boolean;
  maxCarryForward: number;
  isActive: boolean;
  isPaid: boolean;
  applicableFor: ApplicableFor;
  createdAt: Date;
  updatedAt: Date;
}

// ─── LeaveType Schema ───────────────────────────────────────────────────────

const leaveTypeSchema = new Schema<ILeaveType>(
  {
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      unique: true,
      required: [true, 'Leave type code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    defaultDays: {
      type: Number,
      required: [true, 'Default days is required'],
      min: [0, 'Default days cannot be negative'],
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
      min: [0, 'Max carry forward cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    applicableFor: {
      type: String,
      enum: Object.values(ApplicableFor),
      default: ApplicableFor.ALL,
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

// ─── LeaveType Indexes ──────────────────────────────────────────────────────

leaveTypeSchema.index({ isActive: 1 });
leaveTypeSchema.index({ name: 'text' });

// ─── LeaveRequest Interface ─────────────────────────────────────────────────

export interface ILeaveRequest extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approverRemarks?: string;
  attachments?: string[];
  isHalfDay: boolean;
  halfDayType?: HalfDayType;
  createdAt: Date;
  updatedAt: Date;
}

// ─── LeaveRequest Schema ────────────────────────────────────────────────────

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    leaveType: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: [true, 'Total days is required'],
      min: [0.5, 'Total days must be at least 0.5'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(LeaveRequestStatus),
      default: LeaveRequestStatus.PENDING,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approverRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    attachments: [
      {
        type: String,
      },
    ],
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: Object.values(HalfDayType),
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

// ─── LeaveRequest Indexes ───────────────────────────────────────────────────

leaveRequestSchema.index({ employee: 1, startDate: 1 });
leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ leaveType: 1 });
leaveRequestSchema.index({ approvedBy: 1 });

// ─── LeaveRequest Validation ────────────────────────────────────────────────

leaveRequestSchema.pre<ILeaveRequest>('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after the start date');
  }
  next();
});

// ─── LeaveBalance Interface ─────────────────────────────────────────────────

export interface ILeaveBalance extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  carryForward: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── LeaveBalance Schema ────────────────────────────────────────────────────

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    leaveType: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be at least 2000'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    allocated: {
      type: Number,
      required: [true, 'Allocated days is required'],
      min: [0, 'Allocated days cannot be negative'],
      default: 0,
    },
    used: {
      type: Number,
      min: [0, 'Used days cannot be negative'],
      default: 0,
    },
    remaining: {
      type: Number,
      min: [0, 'Remaining days cannot be negative'],
      default: 0,
    },
    carryForward: {
      type: Number,
      min: [0, 'Carry forward cannot be negative'],
      default: 0,
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

// ─── LeaveBalance Indexes ───────────────────────────────────────────────────

leaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ employee: 1, year: 1 });

// ─── Models ─────────────────────────────────────────────────────────────────

const LeaveType: Model<ILeaveType> = mongoose.model<ILeaveType>(
  'LeaveType',
  leaveTypeSchema,
);

const LeaveRequest: Model<ILeaveRequest> = mongoose.model<ILeaveRequest>(
  'LeaveRequest',
  leaveRequestSchema,
);

const LeaveBalance: Model<ILeaveBalance> = mongoose.model<ILeaveBalance>(
  'LeaveBalance',
  leaveBalanceSchema,
);

export { LeaveType, LeaveRequest, LeaveBalance };
