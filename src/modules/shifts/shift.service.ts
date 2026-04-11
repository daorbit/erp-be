import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Shift, { type IShift } from './shift.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class ShiftService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IShift>> {
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [shifts, total] = await Promise.all([
      Shift.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Shift.countDocuments(filter),
    ]);

    return {
      data: shifts as any as IShift[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string, companyId?: string): Promise<IShift> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid shift ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const shift = await Shift.findOne(filter);
    if (!shift) {
      throw new AppError('Shift not found.', 404);
    }

    return shift;
  }

  static async create(data: Partial<IShift>): Promise<IShift> {
    return Shift.create(data);
  }

  static async update(id: string, data: Partial<IShift>, companyId?: string): Promise<IShift> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid shift ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const shift = await Shift.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!shift) {
      throw new AppError('Shift not found.', 404);
    }

    return shift;
  }

  static async delete(id: string, companyId?: string): Promise<IShift> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid shift ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const shift = await Shift.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );

    if (!shift) {
      throw new AppError('Shift not found.', 404);
    }

    return shift;
  }

  /**
   * Get all active shifts (used by scheduler).
   */
  static async getAllActiveShifts(): Promise<IShift[]> {
    return Shift.find({ isActive: true }).lean() as any as Promise<IShift[]>;
  }
}
