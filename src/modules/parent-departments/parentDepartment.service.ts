import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import ParentDepartment, { type IParentDepartment } from './parentDepartment.model.js';
import { CompanyService } from '../companies/company.service.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

/**
 * Parent Department is *group-level master data* — the parent company and
 * all its sibling companies share a single set of records. Concretely:
 *
 *   • Writes are pinned to the group's main (parent) company ID so a record
 *     created from any sibling lands under the parent and is visible to all.
 *   • Reads span every company in the group via `$in: [mainId, ...siblingIds]`,
 *     which covers legacy records that were written under a sibling before
 *     this master-data semantic was adopted.
 *
 * `callerCompanyId` here is whichever company the user is *currently scoped
 * to* (active company / X-Active-Company). The service resolves it to the
 * group internally — callers don't need to know about the parent/sibling
 * topology.
 */
async function resolveGroupCompanyIds(
  callerCompanyId?: string,
): Promise<{ mainId: string | undefined; groupIds: string[] }> {
  if (!callerCompanyId) return { mainId: undefined, groupIds: [] };
  const mainId = await CompanyService.resolveMainCompanyId(callerCompanyId);
  const group = await CompanyService.getGroupCompanies(mainId);
  const groupIds = group
    .map((c: any) => c._id?.toString?.() ?? String(c._id))
    .filter(Boolean);
  // Always ensure the main itself is in the set even if the group lookup
  // returned an empty list (single-company tenant, no siblings yet).
  if (!groupIds.includes(mainId)) groupIds.push(mainId);
  return { mainId, groupIds };
}

export class ParentDepartmentService {
  static async getAll(
    query: IQueryParams,
    companyId?: string,
    // The legacy `scope` argument used by the controller's scopeFilter is
    // intentionally ignored for this master — group-level semantics override
    // per-company tenant scoping for Parent Department.
    _scope?: Record<string, unknown>,
  ): Promise<PaginatedResult<IParentDepartment>> {
    const { page = 1, limit = 10, search, sortBy = 'displayOrder', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) {
      const { groupIds } = await resolveGroupCompanyIds(companyId);
      // Empty groupIds → caller has no resolvable company → return nothing.
      filter.company = groupIds.length > 0 ? { $in: groupIds } : { $in: [] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      ParentDepartment.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      ParentDepartment.countDocuments(filter),
    ]);

    return { data: data as any as IParentDepartment[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) {
      const { groupIds } = await resolveGroupCompanyIds(companyId);
      filter.company = groupIds.length > 0 ? { $in: groupIds } : { $in: [] };
    }

    const doc = await ParentDepartment.findOne(filter);
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }

  static async create(
    data: Partial<IParentDepartment> & { company?: string },
  ): Promise<IParentDepartment> {
    // Pin writes to the group's main company so every sibling sees the
    // record. If the caller has no company we let the model's `required`
    // validator surface the error.
    if (data.company) {
      const { mainId } = await resolveGroupCompanyIds(String(data.company));
      if (mainId) data.company = mainId as any;
    }
    return ParentDepartment.create(data);
  }

  static async update(
    id: string,
    data: Partial<IParentDepartment>,
    companyId?: string,
  ): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) {
      const { groupIds } = await resolveGroupCompanyIds(companyId);
      filter.company = groupIds.length > 0 ? { $in: groupIds } : { $in: [] };
    }

    const doc = await ParentDepartment.findOneAndUpdate(filter, data, { new: true, runValidators: true });
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }

  static async delete(id: string, companyId?: string): Promise<IParentDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid parent department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) {
      const { groupIds } = await resolveGroupCompanyIds(companyId);
      filter.company = groupIds.length > 0 ? { $in: groupIds } : { $in: [] };
    }

    const doc = await ParentDepartment.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Parent department not found.', 404);
    return doc;
  }
}
