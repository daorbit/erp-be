import { z } from 'zod';

export const createStateSchema = z.object({
  name: z.string({ required_error: 'State Name is required' }).trim().min(1).max(100),
  shortName: z.string().trim().max(30).optional(),
  stateCode: z.string({ required_error: 'State Code is required' }).trim().min(1).max(10),
  isUT: z.boolean().optional(),
  country: z.string().trim().max(100).default('INDIA'),
});

export const updateStateSchema = createStateSchema.partial().extend({ isActive: z.boolean().optional() });

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
