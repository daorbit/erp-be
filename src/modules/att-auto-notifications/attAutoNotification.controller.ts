import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { AttAutoNotificationService } from './attAutoNotification.service.js';

export class AttAutoNotificationController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const q: IQueryParams = { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 500 };
    const r = await AttAutoNotificationService.getAll(q, effectiveCompany(req.user));
    res.status(200).json(buildResponse(true, r.data, 'Att Auto Notifications retrieved', r.pagination));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await AttAutoNotificationService.create({ ...req.body, company: effectiveCompany(req.user) }), 'Created'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await AttAutoNotificationService.delete(req.params.id as string, effectiveCompany(req.user)), 'Deleted'));
  });
}
