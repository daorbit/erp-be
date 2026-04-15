import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AttUploadSiteService } from './attUploadSite.service.js';

export class AttUploadSiteController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 500 };
    const r = await AttUploadSiteService.getAll(q, req.user.company);
    res.status(200).json(buildResponse(true, r.data, 'Att Upload Sites retrieved', r.pagination));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await AttUploadSiteService.create({ ...req.body, company: req.user.company }), 'Created'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await AttUploadSiteService.delete(req.params.id as string, req.user.company), 'Deleted'));
  });
}
