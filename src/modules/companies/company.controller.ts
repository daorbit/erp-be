import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { CompanyService } from './company.service.js';

export class CompanyController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await CompanyService.getAll(query);
    res.status(200).json(
      buildResponse(true, result.data, 'Companies retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.getById(req.params.id as string);
    res.status(200).json(
      buildResponse(true, company, 'Company retrieved successfully'),
    );
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.create(req.body);
    res.status(201).json(
      buildResponse(true, company, 'Company created successfully'),
    );
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.update(req.params.id as string, req.body);
    res.status(200).json(
      buildResponse(true, company, 'Company updated successfully'),
    );
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.delete(req.params.id as string);
    res.status(200).json(
      buildResponse(true, company, 'Company deactivated successfully'),
    );
  });
}
