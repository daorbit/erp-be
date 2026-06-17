import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { effectiveCompany } from '../../shared/scope.js';
import { SmsEmailAlertService } from './smsEmailAlert.service.js';

export class SmsEmailAlertController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.getAll(effectiveCompany(req.user) as string), 'Retrieved'));
  });
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.getById(req.params.id as string, effectiveCompany(req.user) as string), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await SmsEmailAlertService.create({ ...req.body, company: effectiveCompany(req.user) }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.update(req.params.id as string, req.body, effectiveCompany(req.user) as string), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.delete(req.params.id as string, effectiveCompany(req.user) as string), 'Deleted'));
  });
}
