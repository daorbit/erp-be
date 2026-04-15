import { z } from 'zod';

export const createAttAutoNotificationSchema = z.object({
  branch: z.string({ required_error: 'Branch is required' }).min(1),
});
