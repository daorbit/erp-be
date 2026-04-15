import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IImageGallery extends Document {
  title: string;
  isShow: boolean;
  isYoutubeVideo: boolean;
  imageUrl?: string;          // Uploaded image path OR YouTube URL
  company: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IImageGallery>(
  {
    title: { type: String, required: [true, 'Title Name is required'], trim: true, maxlength: 150 },
    isShow: { type: Boolean, default: false },
    isYoutubeVideo: { type: Boolean, default: false },
    imageUrl: { type: String, trim: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true, transform(_d, r: Record<string, any>) { delete r.__v; return r; } } },
);
schema.index({ title: 1, company: 1 }, { unique: true });

const ImageGallery: Model<IImageGallery> = mongoose.model<IImageGallery>('ImageGallery', schema);
export default ImageGallery;
