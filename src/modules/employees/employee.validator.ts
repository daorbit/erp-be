import { z } from 'zod';

// ─── Shared sub-schemas ──────────────────────────────────────────────────────

const addressSchema = z.object({
  street: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  zipCode: z.string().trim().max(20).optional(),
}).optional();

const emergencyContactSchema = z.object({
  name: z.string().trim().max(100).optional(),
  relationship: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email('Invalid email').optional(),
}).optional();

const bankDetailsSchema = z.object({
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(30).optional(),
  ifscCode: z.string().trim().max(20).optional(),
  branchName: z.string().trim().max(100).optional(),
  accountType: z.enum(['savings', 'current', 'salary']).optional(),
}).optional();

const identityDocsSchema = z.object({
  aadhaarNumber: z.string().trim().max(12).optional(),
  panNumber: z.string().trim().max(10).optional(),
  passportNumber: z.string().trim().max(20).optional(),
  drivingLicense: z.string().trim().max(30).optional(),
}).optional();

// ─── Create Employee Schema ──────────────────────────────────────────────────

// `.passthrough()` keeps the NwayERP form's 80+ extended fields (fileNo,
// branch, level, grade, employeeGroup, fatherName, etc.) intact instead of
// silently dropping them. The service then routes known fields onto either
// User or EmployeeProfile.
export const createEmployeeSchema = z.object({
  // User fields
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().optional(),
  temporaryPassword: z.string().trim().min(8, 'Temporary password must be at least 8 characters').optional(),
  role: z.enum(['super_admin', 'admin', 'hr_manager', 'manager', 'employee']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),

  // Profile fields
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  nationality: z.string().trim().max(50).optional(),
  religion: z.string().trim().max(50).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'freelancer']).optional(),
  joinDate: z.string().optional(),
  workShift: z.string().trim().max(50).optional(),
  workLocation: z.string().trim().max(100).optional(),
  reportingManager: z.string().optional(),
  allowedBranches: z.array(z.string()).optional(),
  currentAddress: addressSchema,
  permanentAddress: addressSchema,
  emergencyContact: emergencyContactSchema,
  bankDetails: bankDetailsSchema,
  identityDocs: identityDocsSchema,
}).passthrough();

// ─── Update Employee Schema ─────────────────────────────────────────────────

export const updateEmployeeSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  nationality: z.string().trim().max(50).optional(),
  religion: z.string().trim().max(50).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern', 'freelancer']).optional(),
  joinDate: z.string().optional(),
  confirmationDate: z.string().optional(),
  probationEndDate: z.string().optional(),
  resignationDate: z.string().optional(),
  lastWorkingDate: z.string().optional(),
  workShift: z.string().trim().max(50).optional(),
  workLocation: z.string().trim().max(100).optional(),
  reportingManager: z.string().optional(),
  allowedBranches: z.array(z.string()).optional(),
  currentAddress: addressSchema,
  permanentAddress: addressSchema,
  emergencyContact: emergencyContactSchema,
  bankDetails: bankDetailsSchema,
  identityDocs: identityDocsSchema,
  isActive: z.boolean().optional(),
}).passthrough();

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
