import { z } from 'zod';

// ─── Leave Type Schemas ──────────────────────────────────────────────────────

export const createLeaveTypeSchema = z.object({
  name: z
    .string({ required_error: 'Leave type name is required' })
    .trim()
    .min(1, 'Leave type name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Leave type code is required' })
    .trim()
    .min(1, 'Leave type code is required')
    .max(20, 'Code cannot exceed 20 characters')
    .toUpperCase(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  defaultDays: z
    .number({ required_error: 'Default days is required' })
    .min(0, 'Default days cannot be negative'),
  carryForward: z.boolean().optional().default(false),
  maxCarryForward: z.number().min(0, 'Max carry forward cannot be negative').optional().default(0),
  isPaid: z.boolean().optional().default(true),
  applicableFor: z.enum(['All', 'Male', 'Female']).optional().default('All'),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().min(1).max(20).toUpperCase().optional(),
  description: z.string().trim().max(500).optional(),
  defaultDays: z.number().min(0).optional(),
  carryForward: z.boolean().optional(),
  maxCarryForward: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
  applicableFor: z.enum(['All', 'Male', 'Female']).optional(),
  isActive: z.boolean().optional(),
});

// ─── Leave Request Schemas ───────────────────────────────────────────────────

export const applyLeaveSchema = z.object({
  leaveType: z.string({ required_error: 'Leave type is required' }),
  startDate: z.string({ required_error: 'Start date is required' }),
  endDate: z.string({ required_error: 'End date is required' }),
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(1, 'Reason is required')
    .max(1000, 'Reason cannot exceed 1000 characters'),
  isHalfDay: z.boolean().optional().default(false),
  halfDayType: z.enum(['FirstHalf', 'SecondHalf']).optional(),
});

export const approveRejectSchema = z.object({
  remarks: z.string().trim().max(500, 'Remarks cannot exceed 500 characters').optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type ApproveRejectInput = z.infer<typeof approveRejectSchema>;
