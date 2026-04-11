import * as cron from 'node-cron';
import { ShiftReminderService } from './shiftReminder.service.js';

let task: ReturnType<typeof cron.schedule> | null = null;

/**
 * Start the shift reminder cron job.
 * Runs every minute to check if any shift is starting now.
 */
export function startShiftScheduler(): void {
  if (task) {
    console.warn('[ShiftScheduler] Already running.');
    return;
  }

  // Run every minute
  task = cron.schedule('* * * * *', async () => {
    try {
      await ShiftReminderService.processShiftReminders();
    } catch (error) {
      console.error('[ShiftScheduler] Error processing shift reminders:', error);
    }
  });

  console.log('[ShiftScheduler] Started — checking shifts every minute.');
}

/**
 * Stop the shift reminder cron job.
 */
export function stopShiftScheduler(): void {
  if (task) {
    task.stop();
    task = null;
    console.log('[ShiftScheduler] Stopped.');
  }
}
