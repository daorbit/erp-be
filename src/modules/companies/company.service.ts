import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Company, { type ICompany } from './company.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class CompanyService {
  static async getAll(query: IQueryParams): Promise<PaginatedResult<ICompany>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    return {
      data: companies as any as ICompany[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }

    const company = await Company.findById(id);
    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }

  static async create(data: Partial<ICompany>): Promise<ICompany> {
    const company = await Company.create(data);
    return company;
  }

  static async update(id: string, data: Partial<ICompany>): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }

  static async delete(id: string): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }
}
