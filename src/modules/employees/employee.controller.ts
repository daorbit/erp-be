import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { scopeFilter, isPlatformAdmin } from '../../shared/scope.js';
import { EmployeeService } from './employee.service.js';
import Attendance from '../attendance/attendance.model.js';
import { Payslip } from '../payroll/payroll.model.js';

// Returns the effective company ID for a request (respects X-Active-Company).
function effectiveCompany(req: IAuthRequest): string | undefined {
  if (isPlatformAdmin(req.user)) return undefined;
  return req.user.activeCompany ?? effectiveCompany(req);
}

export class EmployeeController {
  /**
   * GET / - Get all employees with search, filter, pagination.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    // The list page sends ?isActive=true|false directly; older callers pass
    // ?status=active|inactive. Normalise either form into the service's
    // `filters.status` field.
    let status = req.query.status as string | undefined;
    if (!status && typeof req.query.isActive === 'string') {
      status = req.query.isActive === 'true' ? 'active' : 'inactive';
    }

    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        department: req.query.department as string,
        designation: req.query.designation as string,
        employeeGroup: req.query.employeeGroup as string,
        branch: req.query.branch as string,
        level: req.query.level as string,
        grade: req.query.grade as string,
        tagName: req.query.tagName as string,
        status: status as string,
        employmentType: req.query.employmentType as string,
        employeeId: req.query.employeeId as string,
      },
    };

    // Build the tenant + site scope from the authenticated user. For
    // super_admin this yields {} (unrestricted). For site_admin / user
    // it adds `branch: { $in: [...] }` so the list is naturally filtered
    // to the sites the user is allowed to see.
    const scope = scopeFilter(req.user, { branchField: 'branch' });
    const result = await EmployeeService.getAll(query, effectiveCompany(req), scope);
    res.status(200).json(
      buildResponse(true, result.data, 'Employees retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get employee by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.getById(req.params.id as string, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, employee, 'Employee retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new employee (user + profile).
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.create({ ...req.body, company: effectiveCompany(req) });
    res.status(201).json(
      buildResponse(true, employee, 'Employee created successfully'),
    );
  });

  /**
   * PUT /:id - Update an employee profile.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.update(req.params.id as string, req.body, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, employee, 'Employee updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete an employee.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.delete(req.params.id as string, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, employee, 'Employee deactivated successfully'),
    );
  });

  /**
   * GET /department/:departmentId - Get employees by department.
   */
  static getByDepartment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getByDepartment(req.params.departmentId as string, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, employees, 'Employees retrieved successfully'),
    );
  });

  /**
   * POST /:id/quick-create-user — generate username + random password,
   * create a login User linked to this employee profile, and return the
   * credentials so the admin can hand them off. One-shot: subsequent calls
   * for the same employee 409.
   */
  static quickCreateUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const creds = await EmployeeService.createUserForEmployee(req.params.id as string);
    res.status(201).json(buildResponse(true, creds, 'User created for employee'));
  });

  /**
   * GET /reportees/:managerId - Get reportees of a manager.
   */
  static getReportees = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getReportees(req.params.managerId as string, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, employees, 'Reportees retrieved successfully'),
    );
  });

  static getEmployeeAttendance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, effectiveCompany(req));
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { employee: userId };
    if (effectiveCompany(req)) filter.company = effectiveCompany(req);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(30)
      .lean();
    res.status(200).json(buildResponse(true, records, 'Employee attendance retrieved'));
  });

  static getEmployeePayslips = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const profile = await EmployeeService.getById(req.params.id as string, effectiveCompany(req));
    const userId = (profile as any).userId?._id || (profile as any).userId;
    const filter: Record<string, unknown> = { employee: userId };
    if (effectiveCompany(req)) filter.company = effectiveCompany(req);
    const records = await Payslip.find(filter)
      .sort({ year: -1, month: -1 })
      .limit(12)
      .lean();
    res.status(200).json(buildResponse(true, records, 'Employee payslips retrieved'));
  });

  /**
   * POST /bulk-update — apply the same field-updates to many employees.
   * Body: { employeeIds: string[], set: { field: value, ... } }
   */
  static bulkUpdate = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { employeeIds, set } = req.body as { employeeIds: string[]; set: Record<string, unknown> };
    const result = await EmployeeService.bulkUpdate(employeeIds, set, effectiveCompany(req));
    res.status(200).json(
      buildResponse(true, result, `Updated ${result.modified} of ${result.matched} employee(s)`),
    );
  });

  /**
   * GET /:id/full-and-final — compute F&F summary for one employee.
   */
  static fullAndFinal = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await EmployeeService.fullAndFinal(req.params.id as string, effectiveCompany(req));
    res.status(200).json(buildResponse(true, result, 'F&F computed'));
  });
}
