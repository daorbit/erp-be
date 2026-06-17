import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { DocumentMasterService } from './documentMaster.service.js';

export class DocumentMasterController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 200, search: req.query.search as string };
    const r = await DocumentMasterService.getAll(q, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, r.data, 'Documents retrieved', r.pagination));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await DocumentMasterService.getById(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await DocumentMasterService.create({ ...req.body, company: effectiveCompany(req.user) });
    res.status(201).json(buildResponse(true, doc, 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await DocumentMasterService.update(req.params.id as string, req.body, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await DocumentMasterService.delete(req.params.id as string, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, doc, 'Deleted'));
  });
}
