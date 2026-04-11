import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { HolidayService } from './holiday.service.js';

export class HolidayController {
  /**
   * GET / - Get all holidays.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      filters: {
        year: req.query.year as string,
        type: req.query.type as string,
      },
    };

    const result = await HolidayService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Holidays retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /upcoming - Get upcoming holidays.
   */
  static getUpcoming = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const holidays = await HolidayService.getUpcoming(limit, req.user.company);
    res.status(200).json(
      buildResponse(true, holidays, 'Upcoming holidays retrieved successfully'),
    );
  });

  /**
   * GET /year/:year - Get holidays by year.
   */
  static getByYear = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const year = parseInt(req.params.year as string);
    if (isNaN(year)) {
      res.status(400).json(buildResponse(false, null, 'Invalid year format'));
      return;
    }

    const holidays = await HolidayService.getByYear(year, req.user.company);
    res.status(200).json(
      buildResponse(true, holidays, 'Holidays retrieved successfully'),
    );
  });

  /**
   * GET /:id - Get holiday by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const holiday = await HolidayService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, holiday, 'Holiday retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new holiday.
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const holiday = await HolidayService.create({ ...req.body, company: req.user.company, createdBy: req.user.id });
    res.status(201).json(
      buildResponse(true, holiday, 'Holiday created successfully'),
    );
  });

  /**
   * PUT /:id - Update a holiday.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const holiday = await HolidayService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, holiday, 'Holiday updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete a holiday.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const holiday = await HolidayService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, holiday, 'Holiday deactivated successfully'),
    );
  });
}
