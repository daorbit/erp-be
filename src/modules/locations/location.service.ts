import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Location, { type ILocation } from './location.model.js';

interface PaginatedResult<T> { data: T[]; pagination: ReturnType<typeof buildPagination>; }

export class LocationService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<ILocation>> {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [locations, total] = await Promise.all([
      Location.find(filter).populate('site', 'name code').sort(sortOptions).skip(skip).limit(limit).lean(),
      Location.countDocuments(filter),
    ]);

    return { data: locations as any as ILocation[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOne(filter).populate('site', 'name code');
    if (!loc) throw new AppError('Location not found.', 404);
    return loc;
  }

  static async create(data: Partial<ILocation>): Promise<ILocation> {
    return Location.create(data);
  }

  static async update(id: string, data: Partial<ILocation>, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!loc) throw new AppError('Location not found.', 404);
    return loc;
  }

  static async delete(id: string, companyId?: string): Promise<ILocation> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid location ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const loc = await Location.findOneAndUpdate(filter, { $set: { isActive: false } }, { new: true });
    if (!loc) throw new AppError('Location not found.', 404);
    return loc;
  }
}
