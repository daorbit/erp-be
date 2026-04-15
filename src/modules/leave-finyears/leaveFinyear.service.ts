import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import LeaveFinyear, { type ILeaveFinyear } from './leaveFinyear.model.js';

export class LeaveFinyearService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 200 } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      LeaveFinyear.find(filter).sort({ dateFrom: -1 }).skip(skip).limit(limit).lean(),
      LeaveFinyear.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await LeaveFinyear.findOne(f); if (!doc) throw new AppError('Leave Finyear not found', 404); return doc;
  }
  static async create(data: Partial<ILeaveFinyear>) { return LeaveFinyear.create(data); }
  static async update(id: string, data: Partial<ILeaveFinyear>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await LeaveFinyear.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Leave Finyear not found', 404); return doc;
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await LeaveFinyear.findOneAndUpdate(f, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Leave Finyear not found', 404); return doc;
  }
}
