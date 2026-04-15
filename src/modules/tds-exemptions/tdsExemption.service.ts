import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import TdsExemption, { type ITdsExemption } from './tdsExemption.model.js';

export class TdsExemptionService {
  static async getAll(companyId: string) {
    return TdsExemption.find({ isActive: true, company: companyId })
      .populate('group', 'name sectionHead')
      .populate('salaryHeadMap', 'name printName')
      .sort({ name: 1 })
      .lean();
  }
  static async getById(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await TdsExemption.findOne({ _id: id, company: companyId })
      .populate('group', 'name sectionHead')
      .populate('salaryHeadMap', 'name printName');
    if (!doc) throw new AppError('Exemption not found', 404);
    return doc;
  }
  static async create(data: Partial<ITdsExemption>) { return TdsExemption.create(data); }
  static async update(id: string, data: Partial<ITdsExemption>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await TdsExemption.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Exemption not found', 404);
    return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await TdsExemption.findOneAndUpdate({ _id: id, company: companyId }, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Exemption not found', 404);
    return doc;
  }
}
