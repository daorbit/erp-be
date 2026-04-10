import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
}).optional();

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  code: z.string().min(1, 'Company code is required').max(20),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().max(20).optional(),
  website: z.string().max(200).optional(),
  address: addressSchema,
  industry: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().max(200).optional(),
  address: addressSchema,
  industry: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
