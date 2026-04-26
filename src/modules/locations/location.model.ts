import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILocationRouteEntry {
  // Per-row "this location → that location" distance used by Add → Route Detail.
  toLocation?: mongoose.Types.ObjectId | string;
  km?: number;
  // Legacy / via-route freeform shape kept for backwards compatibility.
  routeName?: string;
  distance?: number;
  remarks?: string;
  chainagePoint?: number;
}

export interface ILocation extends Document {
  name: string;
  site: mongoose.Types.ObjectId;  // ref: Branch
  company: mongoose.Types.ObjectId;
  contactPerson1?: string;
  contactPerson2?: string;
  storeManager?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  locationType?: string;
  orderNo?: number;
  city?: string;
  pinCode?: string;
  routeDetails?: ILocationRouteEntry[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const routeEntrySchema = new Schema<ILocationRouteEntry>(
  {
    toLocation: { type: Schema.Types.ObjectId, ref: 'Location' },
    km: { type: Number },
    routeName: { type: String, trim: true },
    distance: { type: Number },
    chainagePoint: { type: Number },
    remarks: { type: String, trim: true },
  },
  { _id: false },
);

const schema = new Schema<ILocation>(
  {
    name: { type: String, required: [true, 'Location Name is required'], trim: true, maxlength: 100 },
    site: { type: Schema.Types.ObjectId, ref: 'Branch', required: [true, 'Site is required'], index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    contactPerson1: { type: String, trim: true, maxlength: 100 },
    contactPerson2: { type: String, trim: true, maxlength: 100 },
    storeManager: { type: String, trim: true, maxlength: 100 },
    address1: { type: String, trim: true, maxlength: 100 },
    address2: { type: String, trim: true, maxlength: 100 },
    address3: { type: String, trim: true, maxlength: 100 },
    locationType: { type: String, trim: true, maxlength: 50 },
    orderNo: { type: Number, default: 0 },
    city: { type: String, trim: true, maxlength: 100 },
    pinCode: { type: String, trim: true, maxlength: 10 },
    routeDetails: { type: [routeEntrySchema], default: [] },
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

schema.index({ name: 1, site: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const Location: Model<ILocation> = mongoose.model<ILocation>('Location', schema);
export default Location;
