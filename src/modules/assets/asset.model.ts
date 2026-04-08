import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum AssetCategory {
  LAPTOP = 'Laptop',
  DESKTOP = 'Desktop',
  MONITOR = 'Monitor',
  PHONE = 'Phone',
  TABLET = 'Tablet',
  FURNITURE = 'Furniture',
  VEHICLE = 'Vehicle',
  SOFTWARE = 'Software',
  OTHER = 'Other',
}

export enum AssetCondition {
  NEW = 'New',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  DAMAGED = 'Damaged',
  DISPOSED = 'Disposed',
}

export enum AssetStatus {
  AVAILABLE = 'Available',
  ASSIGNED = 'Assigned',
  IN_REPAIR = 'InRepair',
  DISPOSED = 'Disposed',
  LOST = 'Lost',
}

// ─── Sub-Interface ──────────────────────────────────────────────────────────

export interface IAssignmentHistory {
  employee: mongoose.Types.ObjectId;
  assignedDate: Date;
  returnedDate?: Date;
  condition?: string;
  notes?: string;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAsset extends Document {
  name: string;
  assetTag: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  condition: AssetCondition;
  status: AssetStatus;
  assignedTo?: mongoose.Types.ObjectId;
  assignedDate?: Date;
  location?: string;
  specifications?: Map<string, string>;
  notes?: string;
  assignmentHistory: IAssignmentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schema ─────────────────────────────────────────────────────────────

const assignmentHistorySchema = new Schema<IAssignmentHistory>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    assignedDate: {
      type: Date,
      required: [true, 'Assigned date is required'],
    },
    returnedDate: {
      type: Date,
    },
    condition: {
      type: String,
      trim: true,
      maxlength: [100, 'Condition cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { _id: true },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const assetSchema = new Schema<IAsset>(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    assetTag: {
      type: String,
      unique: true,
      required: [true, 'Asset tag is required'],
      trim: true,
      match: [/^AST-\d{4}-\d{3,}$/, 'Asset tag must follow the format AST-YYYY-NNN'],
    },
    category: {
      type: String,
      enum: Object.values(AssetCategory),
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand cannot exceed 100 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [100, 'Model cannot exceed 100 characters'],
    },
    serialNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Serial number cannot exceed 100 characters'],
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
    },
    warrantyExpiry: {
      type: Date,
    },
    condition: {
      type: String,
      enum: Object.values(AssetCondition),
      default: AssetCondition.NEW,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.AVAILABLE,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    specifications: {
      type: Map,
      of: String,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    assignmentHistory: [assignmentHistorySchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

assetSchema.index({ assetTag: 1 });
assetSchema.index({ name: 'text', brand: 'text', serialNumber: 'text' });
assetSchema.index({ category: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ condition: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ warrantyExpiry: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Asset: Model<IAsset> = mongoose.model<IAsset>('Asset', assetSchema);

export default Asset;
