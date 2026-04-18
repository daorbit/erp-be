import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Grade, { type IGrade } from './grade.model.js';

export class GradeService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 200, search, filters = {} } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (filters.level) filter.level = filters.level;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Grade.find(filter).populate('level', 'name shortName').sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Grade.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Grade.findOne(f).populate('level', 'name shortName');
    if (!doc) throw new AppError('Grade not found', 404); return doc;
  }
  static async create(data: Partial<IGrade>) {
    const doc = await Grade.create(data);
    return Grade.findById(doc._id).populate('level', 'name shortName') as unknown as IGrade;
  }
  static async update(id: string, data: Partial<IGrade>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Grade.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true }).populate('level', 'name shortName');
    if (!doc) throw new AppError('Grade not found', 404); return doc;
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Grade.findOneAndUpdate(f, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Grade not found', 404); return doc;
  }
}
