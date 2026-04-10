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
  contactPerson?: string;
  gstNumber?: string;
  panNumber?: string;
  maxEmployees?: number;
  subscription?: string;
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
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [15, 'GST number cannot exceed 15 characters'],
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [10, 'PAN number cannot exceed 10 characters'],
    },
    maxEmployees: {
      type: Number,
      min: [1, 'Max employees must be at least 1'],
    },
    subscription: {
      type: String,
      trim: true,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free',
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
