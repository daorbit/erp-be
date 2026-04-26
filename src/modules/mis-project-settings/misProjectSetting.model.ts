import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Per-user list of branches/sites that count as their MIS projects.
// One row per user; updating the row replaces the project list.
export interface IMisProjectSetting extends Document {
  user: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMisProjectSetting>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projects: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } },
  },
);

schema.index({ user: 1, company: 1 }, { unique: true });

const MisProjectSetting: Model<IMisProjectSetting> =
  mongoose.model<IMisProjectSetting>('MisProjectSetting', schema);
export default MisProjectSetting;
