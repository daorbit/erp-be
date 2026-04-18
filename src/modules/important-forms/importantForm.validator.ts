import { z } from 'zod';

export const createImportantFormSchema = z.object({
  name: z.string({ required_error: 'Document Name is required' }).trim().min(1).max(150),
  fileUrl: z.string().trim().optional(),
  fileName: z.string().trim().optional(),
  showInEmpSection: z.boolean().optional(),
});
export const updateImportantFormSchema = createImportantFormSchema.partial().extend({ isActive: z.boolean().optional() });
