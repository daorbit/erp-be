import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(1, 'Department name is required')
    .max(100, 'Department name cannot exceed 100 characters'),
  shortName: z
    .string({ required_error: 'Short name is required' })
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters')
    .toUpperCase(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  // headOfDepartment: z.string().optional(),
  displayOrder: z.number().int().optional(),
  parentDepartment: z.string({ required_error: 'Parent department is required' }).min(1, 'Parent department is required'),
  branches: z.array(z.string()).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Department name is required')
    .max(100, 'Department name cannot exceed 100 characters')
    .optional(),
  shortName: z
    .string()
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters')
    .toUpperCase()
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  // headOfDepartment: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  parentDepartment: z.string().min(1).optional(),
  branches: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
