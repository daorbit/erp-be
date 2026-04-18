import { z } from 'zod';

export const createGradeSchema = z.object({
  name: z.string({ required_error: 'Grade Name is required' }).trim().min(1).max(100),
  level: z.string({ required_error: 'Level is required' }).min(1),
});
export const updateGradeSchema = createGradeSchema.partial().extend({ isActive: z.boolean().optional() });
