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
        category: req.query.category,
        priority: req.query.priority,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      },
    };

    const result = await AnnouncementService.getAll(query);
    res.status(200).json(
      buildResponse(true, result.data, 'Announcements retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /active - Get currently active announcements.
   */
  static getActive = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const announcements = await AnnouncementService.getActive();
    res.status(200).json(
      buildResponse(true, announcements, 'Active announcements retrieved successfully'),
    );
  });

  /**
   * GET /:id - Get announcement by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.getById(req.params.id);
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
    const announcement = await AnnouncementService.update(req.params.id, req.body);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete an announcement.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.delete(req.params.id);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement deactivated successfully'),
    );
  });

  /**
   * PUT /:id/read - Mark announcement as read.
   */
  static markRead = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const announcement = await AnnouncementService.markRead(req.params.id, req.user.id);
    res.status(200).json(
      buildResponse(true, announcement, 'Announcement marked as read'),
    );
  });
}
