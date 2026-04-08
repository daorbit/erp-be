import { z } from 'zod';
import { ExpenseCategory } from './expense.model.js';

export const createExpenseSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  category: z.nativeEnum(ExpenseCategory, {
    required_error: 'Category is required',
  }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .min(0, 'Amount cannot be negative'),
  currency: z.string().trim().max(5).optional().default('INR'),
  date: z.string({ required_error: 'Date is required' }).datetime(),
  description: z.string().trim().max(2000).optional(),
  receipts: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        fileUrl: z.string().trim().min(1),
      }),
    )
    .optional()
    .default([]),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const approveRejectSchema = z.object({
  remarks: z.string().trim().max(1000).optional(),
});

export const reimburseSchema = z.object({
  reimbursementRef: z.string().trim().max(100).optional(),
});

export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
