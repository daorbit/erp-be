import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { MisProjectSettingService } from './misProjectSetting.service.js';

export class MisProjectSettingController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true,
      await MisProjectSettingService.getAll(req.user.company as string),
      'MIS project settings retrieved'));
  });

  // GET /mis-project-settings/by-user/:userId
  static getByUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    res.status(200).json(buildResponse(true,
      await MisProjectSettingService.getByUser(req.params.userId as string, req.user.company as string),
      'MIS project setting retrieved'));
  });

  // POST /mis-project-settings  body: { user, projects[] }
  static upsert = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { user, projects = [] } = req.body ?? {};
    res.status(200).json(buildResponse(true,
      await MisProjectSettingService.upsert(user, projects, req.user.company as string),
      'MIS project setting saved'));
  });
}
