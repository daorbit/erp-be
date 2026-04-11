import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import User from '../auth/auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Attendance from '../attendance/attendance.model.js';
import Shift, { type IShift } from './shift.model.js';
import ShiftReminder, { ReminderStatus } from './shiftReminder.model.js';
import { LeaveRequest, LeaveType, LeaveBalance, LeaveRequestStatus } from '../leaves/leave.model.js';
import { sendShiftReminder, sendLeaveInquiry } from '../../services/whatsapp.service.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Core shift reminder logic:
 *
 * 1. At shift start time → check who hasn't checked in → send WhatsApp reminder
 * 2. After graceMinutes (default 15) → re-check → send leave inquiry (YES/NO)
 * 3. On WhatsApp reply "YES" → auto-apply leave
 */
export class ShiftReminderService {
  /**
   * Called every minute by the cron scheduler.
   * Checks all active shifts and sends appropriate reminders.
   */
  static async processShiftReminders(): Promise<void> {
    const shifts = await Shift.find({ isActive: true }).lean() as any as IShift[];

    for (const shift of shifts) {
      const now = dayjs().tz(shift.timezone);
      const currentDay = now.day(); // 0=Sun, 6=Sat

      // Skip if today is not a working day for this shift
      if (!shift.workingDays.includes(currentDay)) continue;

      const currentTimeStr = now.format('HH:mm');
      const shiftStart = shift.startTime; // e.g. "09:00"

      // Calculate inquiry time (shift start + grace minutes)
      const [startH, startM] = shiftStart.split(':').map(Number);
      const inquiryTime = dayjs().tz(shift.timezone)
        .hour(startH).minute(startM).second(0)
        .add(shift.graceMinutes, 'minute')
        .format('HH:mm');

      // Phase 1: At shift start → send initial reminder
      if (currentTimeStr === shiftStart) {
        await this.sendInitialReminders(shift, now);
      }

      // Phase 2: At shift start + grace → send leave inquiry
      if (currentTimeStr === inquiryTime) {
        await this.sendLeaveInquiries(shift, now);
      }
    }
  }

  /**
   * Phase 1: Find employees who haven't checked in at shift start, send reminder.
   */
  private static async sendInitialReminders(shift: IShift, now: dayjs.Dayjs): Promise<void> {
    const today = now.startOf('day').toDate();
    const companyId = shift.company.toString();

    // Find employees assigned to this shift in this company
    const employees = await EmployeeProfile.find({
      company: companyId,
      shift: shift._id,
      isActive: true,
    }).populate('userId', 'firstName lastName phone email').lean();

    for (const emp of employees) {
      const user = emp.userId as any;
      if (!user || !user.phone) continue;

      // Check if already checked in today
      const attendance = await Attendance.findOne({
        employee: user._id,
        date: today,
        checkIn: { $exists: true, $ne: null },
      });

      if (attendance) continue; // Already checked in

      // Check if already has approved leave for today
      const existingLeave = await LeaveRequest.findOne({
        employee: user._id,
        status: LeaveRequestStatus.APPROVED,
        startDate: { $lte: today },
        endDate: { $gte: today },
      });

      if (existingLeave) continue; // On approved leave

      // Check if reminder already sent today for this shift
      const existingReminder = await ShiftReminder.findOne({
        employee: user._id,
        shift: shift._id,
        date: today,
      });

      if (existingReminder) continue; // Already processed

      // Send WhatsApp reminder
      const employeeName = `${user.firstName} ${user.lastName}`;
      await sendShiftReminder(user.phone, employeeName, shift.name, shift.startTime);

      // Record the reminder
      await ShiftReminder.create({
        employee: user._id,
        company: companyId,
        shift: shift._id,
        date: today,
        status: ReminderStatus.REMINDER_SENT,
        reminderSentAt: new Date(),
      });

      console.log(`[ShiftReminder] Sent initial reminder to ${employeeName} for shift "${shift.name}"`);
    }
  }

  /**
   * Phase 2: Re-check employees who still haven't checked in after grace period.
   * Send leave inquiry (YES/NO).
   */
  private static async sendLeaveInquiries(shift: IShift, now: dayjs.Dayjs): Promise<void> {
    const today = now.startOf('day').toDate();

    // Find reminders sent today for this shift that haven't progressed
    const pendingReminders = await ShiftReminder.find({
      shift: shift._id,
      date: today,
      status: ReminderStatus.REMINDER_SENT,
    }).populate('employee', 'firstName lastName phone');

    for (const reminder of pendingReminders) {
      const user = reminder.employee as any;
      if (!user || !user.phone) continue;

      // Re-check attendance (maybe they checked in between reminder and now)
      const attendance = await Attendance.findOne({
        employee: user._id,
        date: today,
        checkIn: { $exists: true, $ne: null },
      });

      if (attendance) {
        reminder.status = ReminderStatus.CHECKED_IN;
        await reminder.save();
        continue;
      }

      // Send leave inquiry
      const employeeName = `${user.firstName} ${user.lastName}`;
      await sendLeaveInquiry(user.phone, employeeName, shift.name);

      reminder.status = ReminderStatus.INQUIRY_SENT;
      reminder.inquirySentAt = new Date();
      await reminder.save();

      console.log(`[ShiftReminder] Sent leave inquiry to ${employeeName} for shift "${shift.name}"`);
    }
  }

  /**
   * Handle WhatsApp reply from employee.
   * Called by the webhook controller.
   */
  static async handleWhatsAppReply(phone: string, responseText: string): Promise<string> {
    const normalizedPhone = phone.replace('whatsapp:', '');
    const response = responseText.trim().toUpperCase();
    const today = dayjs().startOf('day').toDate();

    // Find the user by phone
    const user = await User.findOne({ phone: normalizedPhone, isActive: true });
    if (!user) {
      return 'Sorry, we could not identify your account. Please contact HR.';
    }

    // Find today's pending inquiry for this user
    const reminder = await ShiftReminder.findOne({
      employee: user._id,
      date: today,
      status: ReminderStatus.INQUIRY_SENT,
    }).populate('shift');

    if (!reminder) {
      return 'No pending shift inquiry found for today.';
    }

    reminder.responseReceivedAt = new Date();
    reminder.responseText = responseText.trim();

    if (response === 'YES' || response === 'Y') {
      // Auto-apply leave
      const leaveRequest = await this.autoApplyLeave(user._id.toString(), user.company?.toString());

      if (leaveRequest) {
        reminder.status = ReminderStatus.LEAVE_APPLIED;
        reminder.leaveRequest = leaveRequest._id as any;
        await reminder.save();
        return `Leave applied for today. Your leave request is pending approval. Request ID: ${leaveRequest._id}`;
      } else {
        await reminder.save();
        return 'Unable to auto-apply leave. You may not have sufficient leave balance or no leave type is configured. Please contact HR.';
      }
    } else if (response === 'NO' || response === 'N') {
      reminder.status = ReminderStatus.DECLINED_LEAVE;
      await reminder.save();
      return 'Noted. Please check in to the attendance system as soon as possible.';
    } else {
      return 'Please reply *YES* to apply for leave or *NO* if you are coming in.';
    }
  }

  /**
   * Auto-apply casual/sick leave for the employee.
   * Picks the first available leave type with remaining balance.
   */
  private static async autoApplyLeave(
    employeeId: string,
    companyId?: string,
  ): Promise<any> {
    const today = dayjs().startOf('day');
    const year = today.year();

    // Check for overlapping leave
    const existingLeave = await LeaveRequest.findOne({
      employee: employeeId,
      status: { $in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
      startDate: { $lte: today.toDate() },
      endDate: { $gte: today.toDate() },
    });

    if (existingLeave) return null;

    // Find leave types with available balance (prefer "CL" or "SL" codes)
    const leaveFilter: Record<string, unknown> = { isActive: true };
    if (companyId) leaveFilter.company = companyId;

    const leaveTypes = await LeaveType.find(leaveFilter)
      .sort({ code: 1 }) // CL comes before SL alphabetically
      .lean();

    for (const lt of leaveTypes) {
      const balance = await LeaveBalance.findOne({
        employee: employeeId,
        leaveType: lt._id,
        year,
      });

      if (balance && balance.remaining >= 1) {
        const leaveRequest = await LeaveRequest.create({
          employee: employeeId,
          company: companyId,
          leaveType: lt._id,
          startDate: today.toDate(),
          endDate: today.toDate(),
          totalDays: 1,
          reason: 'Auto-applied via shift reminder (WhatsApp)',
          isHalfDay: false,
        });

        return leaveRequest;
      }
    }

    return null; // No leave balance available
  }
}
