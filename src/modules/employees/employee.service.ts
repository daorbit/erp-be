import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination, generateEmployeeId } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import User from '../auth/auth.model.js';
import EmployeeProfile, { type IEmployeeProfile } from './employee.model.js';

interface EmployeeCreateData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  department?: string;
  designation?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  employmentType?: string;
  joinDate?: string;
  workShift?: string;
  workLocation?: string;
  reportingManager?: string;
  currentAddress?: Record<string, unknown>;
  permanentAddress?: Record<string, unknown>;
  emergencyContact?: Record<string, unknown>;
  bankDetails?: Record<string, unknown>;
  identityDocs?: Record<string, unknown>;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class EmployeeService {
  /**
   * Get all employees with search, filtering, pagination, and sorting.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IEmployeeProfile>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;

    // Search by name in populated user or employeeId
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = users.map((u) => u._id);
      filter.$or = [
        { userId: { $in: userIds } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (filters.department) {
      filter['userId'] = filter['userId'] ?? undefined;
      // Department is stored on User model; we need to filter via User lookup
      const deptUsers = await User.find({
        department: filters.department as string,
      }).select('_id');
      const deptUserIds = deptUsers.map((u) => u._id);
      if (filter.$or) {
        // Combine with search filter
        filter.$and = [
          { $or: filter.$or as Record<string, unknown>[] },
          { userId: { $in: deptUserIds } },
        ];
        delete filter.$or;
      } else {
        filter.userId = { $in: deptUserIds };
      }
    }

    if (filters.designation) {
      // Designation is on User model
      const desigUsers = await User.find({
        designation: filters.designation as string,
      }).select('_id');
      const desigUserIds = desigUsers.map((u) => u._id);
      if (filter.$and) {
        (filter.$and as Record<string, unknown>[]).push({ userId: { $in: desigUserIds } });
      } else if (filter.$or) {
        filter.$and = [
          { $or: filter.$or as Record<string, unknown>[] },
          { userId: { $in: desigUserIds } },
        ];
        delete filter.$or;
      } else {
        filter.userId = { $in: desigUserIds };
      }
    }

    if (filters.status) {
      filter.isActive = filters.status === 'active';
    }

    if (filters.employmentType) {
      filter.employmentType = filters.employmentType;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [employees, total] = await Promise.all([
      EmployeeProfile.find(filter)
        .populate({
          path: 'userId',
          select: 'firstName lastName email phone role department designation avatar',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'designation', select: 'title code level' },
          ],
        })
        .populate('reportingManager', 'firstName lastName email')
        .populate('shift', 'name startTime endTime graceMinutes')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeProfile.countDocuments(filter),
    ]);

    return {
      data: employees as any as IEmployeeProfile[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a single employee profile by ID with full populated references.
   */
  static async getById(id: string, companyId?: string): Promise<IEmployeeProfile> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const employee = await EmployeeProfile.findOne(findFilter)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone role department designation avatar',
        populate: [
          { path: 'department', select: 'name code description' },
          { path: 'designation', select: 'title code level band' },
        ],
      })
      .populate('reportingManager', 'firstName lastName email');

    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    return employee;
  }

  /**
   * Create a new user and employee profile together.
   */
  static async create(data: EmployeeCreateData): Promise<IEmployeeProfile> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const employeeId = generateEmployeeId();

    // Create the User (with company for company-scoped roles)
    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: `Emp@${Date.now().toString(36)}`,
      phone: data.phone,
      role: data.role ?? 'employee',
      employeeId,
      company: data.company,
      department: data.department,
      designation: data.designation,
    });

    // Create the EmployeeProfile
    const profile = await EmployeeProfile.create({
      userId: user._id,
      employeeId,
      company: data.company,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      bloodGroup: data.bloodGroup,
      nationality: data.nationality,
      religion: data.religion,
      employmentType: data.employmentType ?? 'full_time',
      joinDate: data.joinDate ?? new Date(),
      workShift: data.workShift,
      workLocation: data.workLocation,
      reportingManager: data.reportingManager,
      currentAddress: data.currentAddress,
      permanentAddress: data.permanentAddress,
      emergencyContact: data.emergencyContact,
      bankDetails: data.bankDetails,
      identityDocs: data.identityDocs,
    });

    const populated = await EmployeeProfile.findById(profile._id)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone role department designation avatar',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'title code level' },
        ],
      })
      .populate('reportingManager', 'firstName lastName email');

    return populated!;
  }

  /**
   * Update an employee profile.
   */
  static async update(
    id: string,
    data: Partial<IEmployeeProfile>,
    companyId?: string,
  ): Promise<IEmployeeProfile> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const employee = await EmployeeProfile.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone role department designation avatar',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'title code level' },
        ],
      })
      .populate('reportingManager', 'firstName lastName email');

    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    return employee;
  }

  /**
   * Soft delete an employee (set isActive to false).
   */
  static async delete(id: string, companyId?: string): Promise<IEmployeeProfile> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const deleteFilter: Record<string, unknown> = { _id: id };
    if (companyId) deleteFilter.company = companyId;

    const employee = await EmployeeProfile.findOne(deleteFilter);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    employee.isActive = false;
    await employee.save();

    // Also deactivate the corresponding user
    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    return employee;
  }

  /**
   * Get all employees in a specific department.
   */
  static async getByDepartment(departmentId: string, companyId?: string): Promise<IEmployeeProfile[]> {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw new AppError('Invalid department ID format.', 400);
    }

    // Find users in this department
    const users = await User.find({
      department: departmentId,
      isActive: true,
    }).select('_id');
    const userIds = users.map((u) => u._id);

    const deptFilter: Record<string, unknown> = {
      userId: { $in: userIds },
      isActive: true,
    };
    if (companyId) deptFilter.company = companyId;

    const employees = await EmployeeProfile.find(deptFilter)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone role department designation avatar',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'title code level' },
        ],
      })
      .populate('reportingManager', 'firstName lastName email')
      .lean();

    return employees as any as IEmployeeProfile[];
  }

  /**
   * Get all direct reportees of a manager.
   */
  static async getReportees(managerId: string, companyId?: string): Promise<IEmployeeProfile[]> {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      throw new AppError('Invalid manager ID format.', 400);
    }

    const reporteesFilter: Record<string, unknown> = {
      reportingManager: managerId,
      isActive: true,
    };
    if (companyId) reporteesFilter.company = companyId;

    const employees = await EmployeeProfile.find(reporteesFilter)
      .populate({
        path: 'userId',
        select: 'firstName lastName email phone role department designation avatar',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'title code level' },
        ],
      })
      .lean();

    return employees as any as IEmployeeProfile[];
  }

  /**
   * Bulk-update a whitelisted set of fields on many employees at once.
   * Used by the Multiple Shift / Branch / Reporting / generic Update pages.
   * Whitelisted fields only — anything else is silently dropped to prevent
   * accidental mass-writes from a hostile client.
   */
  static async bulkUpdate(
    employeeIds: string[],
    set: Record<string, unknown>,
    companyId?: string,
  ): Promise<{ matched: number; modified: number }> {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new AppError('No employees provided', 400);
    }
    const allowedFields = new Set([
      'shift', 'branch', 'department', 'designation', 'level', 'grade',
      'employeeGroup', 'tagName', 'reportingEmp', 'empStatus',
      'confirmationDay', 'noticePeriodDays', 'empRemark',
      'isActive', 'categorySkill', 'subCompany', 'pfScheme',
    ]);
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(set)) {
      if (allowedFields.has(k) && v !== undefined) safe[k] = v;
    }
    if (Object.keys(safe).length === 0) {
      throw new AppError('No updatable fields in payload', 400);
    }

    const filter: Record<string, unknown> = { _id: { $in: employeeIds } };
    if (companyId) filter.company = companyId;

    const result = await EmployeeProfile.updateMany(filter, { $set: safe });
    return {
      matched: (result as { matchedCount?: number }).matchedCount ?? 0,
      modified: (result as { modifiedCount?: number }).modifiedCount ?? 0,
    };
  }

  /**
   * Compute a lightweight full-and-final statement for one employee.
   * Reference implementation: loads current salary breakdown + leave balances
   * + notice-period pay, returns totals. Real-world F&F needs payroll/attendance
   * integration — we surface the core fields and let payroll extend.
   */
  static async fullAndFinal(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid employee ID', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const e = await EmployeeProfile.findOne(filter).lean();
    if (!e) throw new AppError('Employee not found', 404);

    const basic = (e as any).salary?.basic ?? 0;
    const gross = (e as any).salary?.grossSalary ?? 0;
    const deductions = (e as any).salary?.deductions ?? 0;
    const noticeDays = (e as any).noticePeriodDays ?? 0;
    const pendingLeave = ((e as any).leaveTemplate ?? [])
      .reduce((s: number, r: any) => s + (r.value ?? 0), 0);

    return {
      employeeId: (e as any).employeeId,
      resignationDate: (e as any).resignationDate,
      lastWorkingDate: (e as any).lastWorkingDate,
      basic,
      grossSalary: gross,
      deductions,
      netSalary: gross - deductions,
      noticePeriodDays: noticeDays,
      noticePeriodRecovery: basic ? (basic / 30) * noticeDays : 0,
      pendingLeaveBalance: pendingLeave,
      leaveEncashment: basic ? (basic / 30) * pendingLeave : 0,
    };
  }
}
