import { z } from 'zod';

export const createDocumentMasterSchema = z.object({
  name: z.string({ required_error: 'Document Name is required' }).trim().min(1).max(100),
});
export const updateDocumentMasterSchema = createDocumentMasterSchema.partial().extend({
  isActive: z.boolean().optional(),
});
