import { z } from 'zod';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from './helpdesk.model.js';

export const createTicketSchema = z.object({
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(1, 'Subject is required')
    .max(200, 'Subject cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  category: z.nativeEnum(TicketCategory, {
    required_error: 'Category is required',
  }),
  priority: z.nativeEnum(TicketPriority).optional().default(TicketPriority.MEDIUM),
});

export const updateTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
});

export const assignTicketSchema = z.object({
  assignedTo: z.string({ required_error: 'Assignee ID is required' }).min(1),
});

export const addCommentSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message is required')
    .max(3000, 'Message cannot exceed 3000 characters'),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        fileUrl: z.string().trim().min(1),
      }),
    )
    .optional()
    .default([]),
});

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus, {
    required_error: 'Status is required',
  }),
  resolution: z.string().trim().max(3000).optional(),
});

export const closeTicketSchema = z.object({
  satisfaction: z.number().int().min(1).max(5).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type CloseTicketInput = z.infer<typeof closeTicketSchema>;
