import { z } from 'zod';

const gstEntrySchema = z.object({
  state: z.string().trim().optional(),
  tinNumber: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  stateCode: z.string().trim().optional(),
  isUT: z.boolean().optional(),
  isISD: z.boolean().optional(),
}).partial();

const documentSchema = z.object({
  documentName: z.string().trim().optional(),
  file: z.string().trim().optional(),
  filePath: z.string().trim().optional(),
  remark: z.string().trim().optional(),
}).partial();

// Optional ISO datetime helper — front-end sends `.toISOString()` strings.
const isoDate = z.union([z.string(), z.date()]).optional();

export const createBranchSchema = z.object({
  // Identity
  name: z.string({ required_error: 'Branch name is required' })
    .trim().min(1, 'Branch name is required').max(100),
  code: z.string({ required_error: 'Branch code is required' })
    .trim().min(1, 'Branch code is required').max(20).toUpperCase(),

  // Header
  isHO: z.boolean().optional(),
  siteType: z.string().trim().optional(),
  division: z.string().trim().optional(),
  departmentType: z.string().trim().optional(),
  projectType: z.string().trim().optional(),
  startDate: isoDate,
  purchaseLimit: z.number().nonnegative().optional(),
  isLocked: z.boolean().optional(),
  orderNo: z.number().nonnegative().optional(),
  cgstApplicable: z.boolean().optional(),

  // Address
  address01: z.string().trim().optional(),
  address02: z.string().trim().optional(),
  address03: z.string().trim().optional(),
  city: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  email: z.string().trim().optional(),
  emailForPO: z.string().trim().optional(),
  phone1: z.string().trim().optional(),
  phone2: z.string().trim().optional(),
  faxNo1: z.string().trim().optional(),
  faxNo2: z.string().trim().optional(),
  principalEmployer: z.string().trim().optional(),
  stateName: z.string().trim().optional(),

  // Tax
  tinNo: z.string().trim().optional(),
  stcNo: z.string().trim().optional(),
  eccNo: z.string().trim().optional(),
  exciseRange: z.string().trim().optional(),
  exciseDivision: z.string().trim().optional(),
  commissionerate: z.string().trim().optional(),
  descExciseableCommodity: z.string().trim().optional(),

  // Other
  remark: z.string().trim().optional(),
  reraRegNo: z.string().trim().optional(),
  completionCertificate: z.string().trim().optional(),
  loiLoaNo: z.string().trim().optional(),
  loiLoaDate: isoDate,
  agreementNo: z.string().trim().optional(),
  agreementDate: isoDate,
  tenderNo: z.string().trim().optional(),
  tenderDate: isoDate,
  workCapital: z.number().optional(),
  mandiLicenceNo: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),

  // Dynamic arrays
  gstEntries: z.array(gstEntrySchema).optional(),
  documents: z.array(documentSchema).optional(),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
