import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AccountGroupService } from './accountGroup.service.js';

const getCompany = (req: IAuthRequest): string =>
  String(req.user.company ?? '');

export class AccountGroupController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 100,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'orderNo',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await AccountGroupService.getAll(query, getCompany(req));
    res.status(200).json(
      buildResponse(true, result.data, 'Account Groups retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await AccountGroupService.getById(req.params.id as string, getCompany(req));
    res.status(200).json(buildResponse(true, group, 'Account Group retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await AccountGroupService.create({ ...req.body, company: getCompany(req) });
    res.status(201).json(buildResponse(true, group, 'Account Group created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const group = await AccountGroupService.update(req.params.id as string, req.body, getCompany(req));
    res.status(200).json(buildResponse(true, group, 'Account Group updated successfully'));
  });

  static remove = asyncHandler(async (req: IAuthRequest, res: Response) => {
    await AccountGroupService.remove(req.params.id as string, getCompany(req));
    res.status(200).json(buildResponse(true, null, 'Account Group deleted successfully'));
  });
}
