import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import DocumentMaster, { type IDocumentMaster } from './documentMaster.model.js';

export class DocumentMasterService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 200, search } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      DocumentMaster.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      DocumentMaster.countDocuments(filter),
    ]);
    return { data, pagination: buildPagination(page, limit, total) };
  }
  static async getById(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await DocumentMaster.findOne(f); if (!doc) throw new AppError('Document not found', 404); return doc;
  }
  static async create(data: Partial<IDocumentMaster>) { return DocumentMaster.create(data); }
  static async update(id: string, data: Partial<IDocumentMaster>, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await DocumentMaster.findOneAndUpdate(f, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Document not found', 404); return doc;
  }
  static async delete(id: string, companyId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const f: Record<string, unknown> = { _id: id }; if (companyId) f.company = companyId;
    const doc = await DocumentMaster.findOneAndUpdate(f, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Document not found', 404); return doc;
  }
}
