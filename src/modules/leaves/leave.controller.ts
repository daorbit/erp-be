import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { LeaveService } from './leave.service.js';

export class LeaveController {
  // ─── Leave Type Endpoints ──────────────────────────────────────────────────

  /**
   * GET /types - Get all leave types.
   */
  static getAllTypes = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await LeaveService.getAllLeaveTypes(query);
    res.status(200).json(
      buildResponse(true, result.data, 'Leave types retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /types/:id - Get leave type by ID.
   */
  static getTypeById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const leaveType = await LeaveService.getLeaveTypeById(req.params.id);
    res.status(200).json(
      buildResponse(true, leaveType, 'Leave type retrieved successfully'),
    );
  });

  /**
   * POST /types - Create leave type.
   */
  static createType = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const leaveType = await LeaveService.createLeaveType(req.body);
    res.status(201).json(
      buildResponse(true, leaveType, 'Leave type created successfully'),
    );
  });

  /**
   * PUT /types/:id - Update leave type.
   */
  static updateType = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const leaveType = await LeaveService.updateLeaveType(req.params.id, req.body);
    res.status(200).json(
      buildResponse(true, leaveType, 'Leave type updated successfully'),
    );
  });

  /**
   * DELETE /types/:id - Delete leave type.
   */
  static deleteType = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const leaveType = await LeaveService.deleteLeaveType(req.params.id);
    res.status(200).json(
      buildResponse(true, leaveType, 'Leave type deactivated successfully'),
    );
  });

  // ─── Leave Request Endpoints ───────────────────────────────────────────────

  /**
   * POST /apply - Apply for leave.
   */
  static apply = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const request = await LeaveService.apply(req.user.id, req.body);
    res.status(201).json(
      buildResponse(true, request, 'Leave application submitted successfully'),
    );
  });

  /**
   * GET /my - Get own leave requests.
   */
  static getMyLeaves = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        status: req.query.status,
      },
    };

    const result = await LeaveService.getMyLeaves(req.user.id, query);
    res.status(200).json(
      buildResponse(true, result.data, 'Leave requests retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /pending-approvals - Get pending approvals for manager.
   */
  static getPendingApprovals = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const requests = await LeaveService.getPendingApprovals(req.user.id);
    res.status(200).json(
      buildResponse(true, requests, 'Pending approvals retrieved successfully'),
    );
  });

  /**
   * PUT /:id/approve - Approve a leave request.
   */
  static approve = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const request = await LeaveService.approve(
      req.params.id,
      req.user.id,
      req.body.remarks,
    );
    res.status(200).json(
      buildResponse(true, request, 'Leave request approved successfully'),
    );
  });

  /**
   * PUT /:id/reject - Reject a leave request.
   */
  static reject = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const request = await LeaveService.reject(
      req.params.id,
      req.user.id,
      req.body.remarks,
    );
    res.status(200).json(
      buildResponse(true, request, 'Leave request rejected'),
    );
  });

  /**
   * PUT /:id/cancel - Cancel own leave request.
   */
  static cancel = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const request = await LeaveService.cancel(req.params.id, req.user.id);
    res.status(200).json(
      buildResponse(true, request, 'Leave request cancelled successfully'),
    );
  });

  /**
   * GET /balance/:employeeId - Get leave balance.
   */
  static getBalance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const balances = await LeaveService.getLeaveBalance(req.params.employeeId, year);
    res.status(200).json(
      buildResponse(true, balances, 'Leave balances retrieved successfully'),
    );
  });

  /**
   * GET / - Get all leave requests (HR view).
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        employee: req.query.employee,
        status: req.query.status,
        leaveType: req.query.leaveType,
      },
    };

    const result = await LeaveService.getAllRequests(query);
    res.status(200).json(
      buildResponse(true, result.data, 'Leave requests retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get leave request by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const request = await LeaveService.getRequestById(req.params.id);
    res.status(200).json(
      buildResponse(true, request, 'Leave request retrieved successfully'),
    );
  });
}
