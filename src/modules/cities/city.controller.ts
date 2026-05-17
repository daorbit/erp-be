import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { scopeFilter, effectiveCompany } from '../../shared/scope.js';
import { CityService } from './city.service.js';

// Cities are company-scoped only (no site FK) — pass branchField: null
// so site_admin / user types don't get an over-narrow filter.
const citiesScope = (req: IAuthRequest) =>
  scopeFilter(req.user, { branchField: null });

export class CityController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 500,
      search: req.query.search as string,
      filters: { state: req.query.state as string },
    };
    const r = await CityService.getAll(q, undefined, citiesScope(req));
    res.status(200).json(buildResponse(true, r.data, 'Cities retrieved', r.pagination));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await CityService.getById(req.params.id as string, effectiveCompany(req.user)), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await CityService.create({ ...req.body, company: effectiveCompany(req.user) }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await CityService.update(req.params.id as string, req.body, effectiveCompany(req.user)), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await CityService.delete(req.params.id as string, effectiveCompany(req.user)), 'Deleted'));
  });
}
