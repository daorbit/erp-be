import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { SalaryStructureService } from './salaryStructure.service.js';

export class SalaryStructureController {
  // ─── Templates ────────────────────────────────────────────────────────────

  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await SalaryStructureService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Salary Structures retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await SalaryStructureService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, doc, 'Salary Structure retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await SalaryStructureService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, doc, 'Salary Structure created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await SalaryStructureService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, doc, 'Salary Structure updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await SalaryStructureService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, result, 'Salary Structure deleted successfully'));
  });

  // ─── Assigned Heads ───────────────────────────────────────────────────────

  static getAssignedHeads = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const rows = await SalaryStructureService.getAssignedHeads(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, rows, 'Assigned heads retrieved successfully'));
  });

  static assignHead = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await SalaryStructureService.assignHead({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, row, 'Salary Head assigned successfully'));
  });

  static updateAssignedHead = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const row = await SalaryStructureService.updateAssignedHead(req.params.assignmentId as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, row, 'Assignment updated successfully'));
  });

  static removeAssignedHead = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await SalaryStructureService.removeAssignedHead(req.params.assignmentId as string, req.user.company);
    res.status(200).json(buildResponse(true, result, 'Assignment removed successfully'));
  });

  static bulkAssignToEmployees = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { employeeIds, structure, pfApplicable, esicApplicable } = req.body as {
      employeeIds: string[]; structure: string; pfApplicable?: boolean; esicApplicable?: boolean;
    };
    const r = await SalaryStructureService.bulkAssignToEmployees(
      employeeIds, structure, { pfApplicable, esicApplicable }, req.user.company,
    );
    res.status(200).json(buildResponse(true, r, `Assigned structure to ${r.modified} employees`));
  });

  static bulkAppraisal = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { employeeIds, percent } = req.body as { employeeIds: string[]; percent: number };
    const r = await SalaryStructureService.bulkAppraisal(employeeIds, percent, req.user.company);
    res.status(200).json(buildResponse(true, r, `Appraised ${r.modified} employees by ${percent}%`));
  });
}
