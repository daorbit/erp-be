import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Audit row of a "closing leave transfer" event — moves eligible balance
// from one finyear to the next as per each LeaveType's carry-fwd rules.
export interface IClosingLeaveTransfer extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  fromFinyear: mongoose.Types.ObjectId;
  toFinyear: mongoose.Types.ObjectId;
  closingBalance: number;
  transferredBalance: number;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IClosingLeaveTransfer>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    fromFinyear: { type: Schema.Types.ObjectId, ref: 'LeaveFinyear', required: true },
    toFinyear: { type: Schema.Types.ObjectId, ref: 'LeaveFinyear', required: true },
    closingBalance: { type: Number, default: 0, min: 0 },
    transferredBalance: { type: Number, default: 0, min: 0 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ employee: 1, leaveType: 1, fromFinyear: 1, toFinyear: 1, company: 1 }, { unique: true });

const ClosingLeaveTransfer: Model<IClosingLeaveTransfer> = mongoose.model<IClosingLeaveTransfer>('ClosingLeaveTransfer', schema);
export default ClosingLeaveTransfer;
