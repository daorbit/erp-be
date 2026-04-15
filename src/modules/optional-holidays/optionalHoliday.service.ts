import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import OptionalHoliday, { type IOptionalHoliday } from './optionalHoliday.model.js';

export class OptionalHolidayService {
  static async getAll(companyId: string, finyearId?: string) {
    const filter: Record<string, unknown> = { isActive: true, company: companyId };
    if (finyearId) filter.finyear = finyearId;
    return OptionalHoliday.find(filter).sort({ date: 1 }).lean();
  }
  static async create(data: Partial<IOptionalHoliday>) { return OptionalHoliday.create(data); }
  static async update(id: string, data: Partial<IOptionalHoliday>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await OptionalHoliday.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Not found', 404);
    return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await OptionalHoliday.findOneAndUpdate({ _id: id, company: companyId }, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Not found', 404);
    return doc;
  }
}
