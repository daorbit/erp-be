import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IBranchGstEntry {
  state?: string;
  tinNumber?: string;
  companyName?: string;
  gstNumber?: string;
  stateCode?: string;
  isUT?: boolean;
  isISD?: boolean;
}

export interface IBranchDocument {
  documentName?: string;
  file?: string;
  filePath?: string;
  remark?: string;
}

export interface IBranch extends Document {
  name: string;
  code: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // ─── NwayERP Site/Plant/Project extensions ────────────────────────────────
  // Header
  isHO?: boolean;
  siteType?: string;           // SITE, PLANT, TOLL, PROJECT, etc.
  division?: string;
  department?: mongoose.Types.ObjectId;
  departmentType?: string;
  projectType?: string;
  startDate?: Date;
  purchaseLimit?: number;
  orderNo?: number;
  isLocked?: boolean;
  cgstApplicable?: boolean;

  // Address Details
  address01?: string;
  address02?: string;
  address03?: string;
  city?: string;
  pincode?: string;
  email?: string;
  emailForPO?: string;
  phone1?: string;
  phone2?: string;
  faxNo1?: string;
  faxNo2?: string;
  principalEmployer?: string;
  contactPerson?: string;
  stateName?: string;

  // Tax Details
  tinNo?: string;
  stcNo?: string;
  eccNo?: string;
  exciseRange?: string;
  exciseDivision?: string;
  commissionerate?: string;
  descExciseableCommodity?: string;

  // Other Details
  remark?: string;
  reraRegNo?: string;
  completionCertificate?: string;
  loiLoaNo?: string;
  loiLoaDate?: Date;
  agreementNo?: string;
  agreementDate?: Date;
  workCapital?: number;
  mandiLicenceNo?: string;

  // GST entries & Documents (dynamic arrays)
  gstEntries?: IBranchGstEntry[];
  documents?: IBranchDocument[];
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

    // NwayERP — Header
    isHO: { type: Boolean, default: false },
    siteType: { type: String, trim: true, default: 'site' },
    division: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    departmentType: { type: String, trim: true },
    projectType: { type: String, trim: true },
    startDate: { type: Date },
    purchaseLimit: { type: Number, default: 0 },
    orderNo: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    cgstApplicable: { type: Boolean, default: false },

    // NwayERP — Address Details
    address01: { type: String, trim: true },
    address02: { type: String, trim: true },
    address03: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    email: { type: String, trim: true },
    emailForPO: { type: String, trim: true },
    phone1: { type: String, trim: true },
    phone2: { type: String, trim: true },
    faxNo1: { type: String, trim: true },
    faxNo2: { type: String, trim: true },
    principalEmployer: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    stateName: { type: String, trim: true },

    // NwayERP — Tax Details
    tinNo: { type: String, trim: true },
    stcNo: { type: String, trim: true },
    eccNo: { type: String, trim: true },
    exciseRange: { type: String, trim: true },
    exciseDivision: { type: String, trim: true },
    commissionerate: { type: String, trim: true },
    descExciseableCommodity: { type: String, trim: true },

    // NwayERP — Other Details
    remark: { type: String, trim: true },
    reraRegNo: { type: String, trim: true },
    completionCertificate: { type: String, trim: true },
    loiLoaNo: { type: String, trim: true },
    loiLoaDate: { type: Date },
    agreementNo: { type: String, trim: true },
    agreementDate: { type: Date },
    workCapital: { type: Number, default: 0 },
    mandiLicenceNo: { type: String, trim: true },

    // NwayERP — GST entries & Documents
    gstEntries: [{
      state: { type: String, trim: true },
      tinNumber: { type: String, trim: true },
      companyName: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      stateCode: { type: String, trim: true },
      isUT: { type: Boolean, default: false },
      isISD: { type: Boolean, default: false },
    }],
    documents: [{
      documentName: { type: String, trim: true },
      file: { type: String },
      filePath: { type: String, trim: true },
      remark: { type: String, trim: true },
    }],
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
