import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum HolidayType {
  PUBLIC = 'public',
  RELIGIOUS = 'religious',
  COMPANY_SPECIFIC = 'company_specific',
  OPTIONAL = 'optional',
}

export enum HolidayApplicableFor {
  ALL = 'all',
  SPECIFIC_DEPARTMENTS = 'specific_departments',
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IHoliday extends Document {
  name: string;
  company: mongoose.Types.ObjectId;
  date: Date;
  type: HolidayType;
  description?: string;
  isOptional: boolean;
  year: number;
  applicableFor: HolidayApplicableFor;
  departments: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const holidaySchema = new Schema<IHoliday>(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    type: {
      type: String,
      enum: Object.values(HolidayType),
      required: [true, 'Holiday type is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2000, 'Year must be at least 2000'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    applicableFor: {
      type: String,
      enum: Object.values(HolidayApplicableFor),
      default: HolidayApplicableFor.ALL,
    },
    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
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

// ─── Indexes ─────────────────────────────────────────────────────────────────

holidaySchema.index({ date: 1 });
holidaySchema.index({ year: 1 });
holidaySchema.index({ type: 1 });
holidaySchema.index({ name: 'text', description: 'text' });
holidaySchema.index({ applicableFor: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Holiday: Model<IHoliday> = mongoose.model<IHoliday>('Holiday', holidaySchema);

export default Holiday;
