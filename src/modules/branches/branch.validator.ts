import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z
    .string({ required_error: 'Branch name is required' })
    .trim()
    .min(1, 'Branch name is required')
    .max(100, 'Branch name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Branch code is required' })
    .trim()
    .min(1, 'Branch code is required')
    .max(20, 'Branch code cannot exceed 20 characters')
    .toUpperCase(),
});

export const updateBranchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  code: z.string().trim().min(1).max(20).toUpperCase().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
