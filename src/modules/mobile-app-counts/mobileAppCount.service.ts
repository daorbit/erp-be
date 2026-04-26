import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import MobileAppCount, { type IMobileAppCount, APP_TYPES, type IActivationUser } from './mobileAppCount.model.js';

export class MobileAppCountService {
  /** Get-or-create the singleton row for the current company. */
  static async getForCompany(companyId: string): Promise<IMobileAppCount> {
    let doc = await MobileAppCount.findOne({ company: companyId });
    if (!doc) {
      const empty = APP_TYPES.reduce<Record<string, any>>((acc, t) => {
        acc[t] = { total: 0, used: 0 };
        return acc;
      }, {});
      doc = await MobileAppCount.create({
        company: companyId,
        client: empty,
        nway: { ...empty },
      });
    }
    return doc;
  }

  /** Replace the limits (Update Limit Form) and append a history entry capturing the change. */
  static async updateLimits(
    companyId: string,
    payload: {
      client: Record<string, { total?: number; used?: number }>;
      nway: Record<string, { total?: number; used?: number }>;
      remark?: string;
      entryByName?: string;
      mobile?: string;
    },
  ): Promise<IMobileAppCount> {
    const doc = await this.getForCompany(companyId);
    const oldClient = doc.client || {};
    const oldNway = doc.nway || {};

    doc.client = payload.client as any;
    doc.nway = payload.nway as any;
    doc.history.push({
      entryByName: payload.entryByName,
      mobile: payload.mobile,
      client: APP_TYPES.reduce<Record<string, number>>((acc, t) => {
        acc[t] = (payload.client?.[t]?.total ?? 0) - ((oldClient as any)[t]?.total ?? 0);
        return acc;
      }, {}) as any,
      nway: APP_TYPES.reduce<Record<string, number>>((acc, t) => {
        acc[t] = (payload.nway?.[t]?.total ?? 0) - ((oldNway as any)[t]?.total ?? 0);
        return acc;
      }, {}) as any,
      remark: payload.remark,
    } as any);
    await doc.save();
    return doc;
  }

  /** Add an activation user (Activation User Rights modal). */
  static async addActivationUser(
    companyId: string,
    user: Partial<IActivationUser>,
  ): Promise<IMobileAppCount> {
    if (!user.userName || !user.mobile) throw new AppError('userName and mobile are required.', 400);
    const doc = await this.getForCompany(companyId);
    doc.activationUsers.push({
      userName: user.userName,
      mobile: user.mobile,
      password: user.password,
      isActive: user.isActive ?? true,
      appType: user.appType,
    } as any);
    await doc.save();
    return doc;
  }

  static async updateActivationUser(
    companyId: string,
    userId: string,
    patch: Partial<IActivationUser>,
  ): Promise<IMobileAppCount> {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID.', 400);
    const doc = await this.getForCompany(companyId);
    const u = doc.activationUsers.find((x: any) => String(x._id) === userId) as any;
    if (!u) throw new AppError('Activation user not found.', 404);
    Object.assign(u, patch);
    await doc.save();
    return doc;
  }

  static async listActivationUsers(
    companyId: string,
    filters: { name?: string; userType?: string; userStatus?: 'active' | 'inactive' | 'all'; appAllow?: 'active' | 'inactive' | 'all' },
  ) {
    const doc = await this.getForCompany(companyId);
    let users = doc.activationUsers as any[];
    if (filters.name) {
      const q = filters.name.toLowerCase();
      users = users.filter((u) => (u.userName || '').toLowerCase().includes(q));
    }
    if (filters.userStatus === 'active') users = users.filter((u) => u.isActive);
    if (filters.userStatus === 'inactive') users = users.filter((u) => !u.isActive);
    return users;
  }
}
