import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import MisProjectSetting, { type IMisProjectSetting } from './misProjectSetting.model.js';

export class MisProjectSettingService {
  static async getAll(companyId: string) {
    return MisProjectSetting.find({ company: companyId, isActive: true })
      .populate('user', 'firstName lastName username email employeeId')
      .populate('projects', 'name code')
      .lean();
  }

  /** Fetch the row for a single user (or null if none yet). */
  static async getByUser(userId: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
    return MisProjectSetting.findOne({ user: userId, company: companyId })
      .populate('projects', 'name code')
      .lean();
  }

  /** Upsert — replaces the project list for the user. */
  static async upsert(
    userId: string,
    projects: string[],
    companyId: string,
  ): Promise<IMisProjectSetting> {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
    const validProjects = (projects || []).filter((p) => mongoose.Types.ObjectId.isValid(p));
    const doc = await MisProjectSetting.findOneAndUpdate(
      { user: userId, company: companyId },
      { $set: { projects: validProjects, isActive: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return doc;
  }
}
