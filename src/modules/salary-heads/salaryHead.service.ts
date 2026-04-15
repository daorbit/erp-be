import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import SalaryHead, { type ISalaryHead } from './salaryHead.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class SalaryHeadService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<ISalaryHead>> {
    const { page = 1, limit = 200, search, sortBy = 'displayOrder', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { printName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [heads, total] = await Promise.all([
      SalaryHead.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      SalaryHead.countDocuments(filter),
    ]);

    return {
      data: heads as any as ISalaryHead[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string, companyId?: string): Promise<ISalaryHead> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Head ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const head = await SalaryHead.findOne(filter);
    if (!head) throw new AppError('Salary Head not found.', 404);
    return head;
  }

  static async create(data: Partial<ISalaryHead>): Promise<ISalaryHead> {
    return SalaryHead.create(data);
  }

  static async update(id: string, data: Partial<ISalaryHead>, companyId?: string): Promise<ISalaryHead> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Head ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const head = await SalaryHead.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!head) throw new AppError('Salary Head not found.', 404);
    return head;
  }

  static async delete(id: string, companyId?: string): Promise<ISalaryHead> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Head ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const head = await SalaryHead.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!head) throw new AppError('Salary Head not found.', 404);
    return head;
  }
}
