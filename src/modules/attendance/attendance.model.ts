import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LATE = 'late',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEK_OFF = 'week_off',
  WORK_FROM_HOME = 'work_from_home',
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ILocation {
  latitude?: number;
  longitude?: number;
}

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  workHours?: number;
  overtime?: number;
  notes?: string;
  location?: ILocation;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const locationSchema = new Schema<ILocation>(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  { _id: false },
);

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
      required: [true, 'Attendance status is required'],
    },
    workHours: {
      type: Number,
      min: [0, 'Work hours cannot be negative'],
      max: [24, 'Work hours cannot exceed 24'],
    },
    overtime: {
      type: Number,
      min: [0, 'Overtime cannot be negative'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    location: locationSchema,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ employee: 1, date: 1, status: 1 });

// ─── Pre-save: Calculate work hours ────────────────────────────────────────

attendanceSchema.pre<IAttendance>('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut.getTime() - this.checkIn.getTime();
    this.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

// ─── Model ───────────────────────────────────────────────────────────────────

const Attendance: Model<IAttendance> = mongoose.model<IAttendance>(
  'Attendance',
  attendanceSchema,
);

export default Attendance;
