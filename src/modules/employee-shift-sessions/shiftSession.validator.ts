import { z } from 'zod';

const latitudeSchema = z
  .number({ invalid_type_error: 'Latitude must be a number' })
  .min(-90)
  .max(90);
const longitudeSchema = z
  .number({ invalid_type_error: 'Longitude must be a number' })
  .min(-180)
  .max(180);

// `multipart/form-data` sends everything as strings — coerce numerics.
const coercedNumber = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() !== '' ? Number(val) : val),
  z.number(),
);

export const startShiftSessionSchema = z.object({
  siteId: z.string().trim().optional(),
  latitude: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    latitudeSchema,
  ),
  longitude: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    longitudeSchema,
  ),
  accuracy: coercedNumber.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const endShiftSessionSchema = z.object({
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  accuracy: z.number().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const trackGpsSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accuracy: z.number().optional(),
  capturedAt: z.string().datetime().optional(),
});
