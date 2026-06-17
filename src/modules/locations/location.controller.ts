import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { scopeFilter, effectiveCompany } from '../../shared/scope.js';
import { LocationService } from './location.service.js';

// A Location has a `site` FK to Branch, so site_admin / user scope is
// applied on that field — not the generic 'branch'.
const locationScope = (req: IAuthRequest) =>
  scopeFilter(req.user, { branchField: 'site' });

export class LocationController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };
    const result = await LocationService.getAll(query, undefined, locationScope(req));
    res.status(200).json(buildResponse(true, result.data, 'Locations retrieved successfully', result.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const loc = await LocationService.getById(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, loc, 'Location retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const loc = await LocationService.create({ ...req.body, company: effectiveCompany(req.user) });
    res.status(201).json(buildResponse(true, loc, 'Location created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const loc = await LocationService.update(req.params.id as string, req.body, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, loc, 'Location updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const loc = await LocationService.delete(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, loc, 'Location deactivated successfully'));
  });

  // POST /locations/routes — bulk save the LocationRoute matrix.
  static upsertRoutes = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    const result = await LocationService.upsertRoutes(entries, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, result, 'Routes saved'));
  });

  // POST /locations/via-routes — save a Via-Route definition.
  static saveViaRoute = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { fromLocation, toLocation, routes = [] } = req.body ?? {};
    const loc = await LocationService.saveViaRoute(
      fromLocation,
      toLocation,
      Array.isArray(routes) ? routes : [],
      effectiveCompany(req.user),
    );
    res.status(200).json(buildResponse(true, loc, 'Via-route saved'));
  });
}
