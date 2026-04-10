import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ICompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface ICompany extends Document {
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address?: ICompanyAddress;
  industry?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Company code cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      zipCode: { type: String, trim: true },
    },
    industry: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

companySchema.index({ name: 1 });
companySchema.index({ code: 1 });
companySchema.index({ isActive: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);

export default Company;
