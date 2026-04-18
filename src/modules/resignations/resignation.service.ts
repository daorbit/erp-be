import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import { ResignStatus } from '../../shared/types.js';
import Resignation, { type IResignation } from './resignation.model.js';
import User from '../auth/auth.model.js';

export class ResignationService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 50, filters = {} } = query;
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;
    if (filters.employee) filter.employee = filters.employee;
    if (filters.status) filter.status = filters.status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Resignation.find(filter)
        .populate('employee', 'firstName lastName employeeId')
        .sort({ resignationDate: -1 })
        .skip(skip).limit(limit).lean(),
      Resignation.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Resignation.findOne(f).populate('employee', 'firstName lastName employeeId');
    if (!doc) throw new AppError('Resignation not found', 404);
    return doc;
  }

  static async create(data: Partial<IResignation>) { return Resignation.create(data); }

  static async update(id: string, data: Partial<IResignation>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Resignation.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Resignation not found', 404);

    // When resignation is approved, deactivate the employee user.
    if (data.status === ResignStatus.APPROVED && doc.employee) {
      await User.updateOne({ _id: doc.employee }, { $set: { isActive: false } });
    }

    return doc;
  }

  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const r = await Resignation.deleteOne(f);
    if (r.deletedCount === 0) throw new AppError('Resignation not found', 404);
    return { deleted: true };
  }
}
