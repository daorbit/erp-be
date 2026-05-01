import mongoose, { Schema, type Document } from 'mongoose';

export enum ShiftSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface IGpsPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: Date;
}

export interface IShiftSession extends Document {
  employee: mongoose.Types.ObjectId; // EmployeeProfile._id
  user: mongoose.Types.ObjectId; // User._id (the one who punched)
  company: mongoose.Types.ObjectId;
  site?: mongoose.Types.ObjectId; // Assigned Branch/Site user selected while starting shift
  siteLocation?: mongoose.Types.ObjectId; // Location._id linked to the selected site
  shift?: mongoose.Types.ObjectId; // Optional ref to assigned Shift master
  shiftDate: Date; // start-of-day for shiftStartedAt (for grouping per day)

  shiftStartedAt: Date;
  shiftEndedAt?: Date;

  status: ShiftSessionStatus;

  selfieUrl?: string;
  selfiePublicId?: string;

  startLocation?: { latitude: number; longitude: number; accuracy?: number };
  endLocation?: { latitude: number; longitude: number; accuracy?: number };
  latestLocation?: { latitude: number; longitude: number; accuracy?: number; capturedAt?: Date };

  gpsTrail: IGpsPoint[];

  totalDistanceMeters: number; // Computed lazily on each track / on end
  startSiteDistanceMeters?: number;
  latestSiteDistanceMeters?: number;
  endSiteDistanceMeters?: number;
  siteBufferKm?: number;
  latestSiteWithinBuffer?: boolean;
  durationMinutes?: number; // Computed on end
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const gpsPointSchema = new Schema<IGpsPoint>(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number },
    capturedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const shiftSessionSchema = new Schema<IShiftSession>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    site: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    siteLocation: { type: Schema.Types.ObjectId, ref: 'Location', index: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },

    shiftDate: { type: Date, required: true, index: true },
    shiftStartedAt: { type: Date, required: true },
    shiftEndedAt: { type: Date },

    status: {
      type: String,
      enum: Object.values(ShiftSessionStatus),
      default: ShiftSessionStatus.ACTIVE,
      index: true,
    },

    selfieUrl: { type: String },
    selfiePublicId: { type: String },

    startLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
    endLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
    },
    latestLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date },
    },

    gpsTrail: { type: [gpsPointSchema], default: [] },

    totalDistanceMeters: { type: Number, default: 0 },
    startSiteDistanceMeters: { type: Number },
    latestSiteDistanceMeters: { type: Number },
    endSiteDistanceMeters: { type: Number },
    siteBufferKm: { type: Number },
    latestSiteWithinBuffer: { type: Boolean },
    durationMinutes: { type: Number },
    notes: { type: String, trim: true, maxlength: 500 },
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

// Common query patterns
shiftSessionSchema.index({ company: 1, status: 1, shiftDate: -1 });
shiftSessionSchema.index({ employee: 1, shiftDate: -1 });
shiftSessionSchema.index({ user: 1, status: 1 });
shiftSessionSchema.index({ site: 1, status: 1 });

const ShiftSession = mongoose.model<IShiftSession>(
  'ShiftSession',
  shiftSessionSchema,
);

export default ShiftSession;
