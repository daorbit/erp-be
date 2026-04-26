import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
}).optional();

const documentItemSchema = z.object({
  documentName: z.string().trim().optional(),
  documentRemark: z.string().trim().optional(),
  file: z.string().optional(),
  whatsappEmail: z.boolean().optional(),
});

const itReturnItemSchema = z.object({
  finYear: z.string().trim().optional(),
  fillingDate: z.union([z.string(), z.date()]).optional(),
  acknowledgementNo: z.string().trim().optional(),
  file: z.string().optional(),
});

// All NwayERP-extended company fields. Listed once so create + update share
// the same surface — without these, FE-submitted fields are silently dropped.
const extendedCompanyFields = {
  // Address Details
  signFor: z.string().trim().optional(),
  address02: z.string().trim().optional(),
  address03: z.string().trim().optional(),
  phone2: z.string().trim().optional(),
  faxNo1: z.string().trim().optional(),
  faxNo2: z.string().trim().optional(),
  directorName: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  designation: z.string().trim().optional(),

  // Tax Details
  pfPrefix: z.string().trim().optional(),
  tinNo: z.string().trim().optional(),
  tanNo: z.string().trim().optional(),
  stNo1: z.string().trim().optional(),
  stNo2: z.string().trim().optional(),
  cstNo1: z.string().trim().optional(),
  cstNo2: z.string().trim().optional(),
  lutBondNo: z.string().trim().optional(),
  lutDate: z.union([z.string(), z.date()]).optional(),
  msme: z.string().trim().optional(),

  // Other Details
  cinNo: z.string().trim().optional(),
  eccNo1: z.string().trim().optional(),
  eccNo2: z.string().trim().optional(),
  range: z.string().trim().optional(),
  division: z.string().trim().optional(),
  commissionerate: z.string().trim().optional(),
  cthNo: z.string().trim().optional(),
  regOffName: z.string().trim().optional(),
  regOffAddress: z.string().trim().optional(),
  remark: z.string().trim().optional(),
  regOffPinCode: z.string().trim().optional(),
  regOffPhoneNo: z.string().trim().optional(),
  regOffCity: z.string().trim().optional(),

  // Logo / Images
  logoLeft: z.string().optional(),
  logoRight: z.string().optional(),
  headerImage: z.string().optional(),
  footerImage: z.string().optional(),
  stampImage: z.string().optional(),

  // Dynamic arrays
  documents: z.array(documentItemSchema).optional(),
  itReturns: z.array(itReturnItemSchema).optional(),
};

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  code: z.string().min(1, 'Company code is required').max(20),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().max(20).optional(),
  website: z.string().max(200).optional(),
  address: addressSchema,
  industry: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
  contactPerson: z.string().max(100).optional(),
  gstNumber: z.string().max(15).optional(),
  panNumber: z.string().max(10).optional(),
  maxEmployees: z.number().int().min(1).optional(),
  subscription: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  ...extendedCompanyFields,
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
  contactPerson: z.string().max(100).optional(),
  gstNumber: z.string().max(15).optional(),
  panNumber: z.string().max(10).optional(),
  maxEmployees: z.number().int().min(1).optional(),
  subscription: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
  ...extendedCompanyFields,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
