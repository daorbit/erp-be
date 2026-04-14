import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Designation, { type IDesignation } from './designation.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class DesignationService {
  /**
   * Get all designations with search, filtering, and pagination.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IDesignation>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { rolesAndResponsibility: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.department) {
      filter.departments = filters.department;
    }



    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [designations, total] = await Promise.all([
      Designation.find(filter)
        .populate('departments', 'name shortName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Designation.countDocuments(filter),
    ]);

    return {
      data: designations as any as IDesignation[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a designation by ID.
   */
  static async getById(id: string, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOne(filter)
      .populate('departments', 'name shortName');

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }

  /**
   * Create a new designation.
   */
  static async create(data: Partial<IDesignation>): Promise<IDesignation> {
    const designation = await Designation.create(data);

    return Designation.findById(designation._id)
      .populate('departments', 'name shortName') as unknown as IDesignation;
  }

  /**
   * Update a designation.
   */
  static async update(id: string, data: Partial<IDesignation>, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('departments', 'name shortName');

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }

  /**
   * Soft delete a designation.
   */
  static async delete(id: string, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }
}
