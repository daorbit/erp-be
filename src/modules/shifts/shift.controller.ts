import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { ShiftService } from './shift.service.js';

export class ShiftController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await ShiftService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Shifts retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const shift = await ShiftService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, shift, 'Shift retrieved successfully'),
    );
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const shift = await ShiftService.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user.id,
    });
    res.status(201).json(
      buildResponse(true, shift, 'Shift created successfully'),
    );
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const shift = await ShiftService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, shift, 'Shift updated successfully'),
    );
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const shift = await ShiftService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, shift, 'Shift deactivated successfully'),
    );
  });
}
