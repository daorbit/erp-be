import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import UserRight, { type IUserRight } from './userRight.model.js';

export class UserRightService {
  // When both user + branch are supplied, returns the single row (legacy shape).
  // When only user is supplied, returns the full list of rows for that user.
  // When neither is supplied, returns every row for the company.
  static async getFor(userId?: string, companyId?: string, branchId?: string) {
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
      filter.user = userId;
    }
    if (branchId) {
      if (!mongoose.Types.ObjectId.isValid(branchId)) throw new AppError('Invalid branch ID', 400);
      filter.branch = branchId;
    }
    if (userId && branchId) {
      return UserRight.findOne(filter)
        .populate('user', 'firstName lastName username userType')
        .populate('branch', 'name');
    }
    return UserRight.find(filter)
      .populate('user', 'firstName lastName username userType')
      .populate('branch', 'name')
      .lean();
  }

  static async upsert(data: Partial<IUserRight>) {
    return UserRight.findOneAndUpdate(
      { user: data.user, company: data.company, branch: data.branch },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  }

  static async copyRights(fromUserId: string, toUserId: string, companyId: string, branchId: string) {
    const src = await UserRight.findOne({ user: fromUserId, company: companyId, branch: branchId });
    if (!src) throw new AppError('Source user has no rights in this scope.', 404);
    return this.upsert({
      user: new mongoose.Types.ObjectId(toUserId) as any,
      company: src.company, branch: src.branch,
      allowedPages: [...src.allowedPages],
    });
  }
}
