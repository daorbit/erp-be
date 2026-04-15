import mongoose, { Schema, type Document, type Model } from 'mongoose';

// Catalog of *types* of documents (e.g. "AADHAAR CARD", "PAN CARD"). Distinct
// from the existing `documents` module which stores actual uploaded files.
export interface IDocumentMaster extends Document {
  name: string;
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDocumentMaster>(
  {
    name: { type: String, required: [true, 'Document Name is required'], trim: true, maxlength: 100 },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const DocumentMaster: Model<IDocumentMaster> = mongoose.model<IDocumentMaster>('DocumentMaster', schema);
export default DocumentMaster;
