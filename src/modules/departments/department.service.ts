import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Department, { type IDepartment } from './department.model.js';
import User from '../auth/auth.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

interface DepartmentTreeNode {
  _id: string;
  name: string;
  shortName: string;
  description?: string;
  // headOfDepartment?: unknown;
  displayOrder: number;
  isActive: boolean;
  children: DepartmentTreeNode[];
}

export class DepartmentService {
  /**
   * Get all departments with search, pagination, and population.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IDepartment>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [departments, total] = await Promise.all([
      Department.find(filter)
        // .populate('headOfDepartment', 'firstName lastName email')
        .populate('parentDepartment', 'name shortName')
        .populate('branches', 'name code')
        .populate('employeeCount')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Department.countDocuments(filter),
    ]);

    return {
      data: departments as any as IDepartment[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a department by ID with employee count.
   */
  static async getById(id: string, companyId?: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const department = await Department.findOne(filter)
      // .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name shortName')
      .populate('branches', 'name code')
      .populate('employeeCount');

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return department;
  }

  /**
   * Create a new department.
   */
  static async create(data: Partial<IDepartment>): Promise<IDepartment> {
    const department = await Department.create(data);

    return Department.findById(department._id)
      // .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name shortName')
      .populate('branches', 'name code') as unknown as IDepartment;
  }

  /**
   * Update a department.
   */
  static async update(id: string, data: Partial<IDepartment>, companyId?: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    // Prevent circular parent reference
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const department = await Department.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    )
      // .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name shortName')
      .populate('branches', 'name code');

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return department;
  }

  /**
   * Soft delete a department.
   */
  static async delete(id: string, companyId?: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const department = await Department.findOneAndUpdate(
      filter,
      { isActive: false },
      { new: true },
    );

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return department;
  }

  /**
   * Merge `fromDepartment` into `toDepartment`: reassign every user whose
   * department is the source to the destination, then soft-delete the source.
   * Both departments must belong to the caller's company.
   */
  static async merge(
    fromId: string,
    toId: string,
    companyId?: string,
  ): Promise<{ movedUsers: number; fromDepartment: IDepartment; toDepartment: IDepartment }> {
    if (!mongoose.Types.ObjectId.isValid(fromId) || !mongoose.Types.ObjectId.isValid(toId)) {
      throw new AppError('Invalid department ID format.', 400);
    }
    if (fromId === toId) {
      throw new AppError('From and To departments must be different.', 400);
    }

    const filterBase: Record<string, unknown> = {};
    if (companyId) filterBase.company = companyId;

    const [fromDept, toDept] = await Promise.all([
      Department.findOne({ ...filterBase, _id: fromId }),
      Department.findOne({ ...filterBase, _id: toId }),
    ]);

    if (!fromDept) throw new AppError('Source (From) department not found.', 404);
    if (!toDept) throw new AppError('Target (To) department not found.', 404);

    // Reassign all users in the source department to the target department.
    const userFilter: Record<string, unknown> = { department: fromId };
    if (companyId) userFilter.company = companyId;

    const { modifiedCount } = await User.updateMany(userFilter, { $set: { department: toId } });

    // Soft-delete the source department.
    fromDept.isActive = false;
    await fromDept.save();

    return {
      movedUsers: modifiedCount ?? 0,
      fromDepartment: fromDept,
      toDepartment: toDept,
    };
  }

  /**
   * Get the full department tree (hierarchical structure).
   */
  static async getDepartmentTree(companyId?: string): Promise<DepartmentTreeNode[]> {
    const treeFilter: Record<string, unknown> = { isActive: true };
    if (companyId) treeFilter.company = companyId;

    const departments = await Department.find(treeFilter)
      // .populate('headOfDepartment', 'firstName lastName email')
      .lean();

    // Build a map of id -> node
    const map = new Map<string, DepartmentTreeNode>();
    const roots: DepartmentTreeNode[] = [];

    for (const dept of departments) {
      map.set(dept._id.toString(), {
        _id: dept._id.toString(),
        name: dept.name,
        shortName: dept.shortName,
        description: dept.description,
        // headOfDepartment: dept.headOfDepartment,
        displayOrder: dept.displayOrder,
        isActive: dept.isActive,
        children: [],
      });
    }

    for (const dept of departments) {
      const node = map.get(dept._id.toString())!;
      if (dept.parentDepartment) {
        const parent = map.get(dept.parentDepartment.toString());
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
