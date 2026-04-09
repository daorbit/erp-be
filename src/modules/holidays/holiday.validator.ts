import { z } from 'zod';

export const createHolidaySchema = z.object({
  name: z
    .string({ required_error: 'Holiday name is required' })
    .trim()
    .min(1, 'Holiday name is required')
    .max(100, 'Holiday name cannot exceed 100 characters'),
  date: z.string({ required_error: 'Date is required' }),
  type: z.enum(['public', 'religious', 'company_specific', 'optional'], {
    required_error: 'Holiday type is required',
  }),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  isOptional: z.boolean().optional().default(false),
  year: z.number().int().min(2000).max(2100).optional(),
});

export const updateHolidaySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  date: z.string().optional(),
  type: z.enum(['public', 'religious', 'company_specific', 'optional']).optional(),
  description: z.string().trim().max(500).optional(),
  isOptional: z.boolean().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  isActive: z.boolean().optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
