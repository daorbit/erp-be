import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { SalaryHeadService } from './salaryHead.service.js';

export class SalaryHeadController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'displayOrder',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await SalaryHeadService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Salary Heads retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const head = await SalaryHeadService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, head, 'Salary Head retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const head = await SalaryHeadService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, head, 'Salary Head created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const head = await SalaryHeadService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, head, 'Salary Head updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const head = await SalaryHeadService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, head, 'Salary Head deactivated successfully'));
  });
}
