import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { OptionalHolidayService } from './optionalHoliday.service.js';

export class OptionalHolidayController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const rows = await OptionalHolidayService.getAll(req.user.company as string, req.query.finyear as string);
    res.status(200).json(buildResponse(true, rows, 'Retrieved'));
  });
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await OptionalHolidayService.create({ ...req.body, company: req.user.company });
    res.status(201).json(buildResponse(true, doc, 'Created'));
  });
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await OptionalHolidayService.update(req.params.id as string, req.body, req.user.company as string);
    res.status(200).json(buildResponse(true, doc, 'Updated'));
  });
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const doc = await OptionalHolidayService.delete(req.params.id as string, req.user.company as string);
    res.status(200).json(buildResponse(true, doc, 'Deleted'));
  });
}
