import { z } from 'zod';
import { CalculationType, PayType } from '../../shared/types.js';

// ─── Salary Structure (template) ────────────────────────────────────────────

export const createSalaryStructureSchema = z.object({
  name: z
    .string({ required_error: 'Salary Structure name is required' })
    .trim()
    .min(1, 'Salary Structure name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  isInactive: z.boolean().optional(),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();

// ─── Assign Salary Head ─────────────────────────────────────────────────────

const percent = z.number().min(0).max(100);

export const assignSalaryHeadSchema = z.object({
  structure: z.string({ required_error: 'Salary Structure is required' }).min(1),
  salaryHead: z.string({ required_error: 'Salary Head is required' }).min(1),
  calculationType: z.nativeEnum(CalculationType).default(CalculationType.LUMPSUM),
  payType: z.nativeEnum(PayType).default(PayType.PAY_DAY_WISE),
  showOrder: z.number().int().optional(),
  pfEnabled: z.boolean().optional(),
  pfPercent: percent.optional(),
  npsEnabled: z.boolean().optional(),
  npsPercent: percent.optional(),
  esiEnabled: z.boolean().optional(),
  esiPercent: percent.optional(),
});

export const updateAssignedHeadSchema = assignSalaryHeadSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type AssignSalaryHeadInput = z.infer<typeof assignSalaryHeadSchema>;
