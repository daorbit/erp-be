import { z } from 'zod';
import { ResignMode, ResignStatus } from '../../shared/types.js';

export const createResignationSchema = z.object({
  employee: z.string({ required_error: 'Employee is required' }).min(1),
  resignationDate: z.string({ required_error: 'Resignation Date is required' }).min(1),
  noticePeriodFrom: z.string().optional(),
  noticePeriodTo: z.string().optional(),
  noticeDay: z.number().int().min(0).optional(),
  resignMode: z.nativeEnum(ResignMode, { required_error: 'Resign Mode is required' }),
  remark: z.string().trim().max(500).optional(),
  attachmentUrl: z.string().trim().optional(),
});

export const updateResignationSchema = createResignationSchema.partial().extend({
  status: z.nativeEnum(ResignStatus).optional(),
});
