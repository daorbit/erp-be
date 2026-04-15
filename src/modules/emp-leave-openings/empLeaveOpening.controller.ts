import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { EmpLeaveOpeningService } from './empLeaveOpening.service.js';

export class EmpLeaveOpeningController {
  static get = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const rows = await EmpLeaveOpeningService.getAll(
      { employee: req.query.employee, finyear: req.query.finyear },
      req.user.company as string,
    );
    res.status(200).json(buildResponse(true, rows, 'Retrieved'));
  });

  static save = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const rows = req.body.rows as any[];
    const r = await EmpLeaveOpeningService.upsertBulk(rows, req.user.company as string);
    res.status(200).json(buildResponse(true, r, 'Saved'));
  });
}
