import { z } from 'zod';

export const createParentDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Super Department name is required' })
    .trim()
    .min(1, 'Super Department name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  shortName: z
    .string({ required_error: 'Short name is required' })
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters'),
  displayOrder: z.number().int().optional(),
});

export const updateParentDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Super Department name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  shortName: z
    .string()
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters')
    .optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
