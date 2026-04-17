import mongoose from 'mongoose';
import dayjs from 'dayjs';
import User from '../auth/auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Department from '../departments/department.model.js';
import Attendance, { AttendanceStatus } from '../attendance/attendance.model.js';
import { Payslip, PayslipStatus } from '../payroll/payroll.model.js';

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  };
  recentHires: number;
  pendingPayroll: number;
}

interface AttendanceOverview {
  date: string;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
  workFromHome: number;
  total: number;
}

interface DepartmentDistribution {
  department: string;
  code: string;
  count: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: Date;
}

interface EmployeeBirthday {
  name: string;
  email: string;
  dateOfBirth: Date;
  department?: string;
}

export class DashboardService {
  /**
   * Get high-level statistics for the dashboard.
   */
  static async getStats(companyId?: string): Promise<DashboardStats> {
    const today = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const now = new Date();

    const userFilter: Record<string, unknown> = { isActive: true };
    if (companyId) userFilter.company = companyId;

    const deptFilter: Record<string, unknown> = { isActive: true };
    if (companyId) deptFilter.company = companyId;

    const attendanceFilter: Record<string, unknown> = { date: { $gte: today, $lte: todayEnd } };
    if (companyId) attendanceFilter.company = companyId;

    const hiresFilter: Record<string, unknown> = { joinDate: { $gte: thirtyDaysAgo }, isActive: true };
    if (companyId) hiresFilter.company = companyId;

    const payrollFilter: Record<string, unknown> = { status: PayslipStatus.DRAFT };
    if (companyId) payrollFilter.company = companyId;

    const [
      totalEmployees,
      totalDepartments,
      todayAttendanceRecords,
      recentHires,
      pendingPayroll,
    ] = await Promise.all([
      User.countDocuments(userFilter),
      Department.countDocuments(deptFilter),
      Attendance.find(attendanceFilter).lean(),
      EmployeeProfile.countDocuments(hiresFilter),
      Payslip.countDocuments(payrollFilter),
    ]);

    // Count attendance statuses
    const todayAttendance = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
    };

    for (const record of todayAttendanceRecords) {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          todayAttendance.present++;
          break;
        case AttendanceStatus.ABSENT:
          todayAttendance.absent++;
          break;
        case AttendanceStatus.LATE:
          todayAttendance.late++;
          break;
        case AttendanceStatus.ON_LEAVE:
          todayAttendance.onLeave++;
          break;
      }
    }

    return {
      totalEmployees,
      totalDepartments,
      todayAttendance,
      recentHires,
      activeAnnouncements,
      pendingPayroll,
    };
  }

  /**
   * Get attendance overview for a specific date.
   */
  static async getAttendanceOverview(date: string, companyId?: string): Promise<AttendanceOverview> {
    const targetDate = dayjs(date).startOf('day').toDate();
    const targetDateEnd = dayjs(date).endOf('day').toDate();

    const overviewFilter: Record<string, unknown> = {
      date: { $gte: targetDate, $lte: targetDateEnd },
    };
    if (companyId) overviewFilter.company = companyId;

    const records = await Attendance.find(overviewFilter).lean();

    const overview: AttendanceOverview = {
      date,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      halfDay: 0,
      workFromHome: 0,
      total: records.length,
    };

    for (const record of records) {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          overview.present++;
          break;
        case AttendanceStatus.ABSENT:
          overview.absent++;
          break;
        case AttendanceStatus.LATE:
          overview.late++;
          break;
        case AttendanceStatus.ON_LEAVE:
          overview.onLeave++;
          break;
        case AttendanceStatus.HALF_DAY:
          overview.halfDay++;
          break;
        case AttendanceStatus.WORK_FROM_HOME:
          overview.workFromHome++;
          break;
      }
    }

    return overview;
  }

  /**
   * Get employee count per department.
   */
  static async getDepartmentDistribution(companyId?: string): Promise<DepartmentDistribution[]> {
    const distFilter: Record<string, unknown> = { isActive: true };
    if (companyId) distFilter.company = companyId;

    const departments = await Department.find(distFilter)
      .populate('employeeCount')
      .lean();

    return departments.map((dept) => ({
      department: dept.name,
      code: dept.shortName,
      count: (dept as unknown as { employeeCount?: number }).employeeCount ?? 0,
    }));
  }

  /**
   * Get recent activities across all modules.
   */
  static async getRecentActivities(limit: number = 10, companyId?: string): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    const activityFilter: Record<string, unknown> = {};
    if (companyId) activityFilter.company = companyId;

    // Recent attendance
    const recentAttendance = await Attendance.find(activityFilter)
      .populate('employee', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    for (const att of recentAttendance) {
      const emp = att.employee as unknown as { firstName?: string; lastName?: string };
      const name = emp?.firstName && emp?.lastName
        ? `${emp.firstName} ${emp.lastName}`
        : 'An employee';
      activities.push({
        type: 'attendance',
        description: `${name} marked ${att.status}`,
        timestamp: att.createdAt,
      });
    }

    // Sort all activities by timestamp (most recent first) and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit);
  }

  /**
   * Get employees with birthdays this month.
   */
  static async getBirthdaysThisMonth(companyId?: string): Promise<EmployeeBirthday[]> {
    const currentMonth = new Date().getMonth() + 1; // 1-based

    const birthdayMatch: Record<string, unknown> = {
      isActive: true,
      dateOfBirth: { $exists: true, $ne: null },
      $expr: {
        $eq: [{ $month: '$dateOfBirth' }, currentMonth],
      },
    };
    if (companyId) birthdayMatch.company = new mongoose.Types.ObjectId(companyId);

    // Use aggregation to match on month of dateOfBirth
    const employees = await EmployeeProfile.aggregate([
      {
        $match: birthdayMatch,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, department: 1 } },
          ],
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'departments',
          localField: 'user.department',
          foreignField: '_id',
          as: 'dept',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          dateOfBirth: 1,
          department: '$dept.name',
        },
      },
      { $sort: { dateOfBirth: 1 } },
    ]);

    return employees as EmployeeBirthday[];
  }

  /**
   * Get employees with work anniversaries this month.
   */
  static async getAnniversariesThisMonth(companyId?: string): Promise<Array<{
    name: string;
    email: string;
    joinDate: Date;
    years: number;
    department?: string;
  }>> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const anniversaryMatch: Record<string, unknown> = {
      isActive: true,
      joinDate: { $exists: true, $ne: null },
      $expr: {
        $and: [
          { $eq: [{ $month: '$joinDate' }, currentMonth] },
          { $lt: [{ $year: '$joinDate' }, currentYear] }, // exclude this year's hires
        ],
      },
    };
    if (companyId) anniversaryMatch.company = new mongoose.Types.ObjectId(companyId);

    const employees = await EmployeeProfile.aggregate([
      {
        $match: anniversaryMatch,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, department: 1 } },
          ],
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'departments',
          localField: 'user.department',
          foreignField: '_id',
          as: 'dept',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          email: '$user.email',
          joinDate: 1,
          years: { $subtract: [currentYear, { $year: '$joinDate' }] },
          department: '$dept.name',
        },
      },
      { $sort: { joinDate: 1 } },
    ]);

    return employees;
  }
}
