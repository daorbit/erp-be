import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { EmployeeGroupService } from './employeeGroup.service.js';

export class EmployeeGroupController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 100,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await EmployeeGroupService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Employee Groups retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await EmployeeGroupService.getById(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, group, 'Employee Group retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await EmployeeGroupService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, group, 'Employee Group created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await EmployeeGroupService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(buildResponse(true, group, 'Employee Group updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await EmployeeGroupService.delete(req.params.id as string, req.user.company);
    res.status(200).json(buildResponse(true, group, 'Employee Group deactivated successfully'));
  });
}
