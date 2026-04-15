import mongoose, { Schema, type Document, type Model } from 'mongoose';

export enum SimType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

export enum SimStatus {
  NOT_USED = 'not_used',
  ALLOTTED = 'allotted',
  SURRENDERED = 'surrendered',
}

export interface ISim extends Document {
  simMobileNo: string;
  simSerialNo?: string;
  purchaseOrderBillNo?: string;
  purchaseDate?: Date;
  stateCircle?: string;
  localStd?: string;
  subscriberName?: string;
  planTariff?: string;
  simType: SimType;
  status: SimStatus;
  allocatedTo?: mongoose.Types.ObjectId; // ref: User (employee)
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISim>(
  {
    simMobileNo: { type: String, required: [true, 'Sim/Mobile No is required'], trim: true, maxlength: 20 },
    simSerialNo: { type: String, trim: true, maxlength: 50 },
    purchaseOrderBillNo: { type: String, trim: true, maxlength: 50 },
    purchaseDate: { type: Date },
    stateCircle: { type: String, trim: true, maxlength: 100 },
    localStd: { type: String, trim: true, maxlength: 20 },
    subscriberName: { type: String, trim: true, maxlength: 150 },
    planTariff: { type: String, trim: true, maxlength: 150 },
    simType: { type: String, enum: Object.values(SimType), default: SimType.POSTPAID },
    status: { type: String, enum: Object.values(SimStatus), default: SimStatus.NOT_USED },
    allocatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ simMobileNo: 1, company: 1 }, { unique: true });
schema.index({ status: 1 });
schema.index({ isActive: 1 });

const Sim: Model<ISim> = mongoose.model<ISim>('Sim', schema);
export default Sim;
