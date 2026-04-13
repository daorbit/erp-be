import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { ParentDepartmentService } from './parentDepartment.service.js';

export class ParentDepartmentController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'displayOrder',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await ParentDepartmentService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Parent departments retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, doc, 'Parent department retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, doc, 'Parent department created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, doc, 'Parent department updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, doc, 'Parent department deactivated successfully'));
  });
}
