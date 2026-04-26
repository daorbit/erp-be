import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import EmployeeProfile from '../employees/employee.model.js';
import Attendance from '../attendance/attendance.model.js';
import { Payslip } from '../payroll/payroll.model.js';
import { JobPosting, JobApplication } from '../recruitment/recruitment.model.js';
import User from '../auth/auth.model.js';
import Branch from '../branches/branch.model.js';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

export class ReportService {
  /**
   * Employee report: list with department/designation/status filters.
   */
  static async getEmployeeReport(filters: {
    department?: string;
    designation?: string;
    status?: string;
    employmentType?: string;
  }, companyId?: string) {
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = new mongoose.Types.ObjectId(companyId);

    if (filters.department) filter.department = new mongoose.Types.ObjectId(filters.department);
    if (filters.designation) filter.designation = new mongoose.Types.ObjectId(filters.designation);
    if (filters.status) filter.status = filters.status;
    if (filters.employmentType) filter.employmentType = filters.employmentType;

    const employees = await EmployeeProfile.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('department', 'name code')
      .populate('designation', 'title')
      .sort({ dateOfJoining: -1 })
      .lean();

    return {
      totalEmployees: employees.length,
      employees,
    };
  }

  /**
   * Attendance report: monthly summary by employee.
   */
  static async getAttendanceReport(
    month: number,
    year: number,
    departmentId?: string,
    companyId?: string,
  ) {
    if (month < 1 || month > 12) {
      throw new AppError('Month must be between 1 and 12.', 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const matchStage: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate },
    };
    if (companyId) matchStage.company = new mongoose.Types.ObjectId(companyId);

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: { employee: '$employee', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.employee',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
          totalDays: { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
          employeeName: {
            $concat: [
              { $ifNull: ['$employee.firstName', ''] },
              ' ',
              { $ifNull: ['$employee.lastName', ''] },
            ],
          },
          totalDays: 1,
          statuses: 1,
        },
      },
    ];

    // Suppress unused parameter warning - departmentId filtering would
    // require joining with EmployeeProfile which is not always linked by
    // the same field. We include the parameter for future use.
    void departmentId;

    const report = await Attendance.aggregate(pipeline);

    return { month, year, summary: report };
  }

  /**
   * Payroll report: monthly payroll summary.
   */
  static async getPayrollReport(month: number, year: number, companyId?: string) {
    if (month < 1 || month > 12) {
      throw new AppError('Month must be between 1 and 12.', 400);
    }

    const payrollMatch: Record<string, unknown> = { month, year };
    if (companyId) payrollMatch.company = new mongoose.Types.ObjectId(companyId);

    const pipeline: mongoose.PipelineStage[] = [
      { $match: payrollMatch },
      {
        $group: {
          _id: '$status',
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          count: { $sum: 1 },
        },
      },
    ];

    const report = await Payslip.aggregate(pipeline);

    let grandTotalGross = 0;
    let grandTotalNet = 0;
    let grandTotalDeductions = 0;
    let totalPayslips = 0;

    const byStatus: Record<string, unknown> = {};
    for (const item of report) {
      byStatus[item._id as string] = {
        totalGross: item.totalGross,
        totalNet: item.totalNet,
        totalDeductions: item.totalDeductions,
        count: item.count,
      };
      grandTotalGross += item.totalGross as number;
      grandTotalNet += item.totalNet as number;
      grandTotalDeductions += item.totalDeductions as number;
      totalPayslips += item.count as number;
    }

    return {
      month,
      year,
      totalPayslips,
      grandTotalGross,
      grandTotalNet,
      grandTotalDeductions,
      byStatus,
    };
  }

  /**
   * Recruitment report: hiring pipeline stats within a date range.
   */
  static async getRecruitmentReport(dateRange: DateRange, companyId?: string) {
    const matchStage: Record<string, unknown> = {};
    if (companyId) matchStage.company = new mongoose.Types.ObjectId(companyId);

    if (dateRange.startDate || dateRange.endDate) {
      matchStage.createdAt = {};
      if (dateRange.startDate) {
        (matchStage.createdAt as Record<string, unknown>).$gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        (matchStage.createdAt as Record<string, unknown>).$lte = new Date(dateRange.endDate);
      }
    }

    const [jobStats, applicationStats] = await Promise.all([
      JobPosting.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      JobApplication.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const jobStatusCounts: Record<string, number> = {};
    for (const stat of jobStats) {
      jobStatusCounts[stat._id as string] = stat.count as number;
    }

    const applicationStatusCounts: Record<string, number> = {};
    let totalApplications = 0;
    for (const stat of applicationStats) {
      applicationStatusCounts[stat._id as string] = stat.count as number;
      totalApplications += stat.count as number;
    }

    return {
      dateRange,
      jobPostings: jobStatusCounts,
      applications: { total: totalApplications, byStatus: applicationStatusCounts },
    };
  }

  /**
   * Headcount report: department-wise breakdown.
   */
  static async getHeadcountReport(companyId?: string) {
    const headcountMatch: Record<string, unknown> = { isActive: true };
    if (companyId) headcountMatch.company = new mongoose.Types.ObjectId(companyId);

    const pipeline: mongoose.PipelineStage[] = [
      { $match: headcountMatch },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          byStatus: {
            $push: '$status',
          },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          departmentId: '$_id',
          departmentName: { $ifNull: ['$department.name', 'Unassigned'] },
          headcount: '$count',
          byStatus: 1,
        },
      },
      { $sort: { headcount: -1 } },
    ];

    const report = await EmployeeProfile.aggregate(pipeline);

    const totalHeadcount = report.reduce(
      (acc, item) => acc + (item.headcount as number),
      0,
    );

    return { totalHeadcount, departments: report };
  }

  /**
   * Turnover report: joining vs leaving for a year.
   */
  static async getTurnoverReport(year: number, companyId?: string) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const joinedMatch: Record<string, unknown> = {
      dateOfJoining: { $gte: startDate, $lte: endDate },
    };
    if (companyId) joinedMatch.company = new mongoose.Types.ObjectId(companyId);

    const leftMatch: Record<string, unknown> = {
      lastWorkingDate: { $gte: startDate, $lte: endDate },
    };
    if (companyId) leftMatch.company = new mongoose.Types.ObjectId(companyId);

    const [joinedPipeline, leftPipeline] = await Promise.all([
      EmployeeProfile.aggregate([
        {
          $match: joinedMatch,
        },
        {
          $group: {
            _id: { $month: '$dateOfJoining' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      EmployeeProfile.aggregate([
        {
          $match: leftMatch,
        },
        {
          $group: {
            _id: { $month: '$lastWorkingDate' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthly: Array<{
      month: number;
      joined: number;
      left: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      const joined = joinedPipeline.find((j) => j._id === m);
      const left = leftPipeline.find((l) => l._id === m);
      monthly.push({
        month: m,
        joined: (joined?.count as number) ?? 0,
        left: (left?.count as number) ?? 0,
      });
    }

    const totalJoined = monthly.reduce((acc, m) => acc + m.joined, 0);
    const totalLeft = monthly.reduce((acc, m) => acc + m.left, 0);

    return { year, totalJoined, totalLeft, monthly };
  }

  // ─── Site Wise User's List ──────────────────────────────────────────────
  // Server-side filter + group of users × sites × modules. Returns:
  //   { rows: [{ siteName, userName, moduleName, employeeName, userType }],
  //     groups: [{ label, field, count, rows: Row[] }] }
  static async getSiteWiseUsers(
    companyId: string,
    filters: {
      userType?: string;
      siteId?: string;
      department?: string;
      userId?: string;
      userStatus?: 'active' | 'inactive' | 'all';
      groupBy?: 'user_type' | 'user_name' | 'site_name' | 'module_name';
    },
  ) {
    const userFilter: Record<string, unknown> = { company: companyId };
    if (filters.userStatus === 'active') userFilter.isActive = true;
    else if (filters.userStatus === 'inactive') userFilter.isActive = false;
    if (filters.userType && filters.userType !== 'all') userFilter.role = filters.userType;
    if (filters.userId && filters.userId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(filters.userId)) userFilter._id = filters.userId;
    }

    const [users, branches] = await Promise.all([
      User.find(userFilter)
        .select('firstName lastName username email role isActive employeeId branch allowedSites modules')
        .lean(),
      Branch.find({ company: companyId, isActive: true })
        .select('name code')
        .lean(),
    ]);
    const branchById: Record<string, any> = {};
    for (const b of branches) branchById[String(b._id)] = b;

    const DEFAULT_MODULES = [
      'ADMIN', 'ADMIN-ACCOUNTS', 'CORRESPONDENCE', 'HUMAN-RESOURCE', 'MACHINERY',
      'MIS-ADMIN', 'PRODUCTION', 'PROJECT-MANAGEMENT', 'PURCHASE', 'STORE', 'TENDER',
    ];

    type Row = {
      siteName: string;
      userName: string;
      moduleName: string;
      employeeName: string;
      userType: string;
    };
    const rows: Row[] = [];
    for (const u of users as any[]) {
      const allowed: string[] = ([] as string[]).concat(
        u.branch ? [String(u.branch)] : [],
        Array.isArray(u.allowedSites) ? u.allowedSites.map(String) : [],
      );
      let siteIds = filters.siteId && filters.siteId !== 'all'
        ? (allowed.includes(filters.siteId) ? [filters.siteId] : [])
        : allowed.length ? allowed : Object.keys(branchById).slice(0, 1);

      const userMods: string[] = Array.isArray(u.modules) && u.modules.length
        ? u.modules : DEFAULT_MODULES;
      const mods = filters.department && filters.department !== 'all'
        ? (userMods.includes(filters.department) ? [filters.department] : [])
        : userMods;

      for (const sid of siteIds) {
        const site = branchById[sid];
        if (!site) continue;
        for (const m of mods) {
          rows.push({
            siteName: site.name,
            userName: (u.username || u.email || '').toUpperCase(),
            moduleName: m,
            employeeName: [u.firstName, u.lastName].filter(Boolean).join(' ').toUpperCase(),
            userType: (u.role || '').toUpperCase().replace(/_/g, '-'),
          });
        }
      }
    }

    const keyOf = (r: Row) => {
      switch (filters.groupBy) {
        case 'user_name': return r.userName || 'UNASSIGNED';
        case 'site_name': return r.siteName || 'UNASSIGNED';
        case 'module_name': return r.moduleName || 'UNASSIGNED';
        case 'user_type':
        default: return r.userType || 'UNASSIGNED';
      }
    };
    const groupField = (filters.groupBy ?? 'user_type')
      .replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const buckets: Record<string, Row[]> = {};
    for (const r of rows) {
      const k = keyOf(r);
      buckets[k] ??= [];
      buckets[k].push(r);
    }
    const groups = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, list]) => ({ label, field: groupField, count: list.length, rows: list }));

    return { rows, groups };
  }

  // ─── User Work Report ────────────────────────────────────────────────────
  // Aggregates voucher add/edit counts per user per module. Stub returns the
  // shape the FE consumes; populate from the AuditLog collection when ready.
  static async getUserWorkReport(
    _companyId: string,
    _filters: {
      from?: string; to?: string; module?: string;
      userType?: string; userId?: string; siteIds?: string[];
    },
  ) {
    return { hr: [], purchase: [], machine: [], account: [], pm: [] };
  }
}
