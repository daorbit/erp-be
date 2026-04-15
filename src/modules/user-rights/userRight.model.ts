import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Per-user page permissions for a given (company, branch) scope. Screenshot
// form lets an admin "Show" these and then check rights per page/entity.
export interface IUserRight extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  // Flat list of page/entity codes this user can access.
  // E.g. ["employees.add", "employees.list", "salary.view"]
  allowedPages: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUserRight>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    allowedPages: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ user: 1, company: 1, branch: 1 }, { unique: true });

const UserRight: Model<IUserRight> = mongoose.model<IUserRight>('UserRight', schema);
export default UserRight;
