import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { EmployeeService } from './employee.service.js';

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

    const result = await EmployeeService.getAll(query);
    res.status(200).json(
      buildResponse(true, result.data, 'Employees retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get employee by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.getById(req.params.id as string);
    res.status(200).json(
      buildResponse(true, employee, 'Employee retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new employee (user + profile).
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.create(req.body);
    res.status(201).json(
      buildResponse(true, employee, 'Employee created successfully'),
    );
  });

  /**
   * PUT /:id - Update an employee profile.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.update(req.params.id as string, req.body);
    res.status(200).json(
      buildResponse(true, employee, 'Employee updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete an employee.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employee = await EmployeeService.delete(req.params.id as string);
    res.status(200).json(
      buildResponse(true, employee, 'Employee deactivated successfully'),
    );
  });

  /**
   * GET /department/:departmentId - Get employees by department.
   */
  static getByDepartment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getByDepartment(req.params.departmentId as string);
    res.status(200).json(
      buildResponse(true, employees, 'Employees retrieved successfully'),
    );
  });

  /**
   * GET /reportees/:managerId - Get reportees of a manager.
   */
  static getReportees = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const employees = await EmployeeService.getReportees(req.params.managerId as string);
    res.status(200).json(
      buildResponse(true, employees, 'Reportees retrieved successfully'),
    );
  });
}
