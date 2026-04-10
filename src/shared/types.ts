import type { Request } from 'express';

// ─── API Response ────────────────────────────────────────────────────────────

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: IPagination;
}

// ─── Query Parameters ────────────────────────────────────────────────────────

export interface IQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// ─── Auth Request ────────────────────────────────────────────────────────────

export interface IAuthUser {
  id: string;
  email: string;
  role: UserRole;
  company?: string;
}

export interface IAuthRequest extends Request {
  user: IAuthUser;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  HR_MANAGER = 'hr_manager',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LATE = 'late',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEK_OFF = 'week_off',
  WORK_FROM_HOME = 'work_from_home',
}

export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum RecruitmentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REIMBURSED = 'reimbursed',
}

export enum PerformanceRating {
  OUTSTANDING = 'outstanding',
  EXCEEDS_EXPECTATIONS = 'exceeds_expectations',
  MEETS_EXPECTATIONS = 'meets_expectations',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  UNSATISFACTORY = 'unsatisfactory',
}
