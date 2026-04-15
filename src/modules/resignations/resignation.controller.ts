import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { ResignationService } from './resignation.service.js';

export class ResignationController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      filters: {
        employee: req.query.employee as string,
        status: req.query.status as string,
      },
    };
    const r = await ResignationService.getAll(q, req.user.company);
    res.status(200).json(buildResponse(true, r.data, 'Resignations retrieved', r.pagination));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await ResignationService.getById(req.params.id as string, req.user.company), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await ResignationService.create({ ...req.body, company: req.user.company }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await ResignationService.update(req.params.id as string, req.body, req.user.company), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await ResignationService.delete(req.params.id as string, req.user.company), 'Deleted'));
  });
}
