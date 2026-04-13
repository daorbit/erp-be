import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IParentDepartment extends Document {
  name: string;
  shortName: string;
  displayOrder: number;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parentDepartmentSchema = new Schema<IParentDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Super Department name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    shortName: {
      type: String,
      required: [true, 'Short name is required'],
      trim: true,
      maxlength: [20, 'Short name cannot exceed 20 characters'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
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

parentDepartmentSchema.index({ name: 1, company: 1 }, { unique: true });
parentDepartmentSchema.index({ shortName: 1, company: 1 }, { unique: true });
parentDepartmentSchema.index({ displayOrder: 1 });
parentDepartmentSchema.index({ isActive: 1 });

const ParentDepartment: Model<IParentDepartment> = mongoose.model<IParentDepartment>(
  'ParentDepartment',
  parentDepartmentSchema,
);

export default ParentDepartment;
