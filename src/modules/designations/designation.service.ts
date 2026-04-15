import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Designation, { type IDesignation } from './designation.model.js';
import User from '../auth/auth.model.js';
import Department from '../departments/department.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class DesignationService {
  /**
   * Get all designations with search, filtering, and pagination.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IDesignation>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { rolesAndResponsibility: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.department) {
      filter.departments = filters.department;
    }



    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [designations, total] = await Promise.all([
      Designation.find(filter)
        .populate('departments', 'name shortName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Designation.countDocuments(filter),
    ]);

    return {
      data: designations as any as IDesignation[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a designation by ID.
   */
  static async getById(id: string, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOne(filter)
      .populate('departments', 'name shortName');

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
      .populate('departments', 'name shortName') as unknown as IDesignation;
  }

  /**
   * Update a designation.
   */
  static async update(id: string, data: Partial<IDesignation>, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    ).populate('departments', 'name shortName');

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }

  /**
   * Merge fromDesignation into toDesignation. Reassigns every user's
   * designation from the source to the target, then soft-deletes the source.
   * Company-scoped.
   */
  static async merge(
    fromId: string,
    toId: string,
    companyId?: string,
  ): Promise<{ movedUsers: number; fromDesignation: IDesignation; toDesignation: IDesignation }> {
    if (!mongoose.Types.ObjectId.isValid(fromId) || !mongoose.Types.ObjectId.isValid(toId)) {
      throw new AppError('Invalid designation ID format.', 400);
    }
    if (fromId === toId) {
      throw new AppError('From and To designations must be different.', 400);
    }

    const base: Record<string, unknown> = {};
    if (companyId) base.company = companyId;

    const [fromD, toD] = await Promise.all([
      Designation.findOne({ ...base, _id: fromId }),
      Designation.findOne({ ...base, _id: toId }),
    ]);
    if (!fromD) throw new AppError('Source (From) designation not found.', 404);
    if (!toD) throw new AppError('Target (To) designation not found.', 404);

    const userFilter: Record<string, unknown> = { designation: fromId };
    if (companyId) userFilter.company = companyId;

    const { modifiedCount } = await User.updateMany(userFilter, { $set: { designation: toId } });

    fromD.isActive = false;
    await fromD.save();

    return { movedUsers: modifiedCount ?? 0, fromDesignation: fromD, toDesignation: toD };
  }

  /**
   * Count active users per designation, optionally filtered by branch.
   * Returns [{ designationId, designationName, shortName, count }].
   */
  static async countByBranch(
    companyId: string | undefined,
    branchId?: string,
  ): Promise<Array<{ designationId: string; designationName: string; shortName: string; count: number }>> {
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    const designations = await Designation.find(filter).sort({ displayOrder: 1, name: 1 }).lean();

    const userFilterBase: Record<string, unknown> = { isActive: true };
    if (companyId) userFilterBase.company = companyId;

    // User has no direct `branch` field. A branch filter is applied indirectly
    // by restricting the set of departments first: Department.branches is a
    // Branch ref array, so we only count users whose department belongs to a
    // department that lives in the chosen branch.
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      const deptFilter: Record<string, unknown> = { isActive: true, branches: branchId };
      if (companyId) deptFilter.company = companyId;
      const deptIds = await Department.find(deptFilter).distinct('_id');
      userFilterBase.department = { $in: deptIds };
    }

    const ids = designations.map((d) => d._id);
    const counts = await User.aggregate([
      { $match: { ...userFilterBase, designation: { $in: ids } } },
      { $group: { _id: '$designation', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(
      counts.map((c: { _id: mongoose.Types.ObjectId; count: number }) => [c._id.toString(), c.count]),
    );

    return designations.map((d) => ({
      designationId: d._id.toString(),
      designationName: d.name,
      shortName: d.shortName,
      count: countMap.get(d._id.toString()) ?? 0,
    }));
  }

  /**
   * Soft delete a designation.
   */
  static async delete(id: string, companyId?: string): Promise<IDesignation> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid designation ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const designation = await Designation.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );

    if (!designation) {
      throw new AppError('Designation not found.', 404);
    }

    return designation;
  }
}
