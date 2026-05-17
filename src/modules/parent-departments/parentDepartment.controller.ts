import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { ParentDepartmentService } from './parentDepartment.service.js';

// Parent Department is group-level master data: the service resolves the
// caller's company to the group's main company and queries every sibling.
// We pass `effectiveCompany(req.user)` here and let the service expand it —
// no per-request scopeFilter, since that would re-pin the query to a single
// company and undo the master-data semantics.

export class ParentDepartmentController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'displayOrder',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await ParentDepartmentService.getAll(query, effectiveCompany(req.user));
    res.status(200).json(
      buildResponse(true, result.data, 'Parent departments retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.getById(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Parent department retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.create({ ...req.body, company: effectiveCompany(req.user) });
    res.status(201).json(buildResponse(true, doc, 'Parent department created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.update(req.params.id as string, req.body, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Parent department updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await ParentDepartmentService.delete(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Parent department deactivated successfully'));
  });
}
