import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDepartment extends Document {
  name: string;
  shortName: string;
  description?: string;
  company: mongoose.Types.ObjectId;
  // headOfDepartment?: mongoose.Types.ObjectId;
  parentDepartments: mongoose.Types.ObjectId[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  employeeCount?: number;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    // headOfDepartment: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    displayOrder: {
      type: Number,
      default: 0,
    },
    parentDepartments: [{
      type: Schema.Types.ObjectId,
      ref: 'ParentDepartment',
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

departmentSchema.index({ name: 1, company: 1 }, { unique: true });
departmentSchema.index({ shortName: 1, company: 1 }, { unique: true });
departmentSchema.index({ name: 'text', description: 'text' });
departmentSchema.index({ parentDepartments: 1 });
departmentSchema.index({ isActive: 1 });

// ─── Virtuals ───────────────────────────────────────────────────────────────

departmentSchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true,
});

// ─── Model ───────────────────────────────────────────────────────────────────

const Department: Model<IDepartment> = mongoose.model<IDepartment>(
  'Department',
  departmentSchema,
);

export default Department;
