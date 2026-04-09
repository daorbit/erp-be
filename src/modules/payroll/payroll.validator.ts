import { z } from 'zod';

// ─── Salary Structure Schemas ────────────────────────────────────────────────

const allowancesSchema = z.object({
  hra: z.number().min(0).optional().default(0),
  da: z.number().min(0).optional().default(0),
  ta: z.number().min(0).optional().default(0),
  medical: z.number().min(0).optional().default(0),
  special: z.number().min(0).optional().default(0),
  other: z.number().min(0).optional().default(0),
}).optional();

const deductionsSchema = z.object({
  pf: z.number().min(0).optional().default(0),
  esi: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  professionalTax: z.number().min(0).optional().default(0),
  other: z.number().min(0).optional().default(0),
}).optional();

export const createSalaryStructureSchema = z.object({
  employee: z.string({ required_error: 'Employee ID is required' }),
  basicSalary: z
    .number({ required_error: 'Basic salary is required' })
    .min(0, 'Basic salary cannot be negative'),
  allowances: allowancesSchema,
  deductions: deductionsSchema,
  effectiveFrom: z.string({ required_error: 'Effective from date is required' }),
  effectiveTo: z.string().optional(),
});

export const updateSalaryStructureSchema = z.object({
  basicSalary: z.number().min(0, 'Basic salary cannot be negative').optional(),
  allowances: allowancesSchema,
  deductions: deductionsSchema,
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ─── Payslip Schemas ─────────────────────────────────────────────────────────

export const generatePayslipSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }),
  month: z
    .number({ required_error: 'Month is required' })
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z
    .number({ required_error: 'Year is required' })
    .int()
    .min(2000)
    .max(2100),
});

export const bulkGenerateSchema = z.object({
  month: z
    .number({ required_error: 'Month is required' })
    .int()
    .min(1)
    .max(12),
  year: z
    .number({ required_error: 'Year is required' })
    .int()
    .min(2000)
    .max(2100),
});

export const markPaidSchema = z.object({
  paymentDate: z.string().optional(),
  paymentMethod: z.string().trim().optional(),
  transactionId: z.string().trim().optional(),
});

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureInput = z.infer<typeof updateSalaryStructureSchema>;
export type GeneratePayslipInput = z.infer<typeof generatePayslipSchema>;
export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
