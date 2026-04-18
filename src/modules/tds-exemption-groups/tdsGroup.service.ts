import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import TdsGroup, { type ITdsGroup } from './tdsGroup.model.js';

export class TdsGroupService {
  static async getAll(companyId: string) {
    return TdsGroup.find({ isActive: true, company: companyId }).sort({ displayOrder: 1, name: 1 }).lean();
  }
  static async create(data: Partial<ITdsGroup>) { return TdsGroup.create(data); }
  static async update(id: string, data: Partial<ITdsGroup>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await TdsGroup.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Group not found', 404);
    return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await TdsGroup.findOneAndUpdate({ _id: id, company: companyId }, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Group not found', 404);
    return doc;
  }
}
