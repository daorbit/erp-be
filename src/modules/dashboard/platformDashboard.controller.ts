import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { PlatformDashboardService } from './platformDashboard.service.js';

export class PlatformDashboardController {
  static getStats = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const stats = await PlatformDashboardService.getStats();
    res.status(200).json(
      buildResponse(true, stats, 'Platform statistics retrieved successfully'),
    );
  });

  static getCompanyOverviews = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const overviews = await PlatformDashboardService.getCompanyOverviews();
    res.status(200).json(
      buildResponse(true, overviews, 'Company overviews retrieved successfully'),
    );
  });

  static getCompanyGrowth = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const growth = await PlatformDashboardService.getCompanyGrowth();
    res.status(200).json(
      buildResponse(true, growth, 'Company growth data retrieved successfully'),
    );
  });

  static getUserDistribution = asyncHandler(async (_req: IAuthRequest, res: Response) => {
    const distribution = await PlatformDashboardService.getUserDistribution();
    res.status(200).json(
      buildResponse(true, distribution, 'User distribution retrieved successfully'),
    );
  });
}
