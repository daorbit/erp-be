import { z } from 'zod';

export const createQualificationSchema = z.object({
  name: z.string({ required_error: 'Qualification is required' }).trim().min(1).max(100),
});

export const updateQualificationSchema = createQualificationSchema.partial().extend({
  isActive: z.boolean().optional(),
});
