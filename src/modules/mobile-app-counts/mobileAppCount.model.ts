import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Tracks mobile-app license counts per company across multiple app types
// (ERP, HRM, GeoTagging, Transport, TaskManagement) for both client + Nway team.
export type AppType = 'erp' | 'hrm' | 'geo_tagging' | 'transport' | 'task_management';
export const APP_TYPES: AppType[] = ['erp', 'hrm', 'geo_tagging', 'transport', 'task_management'];

export interface IAppLimit {
  total?: number;  // No. of available app
  used?: number;   // Used app
}

export interface IAppLimitHistoryEntry {
  entryByName?: string;
  mobile?: string;
  client: Record<AppType, number>;
  nway: Record<AppType, number>;
  remark?: string;
  createdAt?: Date;
}

export interface IActivationUser {
  _id?: mongoose.Types.ObjectId;
  userName: string;
  mobile: string;
  password?: string;
  isActive: boolean;
  appType?: AppType;
  createdAt?: Date;
}

export interface IMobileAppCount extends Document {
  company: mongoose.Types.ObjectId;
  client: Record<AppType, IAppLimit>;
  nway: Record<AppType, IAppLimit>;
  activationUsers: IActivationUser[];
  history: IAppLimitHistoryEntry[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activationUserSchema = new Schema<IActivationUser>({
  userName: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  password: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  appType: { type: String, trim: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const historySchema = new Schema<IAppLimitHistoryEntry>({
  entryByName: { type: String, trim: true },
  mobile: { type: String, trim: true },
  client: { type: Object, default: {} },
  nway: { type: Object, default: {} },
  remark: { type: String, trim: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const schema = new Schema<IMobileAppCount>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true, index: true },
    client: { type: Object, default: {} },
    nway: { type: Object, default: {} },
    activationUsers: { type: [activationUserSchema], default: [] },
    history: { type: [historySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } },
  },
);

const MobileAppCount: Model<IMobileAppCount> = mongoose.model<IMobileAppCount>('MobileAppCount', schema);
export default MobileAppCount;
