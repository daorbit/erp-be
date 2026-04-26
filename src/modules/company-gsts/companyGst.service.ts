import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import CompanyGst, { type ICompanyGst, type IGstAddressEntry } from './companyGst.model.js';

interface PaginatedResult<T> { data: T[]; pagination: ReturnType<typeof buildPagination>; }

export class CompanyGstService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<ICompanyGst>> {
    const { page = 1, limit = 200, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const filter: Record<string, unknown> = { isActive: true };
    if (companyId) filter.company = companyId;
    if (search) {
      filter.$or = [
        { state: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [rows, total] = await Promise.all([
      CompanyGst.find(filter).populate('company', 'name code').sort(sort).skip(skip).limit(limit).lean(),
      CompanyGst.countDocuments(filter),
    ]);
    return { data: rows as any as ICompanyGst[], pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid GST ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOne(filter).populate('company', 'name code');
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }

  static async create(data: Partial<ICompanyGst>): Promise<ICompanyGst> {
    return CompanyGst.create(data);
  }

  static async update(id: string, data: Partial<ICompanyGst>, companyId?: string): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid GST ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }

  static async delete(id: string, companyId?: string): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid GST ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOneAndUpdate(filter, { $set: { isActive: false } }, { new: true });
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }

  // ─── Effective-dated address history ─────────────────────────────────────
  static async addAddress(
    id: string,
    entry: Partial<IGstAddressEntry>,
    companyId?: string,
  ): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid GST ID format.', 400);
    if (!entry.effectiveDate) throw new AppError('Effective date is required.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOneAndUpdate(
      filter,
      { $push: { addresses: { ...entry, effectiveDate: new Date(entry.effectiveDate as any) } } },
      { new: true, runValidators: true },
    );
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }

  static async updateAddress(
    id: string,
    addressId: string,
    entry: Partial<IGstAddressEntry>,
    companyId?: string,
  ): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(addressId)) {
      throw new AppError('Invalid ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: id, 'addresses._id': addressId };
    if (companyId) filter.company = companyId;
    const set: Record<string, unknown> = {};
    if (entry.effectiveDate) set['addresses.$.effectiveDate'] = new Date(entry.effectiveDate as any);
    if (entry.address !== undefined) set['addresses.$.address'] = entry.address;
    if (entry.city !== undefined) set['addresses.$.city'] = entry.city;
    if (entry.pinCode !== undefined) set['addresses.$.pinCode'] = entry.pinCode;
    const row = await CompanyGst.findOneAndUpdate(filter, { $set: set }, { new: true });
    if (!row) throw new AppError('Address entry not found.', 404);
    return row;
  }

  static async removeAddress(id: string, addressId: string, companyId?: string): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(addressId)) {
      throw new AppError('Invalid ID format.', 400);
    }
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOneAndUpdate(
      filter,
      { $pull: { addresses: { _id: new mongoose.Types.ObjectId(addressId) } } },
      { new: true },
    );
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }

  // ─── E-Invoice credentials ───────────────────────────────────────────────
  static async saveEInvoice(
    id: string,
    apiUser: string,
    apiPassword: string,
    companyId?: string,
  ): Promise<ICompanyGst> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid GST ID format.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;
    const row = await CompanyGst.findOneAndUpdate(
      filter,
      { $set: { eInvoiceApiUser: apiUser, eInvoiceApiPassword: apiPassword } },
      { new: true },
    );
    if (!row) throw new AppError('GST entry not found.', 404);
    return row;
  }
}
