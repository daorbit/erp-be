import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Branch, { type IBranch } from './branch.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class BranchService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IBranch>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [branches, total] = await Promise.all([
      Branch.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Branch.countDocuments(filter),
    ]);

    return {
      data: branches as any as IBranch[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string, companyId?: string): Promise<IBranch> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid branch ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const branch = await Branch.findOne(filter);
    if (!branch) throw new AppError('Branch not found.', 404);
    return branch;
  }

  static async create(data: Partial<IBranch>): Promise<IBranch> {
    return Branch.create(data);
  }

  static async update(id: string, data: Partial<IBranch>, companyId?: string): Promise<IBranch> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid branch ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const branch = await Branch.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!branch) throw new AppError('Branch not found.', 404);
    return branch;
  }

  static async delete(id: string, companyId?: string): Promise<IBranch> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid branch ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const branch = await Branch.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!branch) throw new AppError('Branch not found.', 404);
    return branch;
  }
}
