import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import SmsEmailAlert, { type ISmsEmailAlert } from './smsEmailAlert.model.js';

export class SmsEmailAlertService {
  static async getAll(companyId: string) {
    return SmsEmailAlert.find({ isActive: true, company: companyId })
      .populate('employee', 'firstName lastName employeeId').sort({ createdAt: -1 }).lean();
  }
  static async create(data: Partial<ISmsEmailAlert>) { return SmsEmailAlert.create(data); }
  static async update(id: string, data: Partial<ISmsEmailAlert>, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await SmsEmailAlert.findOneAndUpdate({ _id: id, company: companyId }, { $set: data }, { new: true });
    if (!doc) throw new AppError('Not found', 404); return doc;
  }
  static async delete(id: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const doc = await SmsEmailAlert.findOneAndUpdate({ _id: id, company: companyId }, { isActive: false }, { new: true });
    if (!doc) throw new AppError('Not found', 404); return doc;
  }
}
