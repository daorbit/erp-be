import { z } from 'zod';
import { HeadType } from '../../shared/types.js';

export const createSalaryHeadSchema = z.object({
  name: z
    .string({ required_error: 'Salary Head name is required' })
    .trim()
    .min(1, 'Salary Head name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  printName: z
    .string({ required_error: 'Print name is required' })
    .trim()
    .min(1, 'Print name is required')
    .max(50, 'Print name cannot exceed 50 characters'),
  headType: z.nativeEnum(HeadType, {
    required_error: 'Head Type is required',
    invalid_type_error: 'Head Type must be Addition or Deduction',
  }),
  displayOrder: z.number().int().optional(),
});

export const updateSalaryHeadSchema = createSalaryHeadSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateSalaryHeadInput = z.infer<typeof createSalaryHeadSchema>;
export type UpdateSalaryHeadInput = z.infer<typeof updateSalaryHeadSchema>;
