import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IState extends Document {
  name: string;
  shortName?: string;
  stateCode: string;
  isUT?: boolean;
  country: string;
  company?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IState>(
  {
    name: { type: String, required: [true, 'State Name is required'], trim: true, maxlength: 100 },
    shortName: { type: String, trim: true, maxlength: 30 },
    stateCode: { type: String, required: [true, 'State Code is required'], trim: true, maxlength: 10 },
    isUT: { type: Boolean, default: false },
    country: { type: String, required: [true, 'Country is required'], trim: true, default: 'INDIA' },
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_d, r: Record<string, any>) { delete r.__v; return r; },
    },
  },
);

schema.index({ name: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const State: Model<IState> = mongoose.model<IState>('State', schema);
export default State;
