import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import AttAutoNotification, { type IAttAutoNotification } from './attAutoNotification.model.js';

export class AttAutoNotificationService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 500 } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AttAutoNotification.find(filter).populate('branch', 'name code').populate('company', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AttAutoNotification.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async create(data: Partial<IAttAutoNotification>) {
    const existing = await AttAutoNotification.findOne({ branch: data.branch, company: data.company });
    if (existing) { if (!existing.isActive) { existing.isActive = true; await existing.save(); } return existing; }
    return AttAutoNotification.create(data);
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const r = await AttAutoNotification.deleteOne(f);
    if (r.deletedCount === 0) throw new AppError('Not found', 404);
    return { deleted: true };
  }
}
