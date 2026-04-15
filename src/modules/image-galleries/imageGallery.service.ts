import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import ImageGallery, { type IImageGallery } from './imageGallery.model.js';

export class ImageGalleryService {
  static async getAll(companyId: string) {
    return ImageGallery.find({ isActive: true, company: companyId }).sort({ createdAt: -1 }).lean();
  }
  static async create(data: Partial<IImageGallery>) { return ImageGallery.create(data); }
  static async update(id: string, data: Partial<IImageGallery>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await ImageGallery.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Not found', 404); return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await ImageGallery.findOneAndUpdate({ _id: id, company: companyId }, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Not found', 404); return doc;
  }
}
