import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IQualification extends Document {
  name: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const qualificationSchema = new Schema<IQualification>(
  {
    name: { type: String, required: [true, 'Qualification is required'], trim: true, maxlength: 100 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_d, ret: Record<string, any>) { delete ret.__v; return ret; } },
    toObject: { virtuals: true },
  },
);

qualificationSchema.index({ name: 1, company: 1 }, { unique: true });
qualificationSchema.index({ isActive: 1 });

const Qualification: Model<IQualification> = mongoose.model<IQualification>('Qualification', qualificationSchema);
export default Qualification;
