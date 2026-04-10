import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum DocumentCategory {
  POLICY = 'policy',
  TEMPLATE = 'template',
  LETTER = 'letter',
  CERTIFICATE = 'certificate',
  ID_PROOF = 'id_proof',
  ADDRESS_PROOF = 'address_proof',
  EDUCATIONAL = 'educational',
  EXPERIENCE = 'experience',
  OTHER = 'other',
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDocument extends Document {
  title: string;
  company: mongoose.Types.ObjectId;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  employee?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  expiryDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(DocumentCategory),
      required: [true, 'Category is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: [200, 'File name cannot exceed 200 characters'],
    },
    fileType: {
      type: String,
      trim: true,
      maxlength: [50, 'File type cannot exceed 50 characters'],
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
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

documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ employee: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ isPublic: 1 });
documentSchema.index({ expiryDate: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const DocumentModel: Model<IDocument> = mongoose.model<IDocument>(
  'Document',
  documentSchema,
);

export default DocumentModel;
