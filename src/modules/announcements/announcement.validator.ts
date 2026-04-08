import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(1, 'Content is required'),
  category: z
    .enum(['general', 'hr', 'event', 'policy', 'urgent'])
    .optional()
    .default('general'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .optional()
    .default('medium'),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  attachments: z.array(z.string().url('Each attachment must be a valid URL')).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).optional(),
  category: z.enum(['general', 'hr', 'event', 'policy', 'urgent']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
