import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AttendanceService } from './attendance.service.js';

export class AttendanceController {
  /**
   * GET / - Get all attendance records.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        employee: req.query.employee as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      },
    };

    const result = await AttendanceService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Attendance records retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get attendance record by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await AttendanceService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, record, 'Attendance record retrieved successfully'),
    );
  });

  /**
   * POST /check-in - Employee check in.
   */
  static checkIn = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await AttendanceService.checkIn(req.user.id, req.body, req.user.company);
    res.status(201).json(
      buildResponse(true, record, 'Checked in successfully'),
    );
  });

  /**
   * POST /check-out - Employee check out.
   */
  static checkOut = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await AttendanceService.checkOut(req.user.id, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, record, 'Checked out successfully'),
    );
  });

  /**
   * GET /my - Get own attendance for a month.
   */
  static getMyAttendance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const records = await AttendanceService.getMyAttendance(req.user.id, month, year, req.user.company);
    res.status(200).json(
      buildResponse(true, records, 'Attendance records retrieved successfully'),
    );
  });

  /**
   * GET /summary/:employeeId - Get attendance summary.
   */
  static getSummary = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const summary = await AttendanceService.getAttendanceSummary(
      req.params.employeeId as string,
      month,
      year,
      req.user.company,
    );
    res.status(200).json(
      buildResponse(true, summary, 'Attendance summary retrieved successfully'),
    );
  });

  /**
   * POST /mark - Admin mark attendance for an employee.
   */
  static markAttendance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const record = await AttendanceService.markAttendance(req.body, req.user.company);
    res.status(201).json(
      buildResponse(true, record, 'Attendance marked successfully'),
    );
  });

  /**
   * POST /bulk-mark - Bulk mark attendance.
   */
  static bulkMarkAttendance = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const records = await AttendanceService.bulkMarkAttendance(req.body, req.user.company);
    res.status(201).json(
      buildResponse(true, records, `Attendance marked for ${records.length} employees`),
    );
  });

  /**
   * GET /daily-report - Get daily attendance report.
   */
  static getDailyReport = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const records = await AttendanceService.getDailyReport(date, req.user.company);
    res.status(200).json(
      buildResponse(true, records, 'Daily report retrieved successfully'),
    );
  });
}
