import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Represents per-user, per-module/entity daily limits (add/edit/delete).
// The UI shows 1000 = unlimited, -1 = blocked. The table rows are per-entity
// within a module (e.g. HUMAN-RESOURCE / Advance, etc.).
export interface IDayAuthorizationRow extends Document {
  user: mongoose.Types.ObjectId;
  moduleName: string;
  entityName: string;
  addLimit: number;
  editLimit: number;
  deleteLimit: number;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDayAuthorizationRow>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moduleName: { type: String, required: true, trim: true, maxlength: 100 },
    entityName: { type: String, required: true, trim: true, maxlength: 100 },
    addLimit: { type: Number, default: 1000 },
    editLimit: { type: Number, default: 1000 },
    deleteLimit: { type: Number, default: -1 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ user: 1, moduleName: 1, entityName: 1, company: 1 }, { unique: true });

const DayAuthorization: Model<IDayAuthorizationRow> = mongoose.model<IDayAuthorizationRow>('DayAuthorization', schema);
export default DayAuthorization;
