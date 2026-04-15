import { z } from 'zod';
import { SimType, SimStatus } from './sim.model.js';

export const createSimSchema = z.object({
  simMobileNo: z.string({ required_error: 'Sim/Mobile No is required' }).trim().min(1).max(20),
  simSerialNo: z.string().trim().max(50).optional(),
  purchaseOrderBillNo: z.string().trim().max(50).optional(),
  purchaseDate: z.string().datetime().optional().or(z.string().optional()),
  stateCircle: z.string().trim().max(100).optional(),
  localStd: z.string().trim().max(20).optional(),
  subscriberName: z.string().trim().max(150).optional(),
  planTariff: z.string().trim().max(150).optional(),
  simType: z.nativeEnum(SimType).optional(),
  status: z.nativeEnum(SimStatus).optional(),
});
export const updateSimSchema = createSimSchema.partial().extend({ isActive: z.boolean().optional() });
