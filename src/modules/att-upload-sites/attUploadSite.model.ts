import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Set of branches that are permitted to upload attendance files. Stored as
// (company, branch) rows — the UI lets admins check/uncheck pairs.
export interface IAttUploadSite extends Document {
  branch: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAttUploadSite>(
  {
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: [true, 'Branch is required'] },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ company: 1, branch: 1 }, { unique: true });

const AttUploadSite: Model<IAttUploadSite> = mongoose.model<IAttUploadSite>('AttUploadSite', schema);
export default AttUploadSite;
