import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  /**
   * GET /stats - Get dashboard statistics.
   */
  static getStats = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const stats = await DashboardService.getStats();
    res.status(200).json(
      buildResponse(true, stats, 'Dashboard statistics retrieved successfully'),
    );
  });

  /**
   * GET /attendance-overview - Get attendance overview for a date.
   */
  static getAttendanceOverview = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const overview = await DashboardService.getAttendanceOverview(date);
    res.status(200).json(
      buildResponse(true, overview, 'Attendance overview retrieved successfully'),
    );
  });

  /**
   * GET /leave-overview - Get leave requests overview.
   */
  static getLeaveOverview = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const overview = await DashboardService.getLeaveOverview();
    res.status(200).json(
      buildResponse(true, overview, 'Leave overview retrieved successfully'),
    );
  });

  /**
   * GET /department-distribution - Get employee count per department.
   */
  static getDepartmentDistribution = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const distribution = await DashboardService.getDepartmentDistribution();
    res.status(200).json(
      buildResponse(true, distribution, 'Department distribution retrieved successfully'),
    );
  });

  /**
   * GET /recent-activities - Get recent activities.
   */
  static getRecentActivities = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await DashboardService.getRecentActivities(limit);
    res.status(200).json(
      buildResponse(true, activities, 'Recent activities retrieved successfully'),
    );
  });

  /**
   * GET /birthdays - Get birthdays this month.
   */
  static getBirthdays = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const birthdays = await DashboardService.getBirthdaysThisMonth();
    res.status(200).json(
      buildResponse(true, birthdays, 'Birthdays retrieved successfully'),
    );
  });

  /**
   * GET /anniversaries - Get work anniversaries this month.
   */
  static getAnniversaries = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const anniversaries = await DashboardService.getAnniversariesThisMonth();
    res.status(200).json(
      buildResponse(true, anniversaries, 'Anniversaries retrieved successfully'),
    );
  });
}
