import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Branch code cannot exceed 20 characters'],
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

branchSchema.index({ name: 1, company: 1 }, { unique: true });
branchSchema.index({ code: 1, company: 1 }, { unique: true });
branchSchema.index({ isActive: 1 });

const Branch: Model<IBranch> = mongoose.model<IBranch>('Branch', branchSchema);
export default Branch;
