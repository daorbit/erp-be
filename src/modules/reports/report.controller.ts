import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest } from '../../shared/types.js';
import { ReportService } from './report.service.js';

export const getEmployeeReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const report = await ReportService.getEmployeeReport({
    department: req.query.department as string,
    designation: req.query.designation as string,
    status: req.query.status as string,
    employmentType: req.query.employmentType as string,
  }, authReq.user.company);

  res.status(200).json(
    buildResponse(true, report, 'Employee report generated successfully'),
  );
});

export const getAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    res.status(400).json(buildResponse(false, null, 'Month and year are required'));
    return;
  }

  const authReq = req as IAuthRequest;
  const report = await ReportService.getAttendanceReport(
    month,
    year,
    req.query.department as string,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, report, 'Attendance report generated successfully'),
  );
});

export const getPayrollReport = asyncHandler(async (req: Request, res: Response) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    res.status(400).json(buildResponse(false, null, 'Month and year are required'));
    return;
  }

  const authReq = req as IAuthRequest;
  const report = await ReportService.getPayrollReport(month, year, authReq.user.company);

  res.status(200).json(
    buildResponse(true, report, 'Payroll report generated successfully'),
  );
});

export const getRecruitmentReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const report = await ReportService.getRecruitmentReport({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  }, authReq.user.company);

  res.status(200).json(
    buildResponse(true, report, 'Recruitment report generated successfully'),
  );
});

export const getHeadcountReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const report = await ReportService.getHeadcountReport(authReq.user.company);

  res.status(200).json(
    buildResponse(true, report, 'Headcount report generated successfully'),
  );
});

export const getTurnoverReport = asyncHandler(async (req: Request, res: Response) => {
  const year = Number(req.query.year);

  if (!year) {
    res.status(400).json(buildResponse(false, null, 'Year is required'));
    return;
  }

  const authReq = req as IAuthRequest;
  const report = await ReportService.getTurnoverReport(year, authReq.user.company);

  res.status(200).json(
    buildResponse(true, report, 'Turnover report generated successfully'),
  );
});

// User Work Report — aggregates voucher counts per user per module.
export const getUserWorkReport = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const result = await ReportService.getUserWorkReport(authReq.user.company as string, {
    from: req.query.from as string,
    to: req.query.to as string,
    module: req.query.module as string,
    userType: req.query.userType as string,
    userId: req.query.userId as string,
    siteIds: typeof req.query.siteIds === 'string' ? req.query.siteIds.split(',') : undefined,
  });
  res.status(200).json(buildResponse(true, result, 'User work report generated'));
});

// Site Wise User's List — server-filtered + grouped roster of (user × site × module).
export const getSiteWiseUsers = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const result = await ReportService.getSiteWiseUsers(authReq.user.company as string, {
    userType: req.query.userType as string,
    siteId: req.query.siteId as string,
    department: req.query.department as string,
    userId: req.query.userId as string,
    userStatus: req.query.userStatus as 'active' | 'inactive' | 'all',
    groupBy: req.query.groupBy as 'user_type' | 'user_name' | 'site_name' | 'module_name',
  });
  res.status(200).json(buildResponse(true, result, 'Site-wise users retrieved'));
});
