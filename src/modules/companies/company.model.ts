import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ICompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface ICompanyDocument {
  documentName?: string;
  documentRemark?: string;
  file?: string;
  whatsappEmail?: boolean;
}

export interface ICompanyITReturn {
  finYear?: string;
  fillingDate?: Date;
  acknowledgementNo?: string;
  file?: string;
}

export interface ICompany extends Document {
  name: string;
  code: string;         // "Short Name" in NwayERP
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

  // ─── NwayERP Company Master extensions ────────────────────────────────────
  // Address Details
  signFor?: string;
  address02?: string;
  address03?: string;
  phone2?: string;
  faxNo1?: string;
  faxNo2?: string;
  directorName?: string;
  fatherName?: string;
  designation?: string;

  // Tax Details
  pfPrefix?: string;
  tinNo?: string;
  tanNo?: string;
  stNo1?: string;
  stNo2?: string;
  cstNo1?: string;
  cstNo2?: string;
  lutBondNo?: string;
  lutDate?: Date;
  msme?: string;

  // Other Details
  cinNo?: string;
  eccNo1?: string;
  eccNo2?: string;
  range?: string;
  division?: string;
  commissionerate?: string;
  cthNo?: string;
  regOffName?: string;
  regOffAddress?: string;
  remark?: string;
  regOffPinCode?: string;
  regOffPhoneNo?: string;
  regOffCity?: string;

  // Logo / Images
  logoLeft?: string;
  logoRight?: string;
  headerImage?: string;
  footerImage?: string;
  stampImage?: string;

  // Documents & IT Returns (dynamic arrays)
  documents?: ICompanyDocument[];
  itReturns?: ICompanyITReturn[];
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

    // NwayERP — Address Details
    signFor: { type: String, trim: true },
    address02: { type: String, trim: true },
    address03: { type: String, trim: true },
    phone2: { type: String, trim: true },
    faxNo1: { type: String, trim: true },
    faxNo2: { type: String, trim: true },
    directorName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    designation: { type: String, trim: true },

    // NwayERP — Tax Details
    pfPrefix: { type: String, trim: true },
    tinNo: { type: String, trim: true },
    tanNo: { type: String, trim: true },
    stNo1: { type: String, trim: true },
    stNo2: { type: String, trim: true },
    cstNo1: { type: String, trim: true },
    cstNo2: { type: String, trim: true },
    lutBondNo: { type: String, trim: true },
    lutDate: { type: Date },
    msme: { type: String, trim: true },

    // NwayERP — Other Details
    cinNo: { type: String, trim: true },
    eccNo1: { type: String, trim: true },
    eccNo2: { type: String, trim: true },
    range: { type: String, trim: true },
    division: { type: String, trim: true },
    commissionerate: { type: String, trim: true },
    cthNo: { type: String, trim: true },
    regOffName: { type: String, trim: true },
    regOffAddress: { type: String, trim: true },
    remark: { type: String, trim: true },
    regOffPinCode: { type: String, trim: true },
    regOffPhoneNo: { type: String, trim: true },
    regOffCity: { type: String, trim: true },

    // NwayERP — Logo / Images
    logoLeft: { type: String },
    logoRight: { type: String },
    headerImage: { type: String },
    footerImage: { type: String },
    stampImage: { type: String },

    // NwayERP — Documents & IT Returns
    documents: [{
      documentName: { type: String, trim: true },
      documentRemark: { type: String, trim: true },
      file: { type: String },
      whatsappEmail: { type: Boolean, default: false },
    }],
    itReturns: [{
      finYear: { type: String, trim: true },
      fillingDate: { type: Date },
      acknowledgementNo: { type: String, trim: true },
      file: { type: String },
    }],
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

companySchema.index({ isActive: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);

export default Company;
