import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import ParentDepartment, { type IParentDepartment } from './parentDepartment.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class ParentDepartmentService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IParentDepartment>> {
    const { page = 1, limit = 10, search, sortBy = 'displayOrder', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ParentDepartment.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      ParentDepartment.countDocuments(filter),
    ]);

    return { data: data as any as IParentDepartment[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const doc = await ParentDepartment.findOne(filter);
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }

  static async create(data: Partial<IParentDepartment>): Promise<IParentDepartment> {
    return ParentDepartment.create(data);
  }

  static async update(id: string, data: Partial<IParentDepartment>, companyId?: string): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const doc = await ParentDepartment.findOneAndUpdate(filter, data, { new: true, runValidators: true });
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }

  static async delete(id: string, companyId?: string): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const doc = await ParentDepartment.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }
}
