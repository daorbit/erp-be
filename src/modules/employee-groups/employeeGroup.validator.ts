import { z } from 'zod';

export const createEmployeeGroupSchema = z.object({
  name: z
    .string({ required_error: 'Employee Group name is required' })
    .trim()
    .min(1, 'Employee Group name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  shortName: z
    .string()
    .trim()
    .max(20, 'Short name cannot exceed 20 characters')
    .optional(),
  branches: z.array(z.string()).min(1, 'At least one branch is required'),
});

export const updateEmployeeGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Employee Group name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  shortName: z
    .string()
    .trim()
    .max(20, 'Short name cannot exceed 20 characters')
    .optional(),
  branches: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateEmployeeGroupInput = z.infer<typeof createEmployeeGroupSchema>;
export type UpdateEmployeeGroupInput = z.infer<typeof updateEmployeeGroupSchema>;
