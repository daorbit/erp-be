import { z } from 'zod';

export const createCitySchema = z.object({
  name: z.string({ required_error: 'City Name is required' }).trim().min(1).max(100),
  state: z.string({ required_error: 'State Name is required' }).trim().min(1).max(100),
  shortName: z.string().trim().max(30).optional(),
  stdCode: z.string().trim().max(10).optional(),
  pinCode: z.string().trim().max(10).optional(),
});
export const updateCitySchema = createCitySchema.partial().extend({ isActive: z.boolean().optional() });
