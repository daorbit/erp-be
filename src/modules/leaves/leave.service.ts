import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import {
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  LeaveRequestStatus,
  type ILeaveType,
  type ILeaveRequest,
  type ILeaveBalance,
} from './leave.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class LeaveService {
  // ─── Leave Type CRUD ───────────────────────────────────────────────────────

  /**
   * Get all leave types.
   */
  static async getAllLeaveTypes(query: IQueryParams): Promise<PaginatedResult<ILeaveType>> {
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
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [types, total] = await Promise.all([
      LeaveType.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      LeaveType.countDocuments(filter),
    ]);

    return {
      data: types as ILeaveType[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a leave type by ID.
   */
  static async getLeaveTypeById(id: string): Promise<ILeaveType> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave type ID format.', 400);
    }

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      throw new AppError('Leave type not found.', 404);
    }

    return leaveType;
  }

  /**
   * Create a new leave type.
   */
  static async createLeaveType(data: Partial<ILeaveType>): Promise<ILeaveType> {
    return LeaveType.create(data);
  }

  /**
   * Update a leave type.
   */
  static async updateLeaveType(id: string, data: Partial<ILeaveType>): Promise<ILeaveType> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave type ID format.', 400);
    }

    const leaveType = await LeaveType.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!leaveType) {
      throw new AppError('Leave type not found.', 404);
    }

    return leaveType;
  }

  /**
   * Soft delete a leave type.
   */
  static async deleteLeaveType(id: string): Promise<ILeaveType> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave type ID format.', 400);
    }

    const leaveType = await LeaveType.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!leaveType) {
      throw new AppError('Leave type not found.', 404);
    }

    return leaveType;
  }

  // ─── Leave Request ─────────────────────────────────────────────────────────

  /**
   * Apply for leave.
   */
  static async apply(
    employeeId: string,
    data: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason: string;
      isHalfDay?: boolean;
      halfDayType?: string;
    },
  ): Promise<ILeaveRequest> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    // Validate leave type exists
    const leaveType = await LeaveType.findById(data.leaveType);
    if (!leaveType || !leaveType.isActive) {
      throw new AppError('Invalid or inactive leave type.', 400);
    }

    const startDate = dayjs(data.startDate);
    const endDate = dayjs(data.endDate);

    if (endDate.isBefore(startDate)) {
      throw new AppError('End date must be on or after the start date.', 400);
    }

    // Calculate total days
    let totalDays = endDate.diff(startDate, 'day') + 1;
    if (data.isHalfDay) {
      totalDays = 0.5;
    }

    // Check leave balance
    const year = startDate.year();
    const balance = await LeaveBalance.findOne({
      employee: employeeId,
      leaveType: data.leaveType,
      year,
    });

    if (balance && balance.remaining < totalDays) {
      throw new AppError(
        `Insufficient leave balance. Available: ${balance.remaining}, Requested: ${totalDays}`,
        400,
      );
    }

    // Check for overlapping leave requests
    const overlapping = await LeaveRequest.findOne({
      employee: employeeId,
      status: { $in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
      $or: [
        { startDate: { $lte: endDate.toDate() }, endDate: { $gte: startDate.toDate() } },
      ],
    });

    if (overlapping) {
      throw new AppError('You already have a leave request for the overlapping dates.', 409);
    }

    const request = await LeaveRequest.create({
      employee: employeeId,
      leaveType: data.leaveType,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      totalDays,
      reason: data.reason,
      isHalfDay: data.isHalfDay ?? false,
      halfDayType: data.halfDayType,
    });

    return LeaveRequest.findById(request._id)
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code') as unknown as ILeaveRequest;
  }

  /**
   * Get all leave requests with filters and pagination.
   */
  static async getAllRequests(query: IQueryParams): Promise<PaginatedResult<ILeaveRequest>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};

    if (filters.employee) {
      filter.employee = filters.employee;
    }

    if (filters.status) {
      filter.status = filters.status;
    }

    if (filters.leaveType) {
      filter.leaveType = filters.leaveType;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('leaveType', 'name code')
        .populate('approvedBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(filter),
    ]);

    return {
      data: requests as ILeaveRequest[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get a leave request by ID.
   */
  static async getRequestById(id: string): Promise<ILeaveRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave request ID format.', 400);
    }

    const request = await LeaveRequest.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code')
      .populate('approvedBy', 'firstName lastName email');

    if (!request) {
      throw new AppError('Leave request not found.', 404);
    }

    return request;
  }

  /**
   * Approve a leave request.
   */
  static async approve(
    id: string,
    approverId: string,
    remarks?: string,
  ): Promise<ILeaveRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave request ID format.', 400);
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      throw new AppError('Leave request not found.', 404);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new AppError(`Cannot approve a request with status: ${request.status}`, 400);
    }

    request.status = LeaveRequestStatus.APPROVED;
    request.approvedBy = new mongoose.Types.ObjectId(approverId);
    if (remarks) request.approverRemarks = remarks;
    await request.save();

    // Update leave balance
    const year = dayjs(request.startDate).year();
    await LeaveBalance.findOneAndUpdate(
      {
        employee: request.employee,
        leaveType: request.leaveType,
        year,
      },
      {
        $inc: { used: request.totalDays, remaining: -request.totalDays },
      },
    );

    return LeaveRequest.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code')
      .populate('approvedBy', 'firstName lastName email') as unknown as ILeaveRequest;
  }

  /**
   * Reject a leave request.
   */
  static async reject(
    id: string,
    approverId: string,
    remarks?: string,
  ): Promise<ILeaveRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave request ID format.', 400);
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      throw new AppError('Leave request not found.', 404);
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new AppError(`Cannot reject a request with status: ${request.status}`, 400);
    }

    request.status = LeaveRequestStatus.REJECTED;
    request.approvedBy = new mongoose.Types.ObjectId(approverId);
    if (remarks) request.approverRemarks = remarks;
    await request.save();

    return LeaveRequest.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code')
      .populate('approvedBy', 'firstName lastName email') as unknown as ILeaveRequest;
  }

  /**
   * Cancel a leave request (by the employee).
   */
  static async cancel(id: string, employeeId: string): Promise<ILeaveRequest> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid leave request ID format.', 400);
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      throw new AppError('Leave request not found.', 404);
    }

    if (request.employee.toString() !== employeeId) {
      throw new AppError('You can only cancel your own leave requests.', 403);
    }

    if (
      request.status !== LeaveRequestStatus.PENDING &&
      request.status !== LeaveRequestStatus.APPROVED
    ) {
      throw new AppError(`Cannot cancel a request with status: ${request.status}`, 400);
    }

    // If was approved, restore balance
    if (request.status === LeaveRequestStatus.APPROVED) {
      const year = dayjs(request.startDate).year();
      await LeaveBalance.findOneAndUpdate(
        {
          employee: request.employee,
          leaveType: request.leaveType,
          year,
        },
        {
          $inc: { used: -request.totalDays, remaining: request.totalDays },
        },
      );
    }

    request.status = LeaveRequestStatus.CANCELLED;
    await request.save();

    return LeaveRequest.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code') as unknown as ILeaveRequest;
  }

  /**
   * Get an employee's own leave requests.
   */
  static async getMyLeaves(
    employeeId: string,
    query: IQueryParams,
  ): Promise<PaginatedResult<ILeaveRequest>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = { employee: employeeId };

    if (filters.status) {
      filter.status = filters.status;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('leaveType', 'name code')
        .populate('approvedBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(filter),
    ]);

    return {
      data: requests as ILeaveRequest[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get pending leave approvals for a manager.
   */
  static async getPendingApprovals(managerId: string): Promise<ILeaveRequest[]> {
    // Find employees who report to this manager
    // The reporting manager is stored in EmployeeProfile, employee field in LeaveRequest is User ID
    const requests = await LeaveRequest.find({
      status: LeaveRequestStatus.PENDING,
    })
      .populate('employee', 'firstName lastName email')
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // In a more sophisticated implementation, we'd filter by the manager's reportees.
    // For now, return all pending requests (to be filtered by controller if needed).
    return requests as ILeaveRequest[];
  }

  /**
   * Get leave balance for an employee for a given year.
   */
  static async getLeaveBalance(
    employeeId: string,
    year: number,
  ): Promise<ILeaveBalance[]> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const balances = await LeaveBalance.find({
      employee: employeeId,
      year,
    })
      .populate('leaveType', 'name code')
      .lean();

    return balances as ILeaveBalance[];
  }

  /**
   * Initialize leave balances for an employee for a given year.
   * Allocates default quotas from all active leave types.
   */
  static async initializeLeaveBalances(
    employeeId: string,
    year: number,
  ): Promise<ILeaveBalance[]> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const leaveTypes = await LeaveType.find({ isActive: true });
    const results: ILeaveBalance[] = [];

    for (const lt of leaveTypes) {
      // Check if balance already exists
      const existing = await LeaveBalance.findOne({
        employee: employeeId,
        leaveType: lt._id,
        year,
      });

      if (existing) {
        results.push(existing);
        continue;
      }

      // Check for carry forward from previous year
      let carryForward = 0;
      if (lt.carryForward) {
        const prevBalance = await LeaveBalance.findOne({
          employee: employeeId,
          leaveType: lt._id,
          year: year - 1,
        });

        if (prevBalance && prevBalance.remaining > 0) {
          carryForward = Math.min(prevBalance.remaining, lt.maxCarryForward);
        }
      }

      const allocated = lt.defaultDays + carryForward;

      const balance = await LeaveBalance.create({
        employee: employeeId,
        leaveType: lt._id,
        year,
        allocated,
        used: 0,
        remaining: allocated,
        carryForward,
      });

      results.push(balance);
    }

    return results;
  }
}
