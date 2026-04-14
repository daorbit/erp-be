import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(1, 'Department name is required')
    .max(100, 'Department name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Department code is required' })
    .trim()
    .min(1, 'Department code is required')
    .max(20, 'Department code cannot exceed 20 characters')
    .toUpperCase(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  headOfDepartment: z.string().optional(),
  parentDepartments: z.array(z.string()).min(1, 'At least one parent department is required'),
});

export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Department name is required')
    .max(100, 'Department name cannot exceed 100 characters')
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, 'Department code is required')
    .max(20, 'Department code cannot exceed 20 characters')
    .toUpperCase()
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  headOfDepartment: z.string().nullable().optional(),
  parentDepartments: z.array(z.string()).min(1, 'At least one parent department is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
