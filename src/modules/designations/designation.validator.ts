import { z } from 'zod';

export const createDesignationSchema = z.object({
  name: z
    .string({ required_error: 'Designation name is required' })
    .trim()
    .min(1, 'Designation name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  shortName: z
    .string({ required_error: 'Short name is required' })
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters')
    .toUpperCase(),
  rolesAndResponsibility: z.string().trim().max(1000, 'Roles and responsibility cannot exceed 1000 characters').optional(),
  departments: z.array(z.string()).min(1, 'At least one department is required'),
  displayOrder: z.number().int().optional(),
  employeeBand: z.string().trim().max(50, 'Employee band cannot exceed 50 characters').optional(),
});

export const updateDesignationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Designation name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  shortName: z
    .string()
    .trim()
    .min(1, 'Short name is required')
    .max(20, 'Short name cannot exceed 20 characters')
    .toUpperCase()
    .optional(),
  rolesAndResponsibility: z.string().trim().max(1000, 'Roles and responsibility cannot exceed 1000 characters').optional(),
  departments: z.array(z.string()).nullable().optional(),
  displayOrder: z.number().int().optional(),
  employeeBand: z.string().trim().max(50, 'Employee band cannot exceed 50 characters').optional(),
  isActive: z.boolean().optional(),
});

export const mergeDesignationsSchema = z.object({
  fromDesignation: z.string({ required_error: 'From Designation is required' }).min(1, 'From Designation is required'),
  toDesignation: z.string({ required_error: 'To Designation is required' }).min(1, 'To Designation is required'),
}).refine((d) => d.fromDesignation !== d.toDesignation, {
  message: 'From and To designations must be different',
  path: ['toDesignation'],
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type MergeDesignationsInput = z.infer<typeof mergeDesignationsSchema>;
