import { z } from 'zod';

export const createOtherIncomeSchema = z.object({
  name: z.string({ required_error: 'Other Income is required' }).trim().min(1).max(150),
  incomeType: z.string({ required_error: 'Income Type is required' }).trim().min(1).max(100),
});
export const updateOtherIncomeSchema = createOtherIncomeSchema.partial().extend({ isActive: z.boolean().optional() });
