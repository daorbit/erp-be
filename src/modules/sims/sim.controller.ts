import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { SimService } from './sim.service.js';

export class SimController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
      filters: {
        status: req.query.status as string,
        simType: req.query.simType as string,
        purchaseFrom: req.query.purchaseFrom as string,
        purchaseTo: req.query.purchaseTo as string,
      },
    };
    const r = await SimService.getAll(q, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, r.data, 'Sims retrieved', r.pagination));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SimService.getById(req.params.id as string, effectiveCompany(req.user)), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await SimService.create({ ...req.body, company: effectiveCompany(req.user) }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SimService.update(req.params.id as string, req.body, effectiveCompany(req.user)), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SimService.delete(req.params.id as string, effectiveCompany(req.user)), 'Deleted'));
  });
}
