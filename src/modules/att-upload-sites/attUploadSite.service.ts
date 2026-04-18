import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import AttUploadSite, { type IAttUploadSite } from './attUploadSite.model.js';

export class AttUploadSiteService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 500 } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttUploadSite.find(filter).populate('branch', 'name code').populate('company', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AttUploadSite.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async create(data: Partial<IAttUploadSite>) {
    // Idempotent: reactivate the pair if it already existed.
    const existing = await AttUploadSite.findOne({ branch: data.branch, company: data.company });
    if (existing) {
      if (!existing.isActive) { existing.isActive = true; await existing.save(); }
      return existing;
    }
    return AttUploadSite.create(data);
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    // Hard delete since these are simple pair records.
    const r = await AttUploadSite.deleteOne(f);
    if (r.deletedCount === 0) throw new AppError('Not found', 404);
    return { deleted: true };
  }
}
