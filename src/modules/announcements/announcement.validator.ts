import { z } from 'zod';

// Must match enums in announcement.model.ts exactly
const categoryEnum = ['general', 'policy', 'event', 'achievement', 'urgent', 'maintenance'] as const;
const priorityEnum = ['low', 'normal', 'high', 'critical'] as const;

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
  category: z.enum(categoryEnum).optional().default('general'),
  priority: z.enum(priorityEnum).optional().default('normal'),
  isPinned: z.boolean().optional().default(false),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
  departments: z.array(z.string()).optional(),
  attachments: z.array(z.string().url('Each attachment must be a valid URL')).optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).optional(),
  category: z.enum(categoryEnum).optional(),
  priority: z.enum(priorityEnum).optional(),
  isPinned: z.boolean().optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  departments: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
