import { z } from 'zod';

export const createLeaveFinyearSchema = z.object({
  dateFrom: z.string({ required_error: 'Date From is required' }).min(1),
  dateTo: z.string({ required_error: 'Date To is required' }).min(1),
  label: z.string().trim().max(30).optional(),
});
export const updateLeaveFinyearSchema = createLeaveFinyearSchema.partial().extend({ isActive: z.boolean().optional() });
