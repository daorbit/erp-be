import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import EmployeeGroup, { type IEmployeeGroup } from './employeeGroup.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class EmployeeGroupService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IEmployeeGroup>> {
    const { page = 1, limit = 100, search, sortBy = 'name', sortOrder = 'asc' } = query;

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

    const [groups, total] = await Promise.all([
      EmployeeGroup.find(filter)
        .populate('branches', 'name code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      EmployeeGroup.countDocuments(filter),
    ]);

    return {
      data: groups as any as IEmployeeGroup[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string, companyId?: string): Promise<IEmployeeGroup> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Employee Group ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const group = await EmployeeGroup.findOne(filter).populate('branches', 'name code');
    if (!group) throw new AppError('Employee Group not found.', 404);
    return group;
  }

  static async create(data: Partial<IEmployeeGroup>): Promise<IEmployeeGroup> {
    const group = await EmployeeGroup.create(data);
    return EmployeeGroup.findById(group._id).populate('branches', 'name code') as unknown as IEmployeeGroup;
  }

  static async update(id: string, data: Partial<IEmployeeGroup>, companyId?: string): Promise<IEmployeeGroup> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Employee Group ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const group = await EmployeeGroup.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('branches', 'name code');
    if (!group) throw new AppError('Employee Group not found.', 404);
    return group;
  }

  static async delete(id: string, companyId?: string): Promise<IEmployeeGroup> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Employee Group ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const group = await EmployeeGroup.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );
    if (!group) throw new AppError('Employee Group not found.', 404);
    return group;
  }
}
