import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import State, { type IState } from './state.model.js';

interface PaginatedResult<T> { data: T[]; pagination: ReturnType<typeof buildPagination>; }

export class StateService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IState>> {
    const { page = 1, limit = 200, search, sortBy = 'name', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { stateCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [states, total] = await Promise.all([
      State.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      State.countDocuments(filter),
    ]);

    return { data: states as any as IState[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<IState> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid state ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const state = await State.findOne(filter);
    if (!state) throw new AppError('State not found.', 404);
    return state;
  }

  static async create(data: Partial<IState>): Promise<IState> {
    return State.create(data);
  }

  static async update(id: string, data: Partial<IState>, companyId?: string): Promise<IState> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid state ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const state = await State.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!state) throw new AppError('State not found.', 404);
    return state;
  }

  static async delete(id: string, companyId?: string): Promise<IState> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid state ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const state = await State.findOneAndUpdate(filter, { $set: { isActive: false } }, { new: true });
    if (!state) throw new AppError('State not found.', 404);
    return state;
  }
}
