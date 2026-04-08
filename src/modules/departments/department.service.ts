import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Department, { type IDepartment } from './department.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

interface DepartmentTreeNode {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: unknown;
  isActive: boolean;
  children: DepartmentTreeNode[];
}

export class DepartmentService {
  /**
   * Get all departments with search, pagination, and population.
   */
  static async getAll(query: IQueryParams): Promise<PaginatedResult<IDepartment>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .populate('headOfDepartment', 'firstName lastName email')
        .populate('parentDepartment', 'name code')
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
  static async getById(id: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    const department = await Department.findById(id)
      .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name code')
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
    if (data.parentDepartment) {
      const parentExists = await Department.findById(data.parentDepartment);
      if (!parentExists) {
        throw new AppError('Parent department not found.', 404);
      }
    }

    const department = await Department.create(data);

    return Department.findById(department._id)
      .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name code') as unknown as IDepartment;
  }

  /**
   * Update a department.
   */
  static async update(id: string, data: Partial<IDepartment>): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    // Prevent circular parent reference
    if (data.parentDepartment && data.parentDepartment.toString() === id) {
      throw new AppError('A department cannot be its own parent.', 400);
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('headOfDepartment', 'firstName lastName email')
      .populate('parentDepartment', 'name code');

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return department;
  }

  /**
   * Soft delete a department.
   */
  static async delete(id: string): Promise<IDepartment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!department) {
      throw new AppError('Department not found.', 404);
    }

    return department;
  }

  /**
   * Get the full department tree (hierarchical structure).
   */
  static async getDepartmentTree(): Promise<DepartmentTreeNode[]> {
    const departments = await Department.find({ isActive: true })
      .populate('headOfDepartment', 'firstName lastName email')
      .lean();

    // Build a map of id -> node
    const map = new Map<string, DepartmentTreeNode>();
    const roots: DepartmentTreeNode[] = [];

    for (const dept of departments) {
      map.set(dept._id.toString(), {
        _id: dept._id.toString(),
        name: dept.name,
        code: dept.code,
        description: dept.description,
        headOfDepartment: dept.headOfDepartment,
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
