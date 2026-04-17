import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import EmployeeProfile from '../employees/employee.model.js';
import Attendance from '../attendance/attendance.model.js';
import { LeaveRequest } from '../leaves/leave.model.js';
import { Payslip } from '../payroll/payroll.model.js';
import { JobPosting, JobApplication } from '../recruitment/recruitment.model.js';

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
   * Leave report: usage summary for a year.
   */
  static async getLeaveReport(year: number, departmentId?: string, companyId?: string) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const matchStage: Record<string, unknown> = {
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
    };
    if (companyId) matchStage.company = new mongoose.Types.ObjectId(companyId);

    void departmentId;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: { status: '$status' },
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' },
        },
      },
    ];

    const report = await LeaveRequest.aggregate(pipeline);

    const summary: Record<string, { count: number; totalDays: number }> = {};
    for (const item of report) {
      summary[item._id.status as string] = {
        count: item.count as number,
        totalDays: item.totalDays as number,
      };
    }

    return { year, summary };
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
}
