import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDesignation extends Document {
  title: string;
  code: string;
  description?: string;
  department?: mongoose.Types.ObjectId;
  level: number;
  band?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const designationSchema = new Schema<IDesignation>(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    code: {
      type: String,
      unique: true,
      required: [true, 'Designation code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    level: {
      type: Number,
      required: [true, 'Designation level is required'],
      min: [1, 'Level must be at least 1 (entry)'],
      max: [10, 'Level cannot exceed 10 (CXO)'],
    },
    band: {
      type: String,
      trim: true,
      maxlength: [10, 'Band cannot exceed 10 characters'],
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

designationSchema.index({ department: 1 });
designationSchema.index({ level: 1 });
designationSchema.index({ isActive: 1 });
designationSchema.index({ title: 'text', description: 'text' });

// ─── Model ───────────────────────────────────────────────────────────────────

const Designation: Model<IDesignation> = mongoose.model<IDesignation>(
  'Designation',
  designationSchema,
);

export default Designation;
