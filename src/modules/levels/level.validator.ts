import { z } from 'zod';

export const createLevelSchema = z.object({
  name: z.string({ required_error: 'Level Name is required' }).trim().min(1).max(100),
  shortName: z.string({ required_error: 'Level Short Name is required' }).trim().min(1).max(30),
});
export const updateLevelSchema = createLevelSchema.partial().extend({ isActive: z.boolean().optional() });
