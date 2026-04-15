import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { ClosingLeaveTransferService } from './closingLeaveTransfer.service.js';

export class ClosingLeaveTransferController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const rows = await ClosingLeaveTransferService.getAll(req.user.company as string, {
      employee: req.query.employee, fromFinyear: req.query.fromFinyear, toFinyear: req.query.toFinyear,
    });
    res.status(200).json(buildResponse(true, rows, 'Retrieved'));
  });
  static transfer = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const r = await ClosingLeaveTransferService.transfer(req.body.rows ?? [], req.user.company as string);
    res.status(200).json(buildResponse(true, r, 'Transferred'));
  });
}
