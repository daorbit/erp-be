import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Registry of (employee, email, mobile, alert flags) for outbound SMS/Email.
// Matches the NwayERP "SMS EMAIL Alert" screen.

// Per-alert configuration row.
export interface IAlertConfig {
  assign?: boolean;
  defaultTicked?: boolean;
  compulsory?: boolean;
  sites?: mongoose.Types.ObjectId[];
}

export interface ISmsEmailAlert extends Document {
  employee: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  emailId?: string;
  mobileNo?: string;

  // Free-form map of alertKey → config (Map<string, IAlertConfig>).
  alerts: Map<string, IAlertConfig>;

  // Legacy flags retained for backwards compatibility.
  smsOnSalaryAlert?: boolean;
  smsEmailOnNewJoiningExitAlert?: boolean;

  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const alertConfigSchema = new Schema<IAlertConfig>(
  {
    assign: { type: Boolean, default: false },
    defaultTicked: { type: Boolean, default: false },
    compulsory: { type: Boolean, default: false },
    sites: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
  },
  { _id: false },
);

const schema = new Schema<ISmsEmailAlert>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    emailId: { type: String, trim: true, lowercase: true, maxlength: 100 },
    mobileNo: { type: String, trim: true, maxlength: 20 },
    alerts: { type: Map, of: alertConfigSchema, default: {} },
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
