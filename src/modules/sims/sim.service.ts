import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Sim, { type ISim } from './sim.model.js';

export class SimService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 200, search, filters = {} } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) filter.$or = [
      { simMobileNo: { $regex: search, $options: 'i' } },
      { simSerialNo: { $regex: search, $options: 'i' } },
      { subscriberName: { $regex: search, $options: 'i' } },
      { planTariff: { $regex: search, $options: 'i' } },
    ];
    if (filters.status) filter.status = filters.status;
    if (filters.simType) filter.simType = filters.simType;
    if (filters.purchaseFrom || filters.purchaseTo) {
      const pd: Record<string, Date> = {};
      if (filters.purchaseFrom) pd.$gte = new Date(filters.purchaseFrom as string);
      if (filters.purchaseTo) pd.$lte = new Date(filters.purchaseTo as string);
      filter.purchaseDate = pd;
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Sim.find(filter).populate('allocatedTo', 'firstName lastName employeeId').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sim.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Sim.findOne(f).populate('allocatedTo', 'firstName lastName employeeId');
    if (!doc) throw new AppError('Sim not found', 404); return doc;
  }
  static async create(data: Partial<ISim>) { return Sim.create(data); }
  static async update(id: string, data: Partial<ISim>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Sim.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Sim not found', 404); return doc;
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await Sim.findOneAndUpdate(f, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Sim not found', 404); return doc;
  }
}
