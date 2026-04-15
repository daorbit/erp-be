import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IShift extends Document {
  name: string;
  company: mongoose.Types.ObjectId;
  startTime: string; // HH:mm format (e.g. "09:00")
  endTime: string;   // HH:mm format (e.g. "18:00")
  graceMinutes: number; // Minutes after start before marked late (default 15)
  timezone: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // ─── NwayERP Shift-master extensions ───────────────────────────────────
  inTimeAsAttendanceDate?: boolean;
  outTimeAsAttendanceDate?: boolean;
  considerLowerLimit?: string;   // HH:mm — earliest clock-in that still counts
  considerUpperLimit?: string;   // HH:mm — latest clock-out that still counts
  halfTime?: string;             // HH:mm — mid-shift split for half-day checks
  lunchTimeMinutes?: number;
  halfDayMinHours?: number;      // 0.50 = 30 minutes
  fullDayMinHours?: number;
  totalShiftHours?: number;
  isShiftBreak?: boolean;
  statusOnSinglePunch?: string;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const shiftSchema = new Schema<IShift>(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      maxlength: [100, 'Shift name cannot exceed 100 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'],
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Grace minutes cannot be negative'],
      max: [120, 'Grace minutes cannot exceed 120'],
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Mon-Fri
      validate: {
        validator: (v: number[]) => v.every((d) => d >= 0 && d <= 6),
        message: 'Working days must be between 0 (Sun) and 6 (Sat)',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },

    // NwayERP extensions
    inTimeAsAttendanceDate: { type: Boolean, default: true },
    outTimeAsAttendanceDate: { type: Boolean, default: false },
    considerLowerLimit: { type: String, default: '00:00' },
    considerUpperLimit: { type: String, default: '23:59' },
    halfTime: { type: String, default: '12:00' },
    lunchTimeMinutes: { type: Number, default: 0, min: 0 },
    halfDayMinHours: { type: Number, default: 4, min: 0 },
    fullDayMinHours: { type: Number, default: 8, min: 0 },
    totalShiftHours: { type: Number, default: 0, min: 0 },
    isShiftBreak: { type: Boolean, default: false },
    statusOnSinglePunch: { type: String, default: 'absent' },
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

shiftSchema.index({ company: 1, isActive: 1 });
shiftSchema.index({ name: 1, company: 1 }, { unique: true });

// ─── Model ───────────────────────────────────────────────────────────────────

const Shift: Model<IShift> = mongoose.model<IShift>('Shift', shiftSchema);

export default Shift;
