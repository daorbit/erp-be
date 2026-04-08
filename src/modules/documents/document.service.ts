import type { FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import DocumentModel, { type IDocument } from './document.model.js';
import type { UploadDocumentInput, UpdateDocumentInput } from './document.validator.js';

export class DocumentService {
  static async getAll(query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IDocument> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.category) filter.category = filters.category;
    if (filters?.employee) filter.employee = filters.employee;
    if (filters?.isPublic !== undefined) filter.isPublic = filters.isPublic;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('uploadedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(filter),
    ]);

    return { documents, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string) {
    const document = await DocumentModel.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName email');

    if (!document) {
      throw new AppError('Document not found.', 404);
    }

    return document;
  }

  static async upload(data: UploadDocumentInput & { uploadedBy: string }) {
    const document = await DocumentModel.create(data);
    return document;
  }

  static async update(id: string, data: UpdateDocumentInput) {
    const document = await DocumentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('uploadedBy', 'firstName lastName');

    if (!document) {
      throw new AppError('Document not found.', 404);
    }

    return document;
  }

  static async delete(id: string) {
    const document = await DocumentModel.findByIdAndDelete(id);
    if (!document) {
      throw new AppError('Document not found.', 404);
    }
    return document;
  }

  static async getByEmployee(employeeId: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IDocument> = { employee: employeeId };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(filter),
    ]);

    return { documents, pagination: buildPagination(page, limit, total) };
  }

  static async getPublicDocuments(query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IDocument> = { isPublic: true };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(filter),
    ]);

    return { documents, pagination: buildPagination(page, limit, total) };
  }

  static async getByCategory(category: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IDocument> = { category };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('uploadedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentModel.countDocuments(filter),
    ]);

    return { documents, pagination: buildPagination(page, limit, total) };
  }
}
