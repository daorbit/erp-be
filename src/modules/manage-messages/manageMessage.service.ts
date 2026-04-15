import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import ManageMessage, { type IManageMessage } from './manageMessage.model.js';

export class ManageMessageService {
  static async getAll(companyId: string) {
    return ManageMessage.find({ company: companyId }).sort({ date: -1 })
      .populate('recipients', 'firstName lastName').lean();
  }
  static async getById(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await ManageMessage.findOne({ _id: id, company: companyId })
      .populate('recipients', 'firstName lastName');
    if (!doc) throw new AppError('Message not found', 404);
    return doc;
  }
  static async create(data: Partial<IManageMessage>) { return ManageMessage.create(data); }
  static async update(id: string, data: Partial<IManageMessage>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await ManageMessage.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Message not found', 404);
    return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const r = await ManageMessage.deleteOne({ _id: id, company: companyId });
    if (r.deletedCount === 0) throw new AppError('Message not found', 404);
    return { deleted: true };
  }
}
