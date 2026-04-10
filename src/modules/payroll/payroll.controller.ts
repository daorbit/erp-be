import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { PayrollService } from './payroll.service.js';

export class PayrollController {
  // ─── Salary Structure Endpoints ────────────────────────────────────────────

  /**
   * GET /salary-structure - Get all salary structures.
   */
  static getAllStructures = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      },
    };

    const result = await PayrollService.getAllSalaryStructures(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Salary structures retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /salary-structure/:id - Get salary structure by ID.
   */
  static getStructureById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const structure = await PayrollService.getSalaryStructureById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, structure, 'Salary structure retrieved successfully'),
    );
  });

  /**
   * POST /salary-structure - Create salary structure.
   */
  static createStructure = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const structure = await PayrollService.createSalaryStructure({ ...req.body, company: req.user.company });
    res.status(201).json(
      buildResponse(true, structure, 'Salary structure created successfully'),
    );
  });

  /**
   * PUT /salary-structure/:id - Update salary structure.
   */
  static updateStructure = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const structure = await PayrollService.updateSalaryStructure(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, structure, 'Salary structure updated successfully'),
    );
  });

  /**
   * GET /salary-structure/employee/:employeeId - Get by employee.
   */
  static getByEmployee = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const structure = await PayrollService.getByEmployee(req.params.employeeId as string, req.user.company);
    res.status(200).json(
      buildResponse(true, structure, 'Salary structure retrieved successfully'),
    );
  });

  // ─── Payslip Endpoints ─────────────────────────────────────────────────────

  /**
   * POST /generate - Generate a payslip.
   */
  static generate = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { employeeId, month, year } = req.body;
    const payslip = await PayrollService.generate(employeeId, month, year, req.user.id, req.user.company);
    res.status(201).json(
      buildResponse(true, payslip, 'Payslip generated successfully'),
    );
  });

  /**
   * POST /bulk-generate - Bulk generate payslips.
   */
  static bulkGenerate = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { month, year } = req.body;
    const result = await PayrollService.bulkGenerate(month, year, req.user.id, req.user.company);
    res.status(201).json(
      buildResponse(
        true,
        result,
        `Payslips generated: ${result.generated}, skipped: ${result.skipped}, errors: ${result.errors.length}`,
      ),
    );
  });

  /**
   * GET /my - Get own payslips.
   */
  static getMyPayslips = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
      sortBy: (req.query.sortBy as string) || 'year',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await PayrollService.getMyPayslips(req.user.id, query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Payslips retrieved successfully', result.pagination),
    );
  });

  /**
   * PUT /:id/approve - Approve a payslip.
   */
  static approve = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const payslip = await PayrollService.approve(req.params.id as string, req.user.id, req.user.company);
    res.status(200).json(
      buildResponse(true, payslip, 'Payslip approved successfully'),
    );
  });

  /**
   * PUT /:id/mark-paid - Mark payslip as paid.
   */
  static markPaid = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const payslip = await PayrollService.markPaid(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, payslip, 'Payslip marked as paid'),
    );
  });

  /**
   * GET /summary - Get salary summary.
   */
  static getSummary = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const summary = await PayrollService.getSalarySummary(month, year, req.user.company);
    res.status(200).json(
      buildResponse(true, summary, 'Salary summary retrieved successfully'),
    );
  });

  /**
   * GET / - Get all payslips.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        employee: req.query.employee as string,
        month: req.query.month as string,
        year: req.query.year as string,
        status: req.query.status as string,
      },
    };

    const result = await PayrollService.getAllPayslips(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Payslips retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get payslip by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const payslip = await PayrollService.getPayslipById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, payslip, 'Payslip retrieved successfully'),
    );
  });
}
