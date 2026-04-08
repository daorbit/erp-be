import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: mongoose.Types.ObjectId;
  parentDepartment?: mongoose.Types.ObjectId;
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
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      unique: true,
      required: [true, 'Department code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Department code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    parentDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
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

departmentSchema.index({ name: 'text', description: 'text' });
departmentSchema.index({ parentDepartment: 1 });
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
