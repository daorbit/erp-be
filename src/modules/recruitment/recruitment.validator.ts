import { z } from 'zod';
import {
  JobPostingStatus,
  JobEmploymentType,
  ApplicationStatus,
} from './recruitment.model.js';

// ─── Job Posting Schemas ────────────────────────────────────────────────────

export const createJobPostingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description cannot exceed 5000 characters'),
  department: z.string({ required_error: 'Department is required' }).min(1),
  designation: z.string().optional(),
  location: z
    .string({ required_error: 'Location is required' })
    .trim()
    .min(1, 'Location is required')
    .max(200),
  employmentType: z
    .nativeEnum(JobEmploymentType)
    .optional()
    .default(JobEmploymentType.FULL_TIME),
  experience: z.object({
    min: z.number().min(0).default(0),
    max: z.number().min(0).default(0),
  }),
  salary: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
      currency: z.string().max(5).default('INR'),
    })
    .optional(),
  skills: z.array(z.string().trim().max(100)).optional().default([]),
  qualifications: z.array(z.string().trim().max(200)).optional().default([]),
  vacancies: z
    .number({ required_error: 'Number of vacancies is required' })
    .int()
    .min(1, 'Must have at least 1 vacancy'),
  status: z.nativeEnum(JobPostingStatus).optional(),
  applicationDeadline: z.string().datetime().optional(),
});

export const updateJobPostingSchema = createJobPostingSchema.partial();

export const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobPostingStatus, {
    required_error: 'Status is required',
  }),
});

// ─── Application Schemas ────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  jobPosting: z.string({ required_error: 'Job posting ID is required' }).min(1),
  candidateName: z
    .string({ required_error: 'Candidate name is required' })
    .trim()
    .min(1, 'Candidate name is required')
    .max(100),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email')
    .toLowerCase(),
  phone: z
    .string({ required_error: 'Phone is required' })
    .trim()
    .min(1, 'Phone is required')
    .max(20),
  resume: z.string().trim().optional(),
  coverLetter: z.string().trim().max(3000).optional(),
  experience: z.number().min(0).optional(),
  currentSalary: z.number().min(0).optional(),
  expectedSalary: z.number().min(0).optional(),
  skills: z.array(z.string().trim().max(100)).optional().default([]),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus, {
    required_error: 'Status is required',
  }),
  remarks: z.string().trim().max(2000).optional(),
});

export const scheduleInterviewSchema = z.object({
  interviewDate: z
    .string({ required_error: 'Interview date is required' })
    .datetime('Must be a valid datetime'),
  interviewers: z
    .array(z.string().min(1))
    .min(1, 'At least one interviewer is required'),
  interviewNotes: z.string().trim().max(2000).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
