import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { QualificationService } from './qualification.service.js';

export class QualificationController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 200,
      search: req.query.search as string,
    };
    const r = await QualificationService.getAll(q, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, r.data, 'Qualifications retrieved', r.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await QualificationService.getById(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Retrieved'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await QualificationService.create({ ...req.body, company: effectiveCompany(req.user) });
    res.status(201).json(buildResponse(true, doc, 'Created'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await QualificationService.update(req.params.id as string, req.body, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Updated'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await QualificationService.delete(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Deleted'));
  });
}
