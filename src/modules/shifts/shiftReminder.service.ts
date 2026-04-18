import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import User from '../auth/auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Attendance from '../attendance/attendance.model.js';
import Shift, { type IShift } from './shift.model.js';
import ShiftReminder, { ReminderStatus } from './shiftReminder.model.js';
import { sendShiftReminder } from '../../services/whatsapp.service.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Core shift reminder logic:
 *
 * 1. At shift start time → check who hasn't checked in → send WhatsApp reminder
 * 2. After graceMinutes (default 15) → re-check → send follow-up reminder
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

      // Phase 2: At shift start + grace → send follow-up reminder
      if (currentTimeStr === inquiryTime) {
        await this.sendFollowUpReminders(shift, now);
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
   * Send follow-up reminder.
   */
  private static async sendFollowUpReminders(shift: IShift, now: dayjs.Dayjs): Promise<void> {
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

      // Send follow-up reminder
      const employeeName = `${user.firstName} ${user.lastName}`;
      await sendShiftReminder(user.phone, employeeName, shift.name, shift.startTime);

      reminder.status = ReminderStatus.INQUIRY_SENT;
      reminder.inquirySentAt = new Date();
      await reminder.save();

      console.log(`[ShiftReminder] Sent follow-up reminder to ${employeeName} for shift "${shift.name}"`);
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
      reminder.status = ReminderStatus.LEAVE_APPLIED;
      await reminder.save();
      return 'Noted. Please contact HR to apply for leave.';
    } else if (response === 'NO' || response === 'N') {
      reminder.status = ReminderStatus.DECLINED_LEAVE;
      await reminder.save();
      return 'Noted. Please check in to the attendance system as soon as possible.';
    } else {
      return 'Please reply *YES* if you want to take leave or *NO* if you are coming in.';
    }
  }

}
