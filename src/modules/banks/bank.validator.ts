import { z } from 'zod';

export const createBankSchema = z.object({
  name: z.string({ required_error: 'Bank Name is required' }).trim().min(1).max(150),
  currentAccountNo: z.string({ required_error: 'Current A/C is required' }).trim().min(1).max(50),
  address: z.string().trim().max(300).optional(),
  ifscCode: z.string().trim().max(20).optional(),
});
export const updateBankSchema = createBankSchema.partial().extend({ isActive: z.boolean().optional() });
