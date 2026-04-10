import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AnnouncementService } from './announcement.service.js';

export class AnnouncementController {
  /**
   * GET / - Get all announcements.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'publishDate',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        category: req.query.category as string,
        priority: req.query.priority as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      },
    };

    const result = await AnnouncementService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Announcements retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /active - Get currently active announcements.
   */
  static getActive = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcements = await AnnouncementService.getActive(req.user.company);
    res.status(200).json(
      buildResponse(true, announcements, 'Active announcements retrieved successfully'),
    );
  });

  /**
   * GET /:id - Get announcement by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new announcement.
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const data = {
      ...req.body,
      createdBy: req.user.id,
      company: req.user.company,
    };
    const announcement = await AnnouncementService.create(data);
    res.status(201).json(
      buildResponse(true, announcement, 'Announcement created successfully'),
    );
  });

  /**
   * PUT /:id - Update an announcement.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete an announcement.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement deactivated successfully'),
    );
  });

  /**
   * PUT /:id/read - Mark announcement as read.
   */
  static markRead = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.markRead(req.params.id as string, req.user.id, req.user.company);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement marked as read'),
    );
  });
}
