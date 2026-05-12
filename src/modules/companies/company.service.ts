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
  /**
   * Returns the "main company" ID for a given company.
   * If the company has a parentCompany, that is the main company.
   * Otherwise the company itself is the main company.
   */
  static async resolveMainCompanyId(companyId: string): Promise<string> {
    if (!mongoose.Types.ObjectId.isValid(companyId)) return companyId;
    const company = await Company.findById(companyId).select('parentCompany').lean();
    return company?.parentCompany?.toString() ?? companyId;
  }

  // When the caller is a company admin (anyone other than super_admin), every
  // operation must be scoped to their own company group so they can't enumerate
  // or mutate other tenants.
  //
  // For admin role: returns own company + all sibling companies in the group.
  // For super_admin: returns all companies.
  static async getAll(
    query: IQueryParams,
    callerCompanyId?: string,
  ): Promise<PaginatedResult<ICompany>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (callerCompanyId) {
      if (!mongoose.Types.ObjectId.isValid(callerCompanyId)) {
        throw new AppError('Invalid company scope.', 400);
      }
      // Resolve the main company so we can list the full group.
      const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);
      // Show main company + all siblings (companies whose parentCompany = mainId).
      filter.$or = [
        { _id: mainId },
        { parentCompany: mainId },
      ];
    } else {
      // Super admin: only show main companies (exclude sibling companies).
      filter.$or = [{ parentCompany: { $exists: false } }, { parentCompany: null }];
    }

    if (search) {
      const searchFilter = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
      if (filter.$or) {
        // Combine group scope with search using $and
        filter.$and = [
          { $or: filter.$or },
          { $or: searchFilter },
        ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
      }
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

  static async getById(id: string, callerCompanyId?: string): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }

    if (callerCompanyId) {
      // Allow access to own company or any company in the same group.
      const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);
      const company = await Company.findById(id);
      if (!company) throw new AppError('Company not found.', 404);

      const companyMainId = company.parentCompany?.toString() ?? company._id.toString();
      if (companyMainId !== mainId && company._id.toString() !== mainId) {
        throw new AppError('Company not found.', 404);
      }
      return company;
    }

    const company = await Company.findById(id);
    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }

  /** Super Admin creates a main company (no parentCompany). */
  static async create(data: Partial<ICompany>): Promise<ICompany> {
    const company = await Company.create(data);
    return company;
  }

  /**
   * Admin (Firm User) creates a sibling company under their group.
   * `parentCompanyId` is the caller's main company ID (resolved by the controller).
   */
  static async createSibling(
    data: Partial<ICompany>,
    parentCompanyId: string,
  ): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(parentCompanyId)) {
      throw new AppError('Invalid parent company ID.', 400);
    }
    const parent = await Company.findById(parentCompanyId);
    if (!parent) throw new AppError('Parent company not found.', 404);
    // Siblings always point at the true main company (no chaining).
    if (parent.parentCompany) {
      throw new AppError('Cannot create a sibling under another sibling.', 400);
    }

    const company = await Company.create({ ...data, parentCompany: parentCompanyId });
    return company;
  }

  static async update(
    id: string,
    data: Partial<ICompany>,
    callerCompanyId?: string,
  ): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }
    if (callerCompanyId) {
      // Admins can only update companies within their own group.
      const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);
      const target = await Company.findById(id);
      if (!target) throw new AppError('Company not found.', 404);
      const targetMainId = target.parentCompany?.toString() ?? target._id.toString();
      if (targetMainId !== mainId && target._id.toString() !== mainId) {
        throw new AppError('Company not found.', 404);
      }
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

  static async delete(id: string, callerCompanyId?: string): Promise<ICompany> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid company ID format.', 400);
    }

    if (callerCompanyId) {
      // Admins may only delete sibling companies they own — not the main company.
      const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);
      const target = await Company.findById(id);
      if (!target) throw new AppError('Company not found.', 404);

      // The target must be a sibling in this group (has parentCompany = mainId).
      if (!target.parentCompany || target.parentCompany.toString() !== mainId) {
        throw new AppError(
          'You can only delete sibling companies in your group, not the main company.',
          403,
        );
      }
    }

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }
}
