import { z } from 'zod';
import { AssetCategory, AssetCondition, AssetStatus } from './asset.model.js';

export const createAssetSchema = z.object({
  name: z
    .string({ required_error: 'Asset name is required' })
    .trim()
    .min(1, 'Asset name is required')
    .max(200, 'Name cannot exceed 200 characters'),
  assetTag: z
    .string({ required_error: 'Asset tag is required' })
    .trim()
    .regex(/^AST-\d{4}-\d{3,}$/, 'Asset tag must follow the format AST-YYYY-NNN'),
  category: z.nativeEnum(AssetCategory, {
    required_error: 'Category is required',
  }),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  serialNumber: z.string().trim().max(100).optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().min(0).optional(),
  warrantyExpiry: z.string().datetime().optional(),
  condition: z.nativeEnum(AssetCondition).optional().default(AssetCondition.NEW),
  status: z.nativeEnum(AssetStatus).optional(),
  location: z.string().trim().max(200).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assignAssetSchema = z.object({
  employeeId: z.string({ required_error: 'Employee ID is required' }).min(1),
  notes: z.string().trim().max(500).optional(),
});

export const returnAssetSchema = z.object({
  condition: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
