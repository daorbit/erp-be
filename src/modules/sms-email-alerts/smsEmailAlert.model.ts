import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Registry of (employee, email, mobile, alert flags) for outbound SMS/Email.
// Matches the NwayERP "SMS EMAIL Alert" screen.
export interface ISmsEmailAlert extends Document {
  employee: mongoose.Types.ObjectId;
  emailId?: string;
  mobileNo?: string;
  smsOnSalaryAlert: boolean;
  smsEmailOnNewJoiningExitAlert: boolean;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISmsEmailAlert>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emailId: { type: String, trim: true, lowercase: true, maxlength: 100 },
    mobileNo: { type: String, trim: true, maxlength: 20 },
    smsOnSalaryAlert: { type: Boolean, default: false },
    smsEmailOnNewJoiningExitAlert: { type: Boolean, default: false },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ employee: 1, company: 1 }, { unique: true });

const SmsEmailAlert: Model<ISmsEmailAlert> = mongoose.model<ISmsEmailAlert>('SmsEmailAlert', schema);
export default SmsEmailAlert;
