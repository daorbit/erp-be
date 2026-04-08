import { z } from 'zod';
import {
  ReviewType,
  OverallRating,
  GoalCategory,
  GoalPriority,
  GoalStatus,
} from './performance.model.js';

// ─── Performance Review Schemas ─────────────────────────────────────────────

export const createReviewSchema = z.object({
  employee: z.string({ required_error: 'Employee ID is required' }).min(1),
  reviewPeriod: z.object({
    startDate: z.string({ required_error: 'Start date is required' }).datetime(),
    endDate: z.string({ required_error: 'End date is required' }).datetime(),
  }),
  type: z.nativeEnum(ReviewType, { required_error: 'Review type is required' }),
  overallRating: z.nativeEnum(OverallRating).optional(),
  goals: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(1000).optional(),
        weightage: z.number().min(0).max(100),
        selfRating: z.number().min(1).max(5).optional(),
        managerRating: z.number().min(1).max(5).optional(),
        comments: z.string().trim().max(1000).optional(),
      }),
    )
    .optional()
    .default([]),
  strengths: z.array(z.string().trim().max(200)).optional().default([]),
  areasOfImprovement: z.array(z.string().trim().max(200)).optional().default([]),
  employeeComments: z.string().trim().max(2000).optional(),
  managerComments: z.string().trim().max(2000).optional(),
  hrComments: z.string().trim().max(2000).optional(),
});

export const updateReviewSchema = createReviewSchema.partial();

// ─── Goal Schemas ───────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  employee: z.string({ required_error: 'Employee ID is required' }).min(1),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(2000).optional(),
  category: z.nativeEnum(GoalCategory, {
    required_error: 'Category is required',
  }),
  priority: z.nativeEnum(GoalPriority).optional().default(GoalPriority.MEDIUM),
  status: z.nativeEnum(GoalStatus).optional(),
  startDate: z.string({ required_error: 'Start date is required' }).datetime(),
  dueDate: z.string({ required_error: 'Due date is required' }).datetime(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const updateGoalProgressSchema = z.object({
  progress: z
    .number({ required_error: 'Progress is required' })
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100'),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
