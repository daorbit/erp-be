import { z } from 'zod';
import {
  TrainingCategory,
  TrainerType,
  TrainingMode,
  TrainingStatus,
} from './training.model.js';

export const createTrainingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(3000).optional(),
  category: z.nativeEnum(TrainingCategory, {
    required_error: 'Category is required',
  }),
  trainer: z.string().trim().max(100).optional(),
  trainerType: z.nativeEnum(TrainerType).optional().default(TrainerType.INTERNAL),
  startDate: z.string({ required_error: 'Start date is required' }).datetime(),
  endDate: z.string({ required_error: 'End date is required' }).datetime(),
  duration: z.string().trim().max(50).optional(),
  location: z.string().trim().max(200).optional(),
  mode: z.nativeEnum(TrainingMode).optional().default(TrainingMode.OFFLINE),
  maxParticipants: z.number().int().min(1).optional(),
  materials: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        fileUrl: z.string().trim().min(1),
      }),
    )
    .optional()
    .default([]),
  cost: z.number().min(0).optional(),
  status: z.nativeEnum(TrainingStatus).optional(),
});

export const updateTrainingSchema = createTrainingSchema.partial();

export const enrollEmployeeSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }).min(1),
});

export const completeTrainingSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }).min(1),
  score: z.number().min(0).max(100).optional(),
  certificate: z.string().trim().optional(),
});

export const dropEmployeeSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }).min(1),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
export type CompleteTrainingInput = z.infer<typeof completeTrainingSchema>;
