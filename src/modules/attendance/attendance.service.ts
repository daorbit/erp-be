import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Attendance, { AttendanceStatus, type IAttendance } from './attendance.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Shift from '../shifts/shift.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

interface CheckInData {
  location?: { latitude?: number; longitude?: number };
  notes?: string;
}

interface CheckOutData {
  location?: { latitude?: number; longitude?: number };
  notes?: string;
}

interface MarkAttendanceData {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

interface BulkMarkData {
  date: string;
  entries: Array<{
    employeeId: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }>;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  workFromHome: number;
  holiday: number;
  weekOff: number;
  totalWorkingDays: number;
}

export class AttendanceService {
  /**
   * Get all attendance records with filters and pagination.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IAttendance>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;

    if (filters.employee) {
      filter.employee = filters.employee;
    }

    if (filters.status) {
      filter.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) {
        (filter.date as Record<string, unknown>).$gte = new Date(filters.startDate as string);
      }
      if (filters.endDate) {
        (filter.date as Record<string, unknown>).$lte = new Date(filters.endDate as string);
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'firstName lastName email employeeId')
        .populate('approvedBy', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    return {
      data: records as any as IAttendance[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get attendance record by ID.
   */
  static async getById(id: string, companyId?: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid attendance ID format.', 400);
    }

    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const record = await Attendance.findOne(findFilter)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email');

    if (!record) {
      throw new AppError('Attendance record not found.', 404);
    }

    return record;
  }

  /**
   * Check in an employee for today.
   */
  static async checkIn(employeeId: string, data: CheckInData, companyId?: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const today = dayjs().startOf('day').toDate();

    // Check if already checked in today
    const checkInFilter: Record<string, unknown> = {
      employee: employeeId,
      date: today,
    };
    if (companyId) checkInFilter.company = companyId;

    const existing = await Attendance.findOne(checkInFilter);

    if (existing) {
      if (existing.checkIn) {
        throw new AppError('Already checked in for today.', 409);
      }
      // Update existing record with check-in
      existing.checkIn = new Date();
      existing.status = AttendanceStatus.PRESENT;
      if (data.location) {
        existing.location = data.location;
      }
      if (data.notes) {
        existing.notes = data.notes;
      }
      await existing.save();
      return existing;
    }

    // Determine if late based on employee's assigned shift (fallback to 9:30 AM)
    const now = new Date();
    let isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    // Check if employee has an assigned shift
    const empProfile = await EmployeeProfile.findOne({ userId: employeeId }).lean();
    if (empProfile?.shift) {
      const shift = await Shift.findById(empProfile.shift).lean();
      if (shift) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const graceDeadline = dayjs().hour(startH).minute(startM).second(0)
          .add(shift.graceMinutes, 'minute');
        isLate = dayjs().isAfter(graceDeadline);
      }
    }

    const record = await Attendance.create({
      employee: employeeId,
      date: today,
      checkIn: now,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      location: data.location,
      notes: data.notes,
      company: companyId,
    });

    return record;
  }

  /**
   * Check out an employee for today.
   */
  static async checkOut(employeeId: string, data: CheckOutData, companyId?: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const today = dayjs().startOf('day').toDate();

    const checkOutFilter: Record<string, unknown> = {
      employee: employeeId,
      date: today,
    };
    if (companyId) checkOutFilter.company = companyId;

    const record = await Attendance.findOne(checkOutFilter);

    if (!record) {
      throw new AppError('No check-in record found for today. Please check in first.', 404);
    }

    if (record.checkOut) {
      throw new AppError('Already checked out for today.', 409);
    }

    record.checkOut = new Date();

    if (data.location && record.location) {
      record.location.longitude = data.location.longitude;
      record.location.latitude = data.location.latitude;
    }

    if (data.notes) {
      record.notes = record.notes ? `${record.notes} | ${data.notes}` : data.notes;
    }

    // workHours will be calculated by the pre-save hook
    await record.save();

    // Check if half day (less than 4 hours)
    if (record.workHours !== undefined && record.workHours < 4) {
      record.status = AttendanceStatus.HALF_DAY;
      await record.save();
    }

    return record;
  }

  /**
   * Admin/HR mark attendance for an employee.
   */
  static async markAttendance(data: MarkAttendanceData, companyId?: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const date = dayjs(data.date).startOf('day').toDate();

    const markFilter: Record<string, unknown> = {
      employee: data.employeeId,
      date,
    };
    if (companyId) markFilter.company = companyId;

    const existing = await Attendance.findOne(markFilter);

    if (existing) {
      existing.status = data.status;
      if (data.checkIn) existing.checkIn = new Date(data.checkIn);
      if (data.checkOut) existing.checkOut = new Date(data.checkOut);
      if (data.notes) existing.notes = data.notes;
      await existing.save();
      return existing;
    }

    const record = await Attendance.create({
      employee: data.employeeId,
      date,
      status: data.status,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      notes: data.notes,
      company: companyId,
    });

    return record;
  }

  /**
   * Get an employee's own attendance for a given month/year.
   */
  static async getMyAttendance(
    employeeId: string,
    month: number,
    year: number,
    companyId?: string,
  ): Promise<IAttendance[]> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const startDate = dayjs().year(year).month(month - 1).startOf('month').toDate();
    const endDate = dayjs().year(year).month(month - 1).endOf('month').toDate();

    const myFilter: Record<string, unknown> = {
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    };
    if (companyId) myFilter.company = companyId;

    const records = await Attendance.find(myFilter)
      .sort({ date: 1 })
      .lean();

    return records as any as IAttendance[];
  }

  /**
   * Get attendance summary for an employee for a given month/year.
   */
  static async getAttendanceSummary(
    employeeId: string,
    month: number,
    year: number,
    companyId?: string,
  ): Promise<AttendanceSummary> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const startDate = dayjs().year(year).month(month - 1).startOf('month').toDate();
    const endDate = dayjs().year(year).month(month - 1).endOf('month').toDate();

    const summaryFilter: Record<string, unknown> = {
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    };
    if (companyId) summaryFilter.company = companyId;

    const records = await Attendance.find(summaryFilter).lean();

    const daysInMonth = dayjs().year(year).month(month - 1).daysInMonth();

    const summary: AttendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      workFromHome: 0,
      holiday: 0,
      weekOff: 0,
      totalWorkingDays: daysInMonth,
    };

    for (const record of records) {
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          summary.present++;
          break;
        case AttendanceStatus.ABSENT:
          summary.absent++;
          break;
        case AttendanceStatus.LATE:
          summary.late++;
          break;
        case AttendanceStatus.HALF_DAY:
          summary.halfDay++;
          break;
        case AttendanceStatus.ON_LEAVE:
          summary.onLeave++;
          break;
        case AttendanceStatus.WORK_FROM_HOME:
          summary.workFromHome++;
          break;
        case AttendanceStatus.HOLIDAY:
          summary.holiday++;
          break;
        case AttendanceStatus.WEEK_OFF:
          summary.weekOff++;
          break;
      }
    }

    return summary;
  }

  /**
   * Bulk mark attendance for multiple employees.
   */
  static async bulkMarkAttendance(data: BulkMarkData, companyId?: string): Promise<IAttendance[]> {
    const date = dayjs(data.date).startOf('day').toDate();
    const results: IAttendance[] = [];

    for (const entry of data.entries) {
      if (!mongoose.Types.ObjectId.isValid(entry.employeeId)) {
        continue; // Skip invalid IDs
      }

      const filter: Record<string, unknown> = { employee: entry.employeeId, date };
      if (companyId) filter.company = companyId;

      const record = await Attendance.findOneAndUpdate(
        filter,
        {
          $set: {
            status: entry.status,
            checkIn: entry.checkIn ? new Date(entry.checkIn) : undefined,
            checkOut: entry.checkOut ? new Date(entry.checkOut) : undefined,
            notes: entry.notes,
            company: companyId,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      results.push(record);
    }

    return results;
  }

  /**
   * Get daily attendance report for all employees on a given date.
   */
  static async getDailyReport(date: string, companyId?: string): Promise<IAttendance[]> {
    const targetDate = dayjs(date).startOf('day').toDate();

    const dailyFilter: Record<string, unknown> = { date: targetDate };
    if (companyId) dailyFilter.company = companyId;

    const records = await Attendance.find(dailyFilter)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ 'employee.firstName': 1 })
      .lean();

    return records as any as IAttendance[];
  }
}
