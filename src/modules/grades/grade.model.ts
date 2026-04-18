import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IGrade extends Document {
  name: string;
  level: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IGrade>(
  {
    name: { type: String, required: [true, 'Grade Name is required'], trim: true, maxlength: 100 },
    level: { type: Schema.Types.ObjectId, ref: 'Level', required: [true, 'Level is required'] },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, level: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const Grade: Model<IGrade> = mongoose.model<IGrade>('Grade', schema);
export default Grade;
