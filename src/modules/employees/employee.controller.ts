import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { EmployeeService } from './employee.service.js';
import Attendance from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leaves/leave.model.js';
import { Payslip } from '../payroll/payroll.model.js';
import Asset from '../assets/asset.model.js';

export class EmployeeController {
  /**
   * GET / - Get all employees with search, filter, pagination.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        department: req.query.department as string,
        designation: req.query.designation as string,
        status: req.query.status as string,
        employmentType: req.query.employmentType as string,
      },
    };

    const result = await EmployeeService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Employees retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get employee by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, employee, 'Employee retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new employee (user + profile).
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.create({ ...req.body, company: req.user.company });
    res.status(201).json(
      buildResponse(true, employee, 'Employee created successfully'),
    );
  });

  /**
   * PUT /:id - Update an employee profile.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, employee, 'Employee updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete an employee.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, employee, 'Employee deactivated successfully'),
    );
  });

  /**
   * GET /department/:departmentId - Get employees by department.
   */
  static getByDepartment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getByDepartment(req.params.departmentId as string, req.user.company);
    res.status(200).json(
      buildResponse(true, employees, 'Employees retrieved successfully'),
    );
  });

  /**
   * GET /reportees/:managerId - Get reportees of a manager.
   */
  static getReportees = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getReportees(req.params.managerId as string, req.user.company);
    res.status(200).json(
      buildResponse(true, employees, 'Reportees retrieved successfully'),
    );
  });

  static getEmployeeAttendance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, req.user.company);
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { employee: userId };
    if (req.user.company) filter.company = req.user.company;
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(30)
      .lean();
    res.status(200).json(buildResponse(true, records, 'Employee attendance retrieved'));
  });

  static getEmployeeLeaves = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, req.user.company);
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { employee: userId };
    if (req.user.company) filter.company = req.user.company;
    const records = await LeaveRequest.find(filter)
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.status(200).json(buildResponse(true, records, 'Employee leaves retrieved'));
  });

  static getEmployeePayslips = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, req.user.company);
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { employee: userId };
    if (req.user.company) filter.company = req.user.company;
    const records = await Payslip.find(filter)
      .sort({ year: -1, month: -1 })
      .limit(12)
      .lean();
    res.status(200).json(buildResponse(true, records, 'Employee payslips retrieved'));
  });

  static getEmployeeAssets = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, req.user.company);
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { assignedTo: userId };
    if (req.user.company) filter.company = req.user.company;
    const records = await Asset.find(filter).sort({ assignedDate: -1 }).lean();
    res.status(200).json(buildResponse(true, records, 'Employee assets retrieved'));
  });
}
