import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import UserRight, { type IUserRight } from './userRight.model.js';

export class UserRightService {
  static async getFor(userId: string, companyId: string, branchId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
    return UserRight.findOne({ user: userId, company: companyId, branch: branchId })
      .populate('user', 'firstName lastName username userType')
      .populate('branch', 'name');
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
