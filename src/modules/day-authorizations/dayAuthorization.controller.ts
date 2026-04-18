import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { DayAuthorizationService } from './dayAuthorization.service.js';

export class DayAuthorizationController {
  static get = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.query.user as string;
    const rows = await DayAuthorizationService.getForUser(userId, req.user.company as string);
    res.status(200).json(buildResponse(true, rows, 'Retrieved'));
  });

  static save = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { user, rows } = req.body as { user: string; rows: any[] };
    const r = await DayAuthorizationService.saveBulk(user, req.user.company as string, rows ?? []);
    res.status(200).json(buildResponse(true, r, 'Saved'));
  });
}
