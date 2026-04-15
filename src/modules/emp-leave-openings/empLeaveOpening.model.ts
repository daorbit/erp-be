import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Opening balance per employee per leave type per financial year.
// UI is a table-edit screen: filter by company/branch/dept etc., then edit
// per-row opening balances for the selected finyear.
export interface IEmpLeaveOpening extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  finyear: mongoose.Types.ObjectId;
  openingBalance: number;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IEmpLeaveOpening>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    finyear: { type: Schema.Types.ObjectId, ref: 'LeaveFinyear', required: true },
    openingBalance: { type: Number, default: 0, min: 0 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ employee: 1, leaveType: 1, finyear: 1, company: 1 }, { unique: true });

const EmpLeaveOpening: Model<IEmpLeaveOpening> = mongoose.model<IEmpLeaveOpening>('EmpLeaveOpening', schema);
export default EmpLeaveOpening;
