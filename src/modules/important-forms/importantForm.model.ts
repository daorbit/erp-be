import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IImportantForm extends Document {
  name: string;
  fileUrl?: string;       // Path / URL of uploaded form (PDF/XLSX)
  fileName?: string;      // Original filename for display
  showInEmpSection: boolean; // Whether visible to employees in self-service
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IImportantForm>(
  {
    name: { type: String, required: [true, 'Document Name is required'], trim: true, maxlength: 150 },
    fileUrl: { type: String, trim: true },
    fileName: { type: String, trim: true },
    showInEmpSection: { type: Boolean, default: false },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ name: 1, company: 1 }, { unique: true });
schema.index({ isActive: 1 });

const ImportantForm: Model<IImportantForm> = mongoose.model<IImportantForm>('ImportantForm', schema);
export default ImportantForm;
