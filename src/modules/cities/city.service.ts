import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import City, { type ICity } from './city.model.js';

export class CityService {
  static async getAll(query: IQueryParams, companyId?: string, scope?: Record<string, unknown>) {
    const { page = 1, limit = 500, search, filters = {} } = query;
    const filter: Record<string, unknown> = { isActive: true };
    // Apply userType-driven scope (sets company: { $in: [...] } typically).
    if (scope) Object.assign(filter, scope);
    const companyCondition = companyId
      ? [{ company: new mongoose.Types.ObjectId(companyId) }, { company: { $exists: false } }]
      : null;
    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { pinCode: { $regex: search, $options: 'i' } },
      ];
      if (companyCondition) {
        filter.$and = [{ $or: companyCondition }, { $or: searchOr }];
      } else {
        filter.$or = searchOr;
      }
    } else if (companyCondition) {
      filter.$or = companyCondition;
    }
    if (filters.state) filter.state = filters.state;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      City.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      City.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id };
    if (companyId) {
      f.$or = [{ company: new mongoose.Types.ObjectId(companyId) }, { company: { $exists: false } }];
    }
    const doc = await City.findOne(f); if (!doc) throw new AppError('City not found', 404); return doc;
  }
  static async create(data: Partial<ICity>) { return City.create(data); }
  static async update(id: string, data: Partial<ICity>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    // Only allow updating company-owned cities; global seeded cities are read-only
    const f: Record<string, unknown> = { _id: id, company: { $exists: true } };
    if (companyId) f.company = new mongoose.Types.ObjectId(companyId);
    const doc = await City.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('City not found or is a global city that cannot be modified', 404); return doc;
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    // Only allow deleting company-owned cities; global seeded cities are read-only
    const f: Record<string, unknown> = { _id: id, company: { $exists: true } };
    if (companyId) f.company = new mongoose.Types.ObjectId(companyId);
    const doc = await City.findOneAndUpdate(f, { isActive: false }, { new: true });
    if (!doc) throw new AppError('City not found or is a global city that cannot be modified', 404); return doc;
  }
}
