import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IGstAddressEntry {
  _id?: mongoose.Types.ObjectId;
  effectiveDate: Date;
  address?: string;
  city?: string;
  pinCode?: string;
}

export interface ICompanyGst extends Document {
  company: mongoose.Types.ObjectId;
  state: string;             // State name (e.g. 'GUJARAT')
  stateCode?: string;        // GST state code
  gstNumber: string;
  provisionId?: string;
  contactPerson?: string;
  contactNo?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  invoiceCode?: string;
  remark?: string;
  isISD?: boolean;
  attachmentUrl?: string;

  // Effective-dated address history (modal: GST Address Update With Effective Date)
  addresses: IGstAddressEntry[];

  // E-invoice API credentials
  eInvoiceApiUser?: string;
  eInvoiceApiPassword?: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressEntrySchema = new Schema<IGstAddressEntry>(
  {
    effectiveDate: { type: Date, required: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pinCode: { type: String, trim: true },
  },
  { _id: true, timestamps: false },
);

const schema = new Schema<ICompanyGst>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    state: { type: String, required: [true, 'GST State is required'], trim: true },
    stateCode: { type: String, trim: true },
    gstNumber: { type: String, required: [true, 'GST Number is required'], trim: true, uppercase: true, maxlength: 20 },
    provisionId: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactNo: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pinCode: { type: String, trim: true },
    invoiceCode: { type: String, trim: true },
    remark: { type: String, trim: true },
    isISD: { type: Boolean, default: false },
    attachmentUrl: { type: String, trim: true },
    addresses: { type: [addressEntrySchema], default: [] },
    eInvoiceApiUser: { type: String, trim: true },
    eInvoiceApiPassword: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_d, r: Record<string, any>) { delete r.__v; return r; },
    },
  },
);

schema.index({ gstNumber: 1, company: 1 }, { unique: true });
schema.index({ state: 1, company: 1 });

const CompanyGst: Model<ICompanyGst> = mongoose.model<ICompanyGst>('CompanyGst', schema);
export default CompanyGst;
