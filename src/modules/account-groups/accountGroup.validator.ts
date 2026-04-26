import { z } from 'zod';
import { GROUP_NATURE_OPTIONS } from './accountGroup.model.js';

export const createAccountGroupSchema = z.object({
  name: z
    .string({ required_error: 'Account Group Name is required' })
    .trim()
    .min(1, 'Account Group Name is required')
    .max(150, 'Account Group Name cannot exceed 150 characters'),
  isMainGroup: z.boolean().default(true),
  scheduleGroup: z.string().trim().optional(),
  orderNo: z.number().int().min(0).default(0),
  groupNature: z.enum(GROUP_NATURE_OPTIONS, {
    required_error: 'Group Nature is required',
  }),
});

export const updateAccountGroupSchema = createAccountGroupSchema.partial();
