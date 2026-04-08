import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum AnnouncementCategory {
  GENERAL = 'General',
  POLICY = 'Policy',
  EVENT = 'Event',
  ACHIEVEMENT = 'Achievement',
  URGENT = 'Urgent',
  MAINTENANCE = 'Maintenance',
}

export enum AnnouncementPriority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TargetAudience {
  ALL = 'All',
  DEPARTMENT = 'Department',
  DESIGNATION = 'Designation',
  SPECIFIC = 'Specific',
}

// ─── Sub-Interfaces ─────────────────────────────────────────────────────────

export interface IAnnouncementAttachment {
  name: string;
  fileUrl: string;
}

export interface IReadReceipt {
  employee: mongoose.Types.ObjectId;
  readAt: Date;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetAudience: TargetAudience;
  departments: mongoose.Types.ObjectId[];
  attachments: IAnnouncementAttachment[];
  publishDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  isPinned: boolean;
  createdBy: mongoose.Types.ObjectId;
  readBy: IReadReceipt[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ────────────────────────────────────────────────────────────

const attachmentSchema = new Schema<IAnnouncementAttachment>(
  {
    name: {
      type: String,
      required: [true, 'Attachment name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
  },
  { _id: true },
);

const readReceiptSchema = new Schema<IReadReceipt>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(AnnouncementCategory),
      default: AnnouncementCategory.GENERAL,
    },
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.NORMAL,
    },
    targetAudience: {
      type: String,
      enum: Object.values(TargetAudience),
      default: TargetAudience.ALL,
    },
    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    attachments: [attachmentSchema],
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    readBy: [readReceiptSchema],
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

announcementSchema.index({ title: 'text', content: 'text' });
announcementSchema.index({ category: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ isActive: 1, publishDate: -1 });
announcementSchema.index({ expiryDate: 1 });
announcementSchema.index({ isPinned: -1, publishDate: -1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ 'readBy.employee': 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>(
  'Announcement',
  announcementSchema,
);

export default Announcement;
