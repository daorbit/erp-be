import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string({ required_error: 'Location Name is required' }).trim().min(1).max(100),
  site: z.string({ required_error: 'Site is required' }).min(1, 'Site is required'),
  contactPerson1: z.string().trim().max(100).optional(),
  contactPerson2: z.string().trim().max(100).optional(),
  storeManager: z.string().trim().max(100).optional(),
  address1: z.string().trim().max(100).optional(),
  address2: z.string().trim().max(100).optional(),
  address3: z.string().trim().max(100).optional(),
  locationType: z.string().trim().max(50).optional(),
  orderNo: z.number().int().nonnegative().default(0),
  city: z.string().trim().max(100).optional(),
  pinCode: z.string().trim().max(10).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional().transform(v => v ?? undefined),
  longitude: z.number().min(-180).max(180).nullable().optional().transform(v => v ?? undefined),
  routeDetails: z.array(z.object({
    toLocation: z.string().optional(),
    km: z.number().optional(),
    routeName: z.string().trim().optional(),
    distance: z.number().optional(),
    chainagePoint: z.number().optional(),
    remarks: z.string().trim().optional(),
  })).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
