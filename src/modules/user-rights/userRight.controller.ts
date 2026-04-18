import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { UserRightService } from './userRight.service.js';

export class UserRightController {
  static get = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { user, branch } = req.query as Record<string, string>;
    const doc = await UserRightService.getFor(user, req.user.company as string, branch);
    res.status(200).json(buildResponse(true, doc, 'Retrieved'));
  });

  static save = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await UserRightService.upsert({ ...req.body, company: req.user.company });
    res.status(200).json(buildResponse(true, doc, 'Rights saved'));
  });

  static copy = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { fromUser, toUser, branch } = req.body as { fromUser: string; toUser: string; branch: string };
    const doc = await UserRightService.copyRights(fromUser, toUser, req.user.company as string, branch);
    res.status(200).json(buildResponse(true, doc, 'Rights copied'));
  });
}
