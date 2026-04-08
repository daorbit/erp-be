import dayjs from 'dayjs';
import User from '../auth/auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Department from '../departments/department.model.js';
import Attendance, { AttendanceStatus } from '../attendance/attendance.model.js';
import { LeaveRequest, LeaveRequestStatus } from '../leaves/leave.model.js';
import { Payslip } from '../payroll/payroll.model.js';
import Holiday from '../holidays/holiday.model.js';
import Announcement from '../announcements/announcement.model.js';
import { PayslipStatus } from '../payroll/payroll.model.js';

interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  };
  upcomingHolidays: number;
  recentHires: number;
  activeAnnouncements: number;
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

interface LeaveOverview {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
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
  static async getStats(): Promise<DashboardStats> {
    const today = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();
    const now = new Date();

    const [
      totalEmployees,
      totalDepartments,
      pendingLeaves,
      todayAttendanceRecords,
      upcomingHolidays,
      recentHires,
      activeAnnouncements,
      pendingPayroll,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      LeaveRequest.countDocuments({ status: LeaveRequestStatus.PENDING }),
      Attendance.find({ date: { $gte: today, $lte: todayEnd } }).lean(),
      Holiday.countDocuments({
        date: { $gte: today },
        isActive: true,
      }),
      EmployeeProfile.countDocuments({
        joinDate: { $gte: thirtyDaysAgo },
        isActive: true,
      }),
      Announcement.countDocuments({
        isActive: true,
        publishDate: { $lte: now },
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: now } },
        ],
      }),
      Payslip.countDocuments({ status: PayslipStatus.DRAFT }),
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
      pendingLeaves,
      todayAttendance,
      upcomingHolidays,
      recentHires,
      activeAnnouncements,
      pendingPayroll,
    };
  }

  /**
   * Get attendance overview for a specific date.
   */
  static async getAttendanceOverview(date: string): Promise<AttendanceOverview> {
    const targetDate = dayjs(date).startOf('day').toDate();
    const targetDateEnd = dayjs(date).endOf('day').toDate();

    const records = await Attendance.find({
      date: { $gte: targetDate, $lte: targetDateEnd },
    }).lean();

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
   * Get leave requests overview (counts by status).
   */
  static async getLeaveOverview(): Promise<LeaveOverview> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const [pending, approved, rejected, cancelled] = await Promise.all([
      LeaveRequest.countDocuments({
        status: LeaveRequestStatus.PENDING,
        createdAt: { $gte: yearStart },
      }),
      LeaveRequest.countDocuments({
        status: LeaveRequestStatus.APPROVED,
        createdAt: { $gte: yearStart },
      }),
      LeaveRequest.countDocuments({
        status: LeaveRequestStatus.REJECTED,
        createdAt: { $gte: yearStart },
      }),
      LeaveRequest.countDocuments({
        status: LeaveRequestStatus.CANCELLED,
        createdAt: { $gte: yearStart },
      }),
    ]);

    return { pending, approved, rejected, cancelled };
  }

  /**
   * Get employee count per department.
   */
  static async getDepartmentDistribution(): Promise<DepartmentDistribution[]> {
    const departments = await Department.find({ isActive: true })
      .populate('employeeCount')
      .lean();

    return departments.map((dept) => ({
      department: dept.name,
      code: dept.code,
      count: (dept as unknown as { employeeCount?: number }).employeeCount ?? 0,
    }));
  }

  /**
   * Get recent activities across all modules.
   */
  static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Recent leave requests
    const recentLeaves = await LeaveRequest.find()
      .populate('employee', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    for (const leave of recentLeaves) {
      const emp = leave.employee as unknown as { firstName?: string; lastName?: string };
      const name = emp?.firstName && emp?.lastName
        ? `${emp.firstName} ${emp.lastName}`
        : 'An employee';
      activities.push({
        type: 'leave',
        description: `${name} submitted a leave request (${leave.status})`,
        timestamp: leave.createdAt,
      });
    }

    // Recent attendance
    const recentAttendance = await Attendance.find()
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

    // Recent announcements
    const recentAnnouncements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    for (const ann of recentAnnouncements) {
      activities.push({
        type: 'announcement',
        description: `New announcement: ${ann.title}`,
        timestamp: ann.createdAt,
      });
    }

    // Sort all activities by timestamp (most recent first) and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, limit);
  }

  /**
   * Get employees with birthdays this month.
   */
  static async getBirthdaysThisMonth(): Promise<EmployeeBirthday[]> {
    const currentMonth = new Date().getMonth() + 1; // 1-based

    // Use aggregation to match on month of dateOfBirth
    const employees = await EmployeeProfile.aggregate([
      {
        $match: {
          isActive: true,
          dateOfBirth: { $exists: true, $ne: null },
          $expr: {
            $eq: [{ $month: '$dateOfBirth' }, currentMonth],
          },
        },
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
  static async getAnniversariesThisMonth(): Promise<Array<{
    name: string;
    email: string;
    joinDate: Date;
    years: number;
    department?: string;
  }>> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const employees = await EmployeeProfile.aggregate([
      {
        $match: {
          isActive: true,
          joinDate: { $exists: true, $ne: null },
          $expr: {
            $and: [
              { $eq: [{ $month: '$joinDate' }, currentMonth] },
              { $lt: [{ $year: '$joinDate' }, currentYear] }, // exclude this year's hires
            ],
          },
        },
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
