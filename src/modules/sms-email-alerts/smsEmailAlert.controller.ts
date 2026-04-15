import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { SmsEmailAlertService } from './smsEmailAlert.service.js';

export class SmsEmailAlertController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.getAll(req.user.company as string), 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(201).json(buildResponse(true, await SmsEmailAlertService.create({ ...req.body, company: req.user.company }), 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.update(req.params.id as string, req.body, req.user.company as string), 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true, await SmsEmailAlertService.delete(req.params.id as string, req.user.company as string), 'Deleted'));
  });
}
