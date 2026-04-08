import { z } from 'zod';
import { DocumentCategory } from './document.model.js';

export const uploadDocumentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory, {
    required_error: 'Category is required',
  }),
  fileUrl: z
    .string({ required_error: 'File URL is required' })
    .trim()
    .min(1, 'File URL is required'),
  fileName: z.string().trim().max(200).optional(),
  fileType: z.string().trim().max(50).optional(),
  fileSize: z.number().min(0, 'File size cannot be negative').optional(),
  employee: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().max(50)).optional().default([]),
  expiryDate: z.string().datetime().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  employee: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  expiryDate: z.string().datetime().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
