import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string({ required_error: 'Tag Name is required' }).trim().min(1).max(100),
  shortName: z.string().trim().max(30).optional(),
});
export const updateTagSchema = createTagSchema.partial().extend({ isActive: z.boolean().optional() });
