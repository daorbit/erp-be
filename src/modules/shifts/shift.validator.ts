import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// NwayERP shift master extension fields. Listed once so create + update share
// the same surface — without these the legacy fields the form sends were
// being silently dropped by zod.
const extendedShiftFields = {
  inTimeAsAttendanceDate: z.boolean().optional(),
  outTimeAsAttendanceDate: z.boolean().optional(),
  considerLowerLimit: z.string().regex(timeRegex, 'Lower limit must be HH:mm').optional(),
  considerUpperLimit: z.string().regex(timeRegex, 'Upper limit must be HH:mm').optional(),
  halfTime: z.string().regex(timeRegex, 'Half time must be HH:mm').optional(),
  lunchTimeMinutes: z.number().min(0).optional(),
  halfDayMinHours: z.number().min(0).optional(),
  fullDayMinHours: z.number().min(0).optional(),
  totalShiftHours: z.number().min(0).optional(),
  isShiftBreak: z.boolean().optional(),
  statusOnSinglePunch: z.string().trim().optional(),
};

export const createShiftSchema = z.object({
  name: z
    .string({ required_error: 'Shift name is required' })
    .trim()
    .min(1, 'Shift name is required')
    .max(100, 'Shift name cannot exceed 100 characters'),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z
    .string({ required_error: 'End time is required' })
    .regex(timeRegex, 'End time must be in HH:mm format'),
  graceMinutes: z.number().int().min(0).max(120).optional().default(15),
  timezone: z.string().trim().optional().default('Asia/Kolkata'),
  workingDays: z.array(z.number().int().min(0).max(6)).optional().default([1, 2, 3, 4, 5]),
  ...extendedShiftFields,
});

export const updateShiftSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  graceMinutes: z.number().int().min(0).max(120).optional(),
  timezone: z.string().trim().optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
  isActive: z.boolean().optional(),
  ...extendedShiftFields,
});
