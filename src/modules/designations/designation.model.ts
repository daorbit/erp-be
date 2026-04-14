import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDesignation extends Document {
  name: string;
  shortName: string;
  rolesAndResponsibility?: string;
  company: mongoose.Types.ObjectId;
  departments?: mongoose.Types.ObjectId[];
  displayOrder: number;
  employeeBand?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const designationSchema = new Schema<IDesignation>(
  {
    name: {
      type: String,
      required: [true, 'Designation name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    rolesAndResponsibility: {
      type: String,
      trim: true,
      maxlength: [1000, 'Roles and responsibility cannot exceed 1000 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    departments: [{
      type: Schema.Types.ObjectId,
      ref: 'Department',
    }],
    displayOrder: {
      type: Number,
      default: 0,
    },
    employeeBand: {
      type: String,
      trim: true,
      maxlength: [50, 'Employee band cannot exceed 50 characters'],
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

designationSchema.index({ name: 1, company: 1 }, { unique: true });
designationSchema.index({ shortName: 1, company: 1 }, { unique: true });
designationSchema.index({ departments: 1 });
designationSchema.index({ isActive: 1 });
designationSchema.index({ name: 'text', rolesAndResponsibility: 'text' });

// ─── Model ───────────────────────────────────────────────────────────────────

const Designation: Model<IDesignation> = mongoose.model<IDesignation>(
  'Designation',
  designationSchema,
);

export default Designation;
