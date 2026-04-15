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
  onboardingRequired?: boolean;
  onboardingCompleted?: boolean;
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
  VIEWER = 'viewer',
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

// ─── Master module enums ─────────────────────────────────────────────────────

// Used by Designation.employeeBand. Display labels for the UI live in
// frontend i18n / a static map; the DB stores the snake_case code.
export enum EmployeeBand {
  TRAINEE = 'trainee',                 // "Trainee, Jr. Executive"
  EXECUTIVE = 'executive',             // "Executive, Sr. Executive"
  ASST_MANAGER = 'asst_manager',       // "Asst. Manager, Deputy Manager, Manager"
  SR_MANAGER = 'sr_manager',           // "Sr. Manager, General Manager"
  LEADERSHIP = 'leadership',           // "Leadership Team"
}

// Used by SalaryHead to classify a head as earning or deduction.
export enum HeadType {
  ADDITION = 'addition',
  DEDUCTION = 'deduction',
}

// Used by SalaryStructureHead to describe how a head's value is derived.
export enum CalculationType {
  LUMPSUM = 'lumpsum',
  FORMULA = 'formula',
  FIXED_AMOUNT = 'fixed_amount',
  REMAINING_AMOUNT = 'remaining_amount',
}

// Used by SalaryStructureHead to describe how the calculated value scales
// with the employee's pay-period attendance.
export enum PayType {
  PAY_DAY_WISE = 'pay_day_wise',                               // "Pay Day wise"
  MONTH_WISE = 'month_wise',                                   // "Month wise"
  PRESENT_DAY_WISE = 'present_day_wise',                       // "Present Day wise"
  PRESENT_LEAVE_DAY_WISE = 'present_leave_day_wise',           // "(Present + Leave) Day wise"
  PRESENT_LEAVE_HOLIDAY_DAY_WISE = 'present_leave_holiday_day_wise',   // "(Present + Leave + Holiday) Day wise"
  PRESENT_LEAVE_WEEKOFF_DAY_WISE = 'present_leave_weekoff_day_wise',   // "(Present + Leave + Week Off) Day wise"
}

// ─── Employee-form enums (from screenshots) ─────────────────────────────────

export enum EmpStatus {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  CONTRACTUAL = 'contractual',
}

export enum LocalMigrant {
  LOCAL = 'local',
  MIGRANT = 'migrant',
  OTHER = 'other',
}

export enum CategorySkill {
  SKILLED = 'skilled',
  SEMI_SKILLED = 'semi_skilled',
  UNSKILLED = 'unskilled',
  UNSKILLED_SUPERVISORY = 'unskilled_supervisory',
  HIGHLY_SKILLED = 'highly_skilled',
}

export enum SubCompany {
  SUB_CONTRACTOR = 'sub_contractor',
  SELF = 'self',
}

export enum PFScheme {
  EPFO = 'epfo',
  CMPF = 'cmpf',
}

export enum TDSRegime {
  NEW = 'new',
  OLD = 'old',
}

export enum ReligionType {
  NA = 'na',
  HINDU = 'hindu',
  MUSLIM = 'muslim',
  CHRISTIAN = 'christian',
  SIKH = 'sikh',
  BUDDHIST = 'buddhist',
  JAIN = 'jain',
  OTHER = 'other',
  NOT_STATED = 'not_stated',
}

export enum Relation {
  MOTHER = 'mother',
  FATHER = 'father',
  BROTHER = 'brother',
  SISTER = 'sister',
  SPOUSE = 'spouse',
  SON = 'son',
  DAUGHTER = 'daughter',
}

export enum Division {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
}

export enum RoleType {
  FIXED_WORKING = 'fixed_working',
  ON_DEMAND_WORKING = 'on_demand_working',
  REPORTING = 'reporting',
}

// ─── Resignation ────────────────────────────────────────────────────────────

export enum ResignMode {
  RESIGN = 'resign',
  TERMINATE = 'terminate',
  ABSCOND = 'abscond',
  BLACKLISTED = 'blacklisted',
  DEATH = 'death',
  OTHER = 'other',
  RETRENCHED = 'retrenched',
}

export enum ResignStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ─── User ───────────────────────────────────────────────────────────────────

export enum UserCategory {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum UserType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  HO_USER = 'ho_user',
  SITE_ADMIN = 'site_admin',
  USER = 'user',
}

// ─── Leave Type (extension) ────────────────────────────────────────────────

export enum LeaveCarryType {
  CARRY_FORWARDED = 'carry_forwarded',
  NOT_CARRY_FORWARDED = 'not_carry_forwarded',
}

// ─── TDS ────────────────────────────────────────────────────────────────────

export enum DeductionType {
  DEDUCTION_UNDER_CHAPTER_VI_A = 'deduction_under_chapter_vi_a',
  TAX_ON_EMPLOYMENT = 'tax_on_employment',
  STANDARD_DEDUCTION = 'standard_deduction',
  HRA = 'hra',
  OTHER = 'other',
}
