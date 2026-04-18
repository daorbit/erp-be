import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { ResignMode, ResignStatus } from '../../shared/types.js';

export interface IResignation extends Document {
  employee: mongoose.Types.ObjectId;
  resignationDate: Date;
  noticePeriodFrom?: Date;
  noticePeriodTo?: Date;
  noticeDay?: number;
  resignMode: ResignMode;
  remark?: string;
  attachmentUrl?: string;
  status: ResignStatus;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IResignation>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Employee is required'] },
    resignationDate: { type: Date, required: [true, 'Resignation Date is required'] },
    noticePeriodFrom: { type: Date },
    noticePeriodTo: { type: Date },
    noticeDay: { type: Number, min: 0, default: 0 },
    resignMode: {
      type: String,
      enum: Object.values(ResignMode),
      required: [true, 'Resign Mode is required'],
    },
    remark: { type: String, trim: true, maxlength: 500 },
    attachmentUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(ResignStatus),
      default: ResignStatus.PENDING,
    },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } },
  },
);

schema.index({ employee: 1, resignationDate: -1 });
schema.index({ status: 1 });

const Resignation: Model<IResignation> = mongoose.model<IResignation>('Resignation', schema);
export default Resignation;
