import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

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
});

export const updateShiftSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  graceMinutes: z.number().int().min(0).max(120).optional(),
  timezone: z.string().trim().optional(),
  workingDays: z.array(z.number().int().min(0).max(6)).optional(),
});
