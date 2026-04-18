import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ITag extends Document {
  name: string;
  shortName?: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITag>(
  {
    name: { type: String, required: [true, 'Tag Name is required'], trim: true, maxlength: 100 },
    shortName: { type: String, trim: true, maxlength: 30 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const Tag: Model<ITag> = mongoose.model<ITag>('Tag', schema);
export default Tag;
