import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ReminderStatus {
  REMINDER_SENT = 'reminder_sent',
  INQUIRY_SENT = 'inquiry_sent',
  LEAVE_APPLIED = 'leave_applied',
  CHECKED_IN = 'checked_in',
  NO_RESPONSE = 'no_response',
  DECLINED_LEAVE = 'declined_leave',
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IShiftReminder extends Document {
  employee: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
  date: Date;
  status: ReminderStatus;
  reminderSentAt?: Date;
  inquirySentAt?: Date;
  responseReceivedAt?: Date;
  responseText?: string;
  leaveRequest?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const shiftReminderSchema = new Schema<IShiftReminder>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ReminderStatus),
      default: ReminderStatus.REMINDER_SENT,
    },
    reminderSentAt: { type: Date },
    inquirySentAt: { type: Date },
    responseReceivedAt: { type: Date },
    responseText: { type: String, trim: true },
    leaveRequest: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveRequest',
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

shiftReminderSchema.index({ employee: 1, date: 1, shift: 1 }, { unique: true });
shiftReminderSchema.index({ date: 1, status: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const ShiftReminder: Model<IShiftReminder> = mongoose.model<IShiftReminder>(
  'ShiftReminder',
  shiftReminderSchema,
);

export default ShiftReminder;
