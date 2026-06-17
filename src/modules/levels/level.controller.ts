import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { LevelService } from './level.service.js';

export class LevelController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 200, search: req.query.search as string };
    const r = await LevelService.getAll(q, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, r.data, 'Levels retrieved', r.pagination));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await LevelService.getById(req.params.id as string, effectiveCompany(req.user)), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await LevelService.create({ ...req.body, company: effectiveCompany(req.user) }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await LevelService.update(req.params.id as string, req.body, effectiveCompany(req.user)), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await LevelService.delete(req.params.id as string, effectiveCompany(req.user)), 'Deleted'));
  });
}
