import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IOptionalHoliday extends Document {
  date: Date;
  name: string;
  finyear?: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IOptionalHoliday>(
  {
    date: { type: Date, required: true },
    name: { type: String, required: [true, 'Holiday Name is required'], trim: true, maxlength: 100 },
    finyear: { type: Schema.Types.ObjectId, ref: 'LeaveFinyear' },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ date: 1, company: 1 });

const OptionalHoliday: Model<IOptionalHoliday> = mongoose.model<IOptionalHoliday>('OptionalHoliday', schema);
export default OptionalHoliday;
