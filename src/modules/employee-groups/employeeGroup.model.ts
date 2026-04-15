import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IEmployeeGroup extends Document {
  name: string;
  shortName?: string;
  company: mongoose.Types.ObjectId;
  branches: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const employeeGroupSchema = new Schema<IEmployeeGroup>(
  {
    name: {
      type: String,
      required: [true, 'Employee Group name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    branches: [{
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Unique per company by name; same name can exist across different companies.
employeeGroupSchema.index({ name: 1, company: 1 }, { unique: true });
employeeGroupSchema.index({ isActive: 1 });
employeeGroupSchema.index({ branches: 1 });

// ─── Virtual: siteCount (number of branches) ────────────────────────────────
// Used by the List view to show how many branches the group covers.
employeeGroupSchema.virtual('siteCount').get(function (this: IEmployeeGroup) {
  return Array.isArray(this.branches) ? this.branches.length : 0;
});

// ─── Model ───────────────────────────────────────────────────────────────────

const EmployeeGroup: Model<IEmployeeGroup> = mongoose.model<IEmployeeGroup>(
  'EmployeeGroup',
  employeeGroupSchema,
);

export default EmployeeGroup;
