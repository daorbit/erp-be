import { z } from 'zod';

export const createDesignationSchema = z.object({
  title: z
    .string({ required_error: 'Designation title is required' })
    .trim()
    .min(1, 'Designation title is required')
    .max(100, 'Title cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Designation code is required' })
    .trim()
    .min(1, 'Designation code is required')
    .max(20, 'Code cannot exceed 20 characters')
    .toUpperCase(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  departments: z.array(z.string()).optional(),
  level: z
    .number({ required_error: 'Level is required' })
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(10, 'Level cannot exceed 10'),
  band: z.string().trim().max(10, 'Band cannot exceed 10 characters').optional(),
});

export const updateDesignationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Designation title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, 'Designation code is required')
    .max(20, 'Code cannot exceed 20 characters')
    .toUpperCase()
    .optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  departments: z.array(z.string()).nullable().optional(),
  level: z
    .number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(10, 'Level cannot exceed 10')
    .optional(),
  band: z.string().trim().max(10, 'Band cannot exceed 10 characters').optional(),
  isActive: z.boolean().optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
