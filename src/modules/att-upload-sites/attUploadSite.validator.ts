import { z } from 'zod';

export const createAttUploadSiteSchema = z.object({
  branch: z.string({ required_error: 'Branch is required' }).min(1),
});
export const updateAttUploadSiteSchema = createAttUploadSiteSchema.partial().extend({ isActive: z.boolean().optional() });
