import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { scopeFilter, effectiveCompany } from '../../shared/scope.js';
import { StateService } from './state.service.js';

// State is company-scoped only — no site FK.
const stateScope = (req: IAuthRequest) => scopeFilter(req.user, { branchField: null });

export class StateController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await StateService.getAll(query, undefined, stateScope(req));
    res.status(200).json(buildResponse(true, result.data, 'States retrieved successfully', result.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const state = await StateService.getById(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, state, 'State retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const state = await StateService.create({ ...req.body, company: effectiveCompany(req.user) });
    res.status(201).json(buildResponse(true, state, 'State created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const state = await StateService.update(req.params.id as string, req.body, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, state, 'State updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const state = await StateService.delete(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, state, 'State deactivated successfully'));
  });
}
