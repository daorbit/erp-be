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
  static async getAll(query: IQueryParams): Promise<PaginatedResult<IDesignation>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'level',
      sortOrder = 'asc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.department) {
      filter.department = filters.department;
    }

    if (filters.level) {
      filter.level = Number(filters.level);
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [designations, total] = await Promise.all([
      Designation.find(filter)
        .populate('department', 'name code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Designation.countDocuments(filter),
    ]);

    return {
      data: designations as IDesignation[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a designation by ID.
   */
  static async getById(id: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const designation = await Designation.findById(id)
      .populate('department', 'name code');

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
      .populate('department', 'name code') as unknown as IDesignation;
  }

  /**
   * Update a designation.
   */
  static async update(id: string, data: Partial<IDesignation>): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const designation = await Designation.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('department', 'name code');

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }

  /**
   * Soft delete a designation.
   */
  static async delete(id: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const designation = await Designation.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }
}
