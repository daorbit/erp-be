import type { Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import { UserRole, type IAuthRequest } from '../../shared/types.js';
import { ShiftSessionService } from './shiftSession.service.js';

const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.HR_MANAGER,
];

function isAdminLike(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export class ShiftSessionController {
  /** POST /shift-sessions/start — employee punches in (selfie + coords). */
  static start = asyncHandler(async (req: IAuthRequest, res: Response) => {
    if (!req.user.company) {
      throw new AppError('Company association required.', 403);
    }
    const session = await ShiftSessionService.start(
      req.user.id,
      req.user.company,
      req.body,
      req.file,
    );
    res
      .status(201)
      .json(buildResponse(true, session, 'Shift started successfully'));
  });

  /** POST /shift-sessions/:id/track — append GPS point. */
  static track = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const session = await ShiftSessionService.track(
      String(req.params.id),
      req.user.id,
      req.body,
    );
    res.status(200).json(
      buildResponse(
        true,
        {
          _id: session._id,
          totalDistanceMeters: session.totalDistanceMeters,
          latestLocation: session.latestLocation,
          latestSiteDistanceMeters: session.latestSiteDistanceMeters,
          siteBufferKm: session.siteBufferKm,
          latestSiteWithinBuffer: session.latestSiteWithinBuffer,
          gpsTrailCount: session.gpsTrail.length,
        },
        'Location captured',
      ),
    );
  });

  /** POST /shift-sessions/:id/end — employee punches out. */
  static end = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const session = await ShiftSessionService.end(
      String(req.params.id),
      req.user.id,
      req.body,
    );
    res.status(200).json(buildResponse(true, session, 'Shift ended successfully'));
  });

  /** GET /shift-sessions/active — returns the user's currently active shift (if any). */
  static getActive = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const session = await ShiftSessionService.getActiveForUser(req.user.id);
    res.status(200).json(buildResponse(true, session, 'Active shift retrieved'));
  });

  /** GET /shift-sessions/my — current user's history. */
  static getMy = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await ShiftSessionService.list(
      {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'shiftStartedAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        status: req.query.status as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      },
      {
        companyId: req.user.company,
        userId: req.user.id,
        allowAll: false,
      },
    );
    res
      .status(200)
      .json(buildResponse(true, result.data, 'Shift sessions retrieved', result.pagination));
  });

  /** GET /shift-sessions — admin/HR listing across the company. */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await ShiftSessionService.list(
      {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'shiftStartedAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        status: req.query.status as string | undefined,
        employee: req.query.employee as string | undefined,
        site: req.query.site as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      },
      {
        companyId: req.user.company,
        allowAll: true,
      },
    );
    res
      .status(200)
      .json(buildResponse(true, result.data, 'Shift sessions retrieved', result.pagination));
  });

  /** GET /shift-sessions/reports/site-duration — employee x site duration report. */
  static siteDurationReport = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const result = await ShiftSessionService.siteDurationReport(
      {
        status: req.query.status as string | undefined,
        employee: req.query.employee as string | undefined,
        site: req.query.site as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      },
      { companyId: req.user.company },
    );
    res.status(200).json(buildResponse(true, result, 'Site duration report retrieved'));
  });

  /** GET /shift-sessions/:id — detail (admin/HR sees any in company; employees only own). */
  static getOne = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const allowAll = isAdminLike(req.user.role);
    const session = await ShiftSessionService.getById(String(req.params.id), {
      companyId: req.user.company,
      userId: req.user.id,
      allowAll,
    });
    res.status(200).json(buildResponse(true, session, 'Shift session retrieved'));
  });
}
