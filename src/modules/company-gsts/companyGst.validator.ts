import { z } from 'zod';

export const createCompanyGstSchema = z.object({
  state: z.string({ required_error: 'GST State is required' }).trim().min(1),
  stateCode: z.string().trim().optional(),
  gstNumber: z.string({ required_error: 'GST Number is required' }).trim().min(1).max(20).toUpperCase(),
  provisionId: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  contactNo: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  pinCode: z.string().trim().optional(),
  invoiceCode: z.string().trim().optional(),
  remark: z.string().trim().optional(),
  isISD: z.boolean().optional(),
  attachmentUrl: z.string().trim().optional(),
});

export const updateCompanyGstSchema = createCompanyGstSchema.partial();
export type CreateCompanyGstInput = z.infer<typeof createCompanyGstSchema>;
export type UpdateCompanyGstInput = z.infer<typeof updateCompanyGstSchema>;
