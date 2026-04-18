import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { BranchService } from './branch.service.js';

export class BranchController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await BranchService.getAll(query, req.user.company);
    res.status(200).json(buildResponse(true, result.data, 'Branches retrieved successfully', result.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, branch, 'Branch retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, branch, 'Branch created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, branch, 'Branch updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, branch, 'Branch deactivated successfully'));
  });
}
