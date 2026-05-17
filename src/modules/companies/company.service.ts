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

  // Every list operation must be scoped to the caller's accessible
  // companies so users can't enumerate other tenants.
  //
  //   accessibleIds === null     → super_admin: all *main* companies only
  //                                (excludes sibling companies so the platform
  //                                 view stays clean)
  //   accessibleIds === []       → user has no companies → return nothing
  //   accessibleIds === [...]    → return exactly those companies
  static async getAll(
    query: IQueryParams,
    accessibleIds: string[] | null,
  ): Promise<PaginatedResult<ICompany>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (accessibleIds === null) {
      // Super admin: only show main companies (exclude sibling companies).
      filter.$or = [{ parentCompany: { $exists: false } }, { parentCompany: null }];
    } else if (accessibleIds.length === 0) {
      // User has no accessible companies — short-circuit to empty result.
      return {
        data: [],
        pagination: buildPagination(page, limit, 0),
      };
    } else {
      const validIds = accessibleIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      filter._id = { $in: validIds };
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

  /**
   * Returns the parent company + all sibling companies for the group the
   * given company belongs to.  Used by the company context switcher UI.
   * Returns lightweight objects (id, name, code, logo, isActive).
   *
   * NOTE: this is the legacy "full group" view used internally for resolving
   * scope (e.g. when expanding a super_admin user's allowedCompanies). For
   * user-facing listings, prefer `getAccessibleCompanies` below — it
   * respects the caller's allowedCompanies grant rather than always
   * returning the whole group.
   */
  static async getGroupCompanies(callerCompanyId?: string): Promise<any[]> {
    const selectFields = '_id name code logo isActive parentCompany';

    if (!callerCompanyId) {
      // super_admin with no company: return all parent companies
      return Company.find({ $or: [{ parentCompany: { $exists: false } }, { parentCompany: null }] })
        .select(selectFields)
        .lean();
    }

    const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);

    return Company.find({
      $or: [{ _id: mainId }, { parentCompany: mainId }],
    })
      .select(selectFields)
      .sort({ parentCompany: 1, name: 1 }) // parent first, then siblings alphabetically
      .lean();
  }

  /**
   * Returns exactly the companies the caller is allowed to see — the
   * intersection of their `allowedCompanies` + own company, or all main
   * companies for platform super_admin. Used by the company context
   * switcher and the Company List page so a site_admin / restricted user
   * sees only their grant, not the whole group.
   */
  static async getAccessibleCompanies(accessibleIds: string[] | null): Promise<any[]> {
    const selectFields = '_id name code logo isActive parentCompany';

    if (accessibleIds === null) {
      return Company.find({ $or: [{ parentCompany: { $exists: false } }, { parentCompany: null }] })
        .select(selectFields)
        .sort({ name: 1 })
        .lean();
    }
    if (accessibleIds.length === 0) return [];

    const validIds = accessibleIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    return Company.find({ _id: { $in: validIds } })
      .select(selectFields)
      .sort({ parentCompany: 1, name: 1 }) // parent first, then siblings
      .lean();
  }
}
