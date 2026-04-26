import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import AccountGroup, { type IAccountGroup } from './accountGroup.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class AccountGroupService {
  static async getAll(
    query: IQueryParams,
    companyId?: string | string[],
  ): Promise<PaginatedResult<IAccountGroup>> {
    const cid = Array.isArray(companyId) ? companyId[0] : companyId;
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'orderNo',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (cid) filter.company = cid;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { groupNature: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      AccountGroup.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AccountGroup.countDocuments(filter),
    ]);

    return { data: data as any as IAccountGroup[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string | string[]): Promise<IAccountGroup> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Account Group ID.', 400);
    }
    const cid = Array.isArray(companyId) ? companyId[0] : companyId;
    const filter: Record<string, unknown> = { _id: id };
    if (cid) filter.company = cid;

    const group = await AccountGroup.findOne(filter).lean();
    if (!group) throw new AppError('Account Group not found.', 404);
    return group as unknown as IAccountGroup;
  }

  static async create(
    data: Partial<IAccountGroup> & { company: string | string[] },
  ): Promise<IAccountGroup> {
    const companyId = Array.isArray(data.company) ? data.company[0] : data.company;
    const exists = await AccountGroup.findOne({ name: data.name, company: companyId });
    if (exists) throw new AppError('An Account Group with this name already exists.', 409);

    const group = await AccountGroup.create({ ...data, company: companyId });
    return group;
  }

  static async update(
    id: string,
    data: Partial<IAccountGroup>,
    companyId?: string | string[],
  ): Promise<IAccountGroup> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Account Group ID.', 400);
    }
    const cid = Array.isArray(companyId) ? companyId[0] : companyId;

    if (data.name) {
      const conflict = await AccountGroup.findOne({
        _id: { $ne: id },
        name: data.name,
        company: cid,
      });
      if (conflict) throw new AppError('An Account Group with this name already exists.', 409);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (cid) filter.company = cid;

    const updated = await AccountGroup.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) throw new AppError('Account Group not found.', 404);
    return updated as unknown as IAccountGroup;
  }

  static async remove(id: string, companyId?: string | string[]): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid Account Group ID.', 400);
    }
    const cid = Array.isArray(companyId) ? companyId[0] : companyId;
    const filter: Record<string, unknown> = { _id: id };
    if (cid) filter.company = cid;

    const result = await AccountGroup.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );
    if (!result) throw new AppError('Account Group not found.', 404);
  }
}
