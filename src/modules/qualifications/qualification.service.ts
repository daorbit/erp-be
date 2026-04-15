import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Qualification, { type IQualification } from './qualification.model.js';

export class QualificationService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 200, search } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Qualification.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Qualification.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<IQualification> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const doc = await Qualification.findOne(filter);
    if (!doc) throw new AppError('Qualification not found', 404);
    return doc;
  }

  static async create(data: Partial<IQualification>) {
    return Qualification.create(data);
  }

  static async update(id: string, data: Partial<IQualification>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const doc = await Qualification.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Qualification not found', 404);
    return doc;
  }

  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const doc = await Qualification.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Qualification not found', 404);
    return doc;
  }
}
