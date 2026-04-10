import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { InvitationService } from './invitation.service.js';

export class InvitationController {
  /**
   * POST / — Create an invitation (admin only).
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const data = { ...req.body };

    // Non-super_admin users can only invite to their own company
    if (req.user.role !== 'super_admin' && req.user.company) {
      data.company = req.user.company;
    }

    const result = await InvitationService.create(data, req.user.id);

    res.status(201).json(
      buildResponse(true, result, 'Invitation created successfully'),
    );
  });

  /**
   * POST /accept — Accept an invitation (public).
   */
  static accept = asyncHandler(async (req: Request, res: Response) => {
    const result = await InvitationService.accept(req.body);

    res.status(201).json(
      buildResponse(true, result, 'Account created successfully. Please log in.'),
    );
  });

  /**
   * GET / — List pending invitations (admin only).
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const invitations = await InvitationService.getAll(req.user.company);

    res.status(200).json(
      buildResponse(true, invitations, 'Invitations retrieved successfully'),
    );
  });

  /**
   * GET /:token — Get invitation details by token (public).
   */
  static getByToken = asyncHandler(async (req: Request, res: Response) => {
    const data = await InvitationService.getByToken(req.params.token as string);

    res.status(200).json(
      buildResponse(true, data, 'Invitation retrieved successfully'),
    );
  });
}
