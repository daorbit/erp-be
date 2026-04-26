import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { MobileAppCountService } from './mobileAppCount.service.js';

export class MobileAppCountController {
  static get = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await MobileAppCountService.getForCompany(req.user.company as string);
    res.status(200).json(buildResponse(true, doc, 'Mobile app counts retrieved'));
  });

  // PUT /mobile-app-counts/limits
  static updateLimits = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await MobileAppCountService.updateLimits(req.user.company as string, req.body ?? {});
    res.status(200).json(buildResponse(true, doc, 'Limits updated'));
  });

  // POST /mobile-app-counts/activation-users
  static addUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await MobileAppCountService.addActivationUser(req.user.company as string, req.body ?? {});
    res.status(201).json(buildResponse(true, doc, 'Activation user added'));
  });

  // PUT /mobile-app-counts/activation-users/:userId
  static updateUser = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await MobileAppCountService.updateActivationUser(
      req.user.company as string,
      req.params.userId as string,
      req.body ?? {},
    );
    res.status(200).json(buildResponse(true, doc, 'Activation user updated'));
  });

  // GET /mobile-app-counts/activation-users?name=&userStatus=...
  static listUsers = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const users = await MobileAppCountService.listActivationUsers(req.user.company as string, {
      name: req.query.name as string,
      userStatus: req.query.userStatus as any,
    });
    res.status(200).json(buildResponse(true, users, 'Activation users retrieved'));
  });
}
