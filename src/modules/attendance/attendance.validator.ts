import { z } from 'zod';

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

const attendanceStatusEnum = z.enum([
  'present',
  'absent',
  'half_day',
  'late',
  'on_leave',
  'holiday',
  'week_off',
  'work_from_home',
]);

export const checkInSchema = z.object({
  location: locationSchema,
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const checkOutSchema = z.object({
  location: locationSchema,
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const markAttendanceSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }),
  date: z.string({ required_error: 'Date is required' }),
  status: attendanceStatusEnum,
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const bulkMarkAttendanceSchema = z.object({
  date: z.string({ required_error: 'Date is required' }),
  entries: z
    .array(
      z.object({
        employeeId: z.string({ required_error: 'Employee ID is required' }),
        status: attendanceStatusEnum,
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        notes: z.string().trim().max(500).optional(),
      }),
    )
    .min(1, 'At least one entry is required'),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;
