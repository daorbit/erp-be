import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICity extends Document {
  name: string;
  state: string;
  district?: string;
  subDistrict?: string;
  shortName?: string;
  stdCode?: string;
  pinCode?: string;
  company?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICity>(
  {
    name: { type: String, required: [true, 'City Name is required'], trim: true, maxlength: 100 },
    state: { type: String, required: [true, 'State Name is required'], trim: true, maxlength: 100 },
    district: { type: String, trim: true, maxlength: 100 },
    subDistrict: { type: String, trim: true, maxlength: 100 },
    shortName: { type: String, trim: true, maxlength: 30 },
    stdCode: { type: String, trim: true, maxlength: 10 },
    pinCode: { type: String, trim: true, maxlength: 10 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, state: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const City: Model<ICity> = mongoose.model<ICity>('City', schema);
export default City;
