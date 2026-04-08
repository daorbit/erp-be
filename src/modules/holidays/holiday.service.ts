import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Holiday, { type IHoliday } from './holiday.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class HolidayService {
  /**
   * Get all holidays with filter by year/type, sorted by date.
   */
  static async getAll(query: IQueryParams): Promise<PaginatedResult<IHoliday>> {
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = 'date',
      sortOrder = 'asc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.year) {
      filter.year = Number(filters.year);
    }

    if (filters.type) {
      filter.type = filters.type;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [holidays, total] = await Promise.all([
      Holiday.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Holiday.countDocuments(filter),
    ]);

    return {
      data: holidays as any as IHoliday[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a holiday by ID.
   */
  static async getById(id: string): Promise<IHoliday> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid holiday ID format.', 400);
    }

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw new AppError('Holiday not found.', 404);
    }

    return holiday;
  }

  /**
   * Create a new holiday.
   */
  static async create(data: Partial<IHoliday>): Promise<IHoliday> {
    // Auto-set year from date if not provided
    if (data.date && !data.year) {
      data.year = dayjs(data.date).year();
    }

    return Holiday.create(data);
  }

  /**
   * Update a holiday.
   */
  static async update(id: string, data: Partial<IHoliday>): Promise<IHoliday> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid holiday ID format.', 400);
    }

    // Update year if date changes
    if (data.date && !data.year) {
      data.year = dayjs(data.date).year();
    }

    const holiday = await Holiday.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!holiday) {
      throw new AppError('Holiday not found.', 404);
    }

    return holiday;
  }

  /**
   * Soft delete a holiday.
   */
  static async delete(id: string): Promise<IHoliday> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid holiday ID format.', 400);
    }

    const holiday = await Holiday.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!holiday) {
      throw new AppError('Holiday not found.', 404);
    }

    return holiday;
  }

  /**
   * Get all holidays for a specific year.
   */
  static async getByYear(year: number): Promise<IHoliday[]> {
    const holidays = await Holiday.find({
      year,
      isActive: true,
    })
      .sort({ date: 1 })
      .lean();

    return holidays as any as IHoliday[];
  }

  /**
   * Get the next N upcoming holidays from today.
   */
  static async getUpcoming(limit: number = 5): Promise<IHoliday[]> {
    const today = dayjs().startOf('day').toDate();

    const holidays = await Holiday.find({
      date: { $gte: today },
      isActive: true,
    })
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    return holidays as any as IHoliday[];
  }
}
