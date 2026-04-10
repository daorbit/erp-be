import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import User from '../auth/auth.model.js';
import Onboarding, { type IOnboarding } from './onboarding.model.js';

export class OnboardingService {
  /**
   * Get or create onboarding record for a user.
   */
  static async getOrCreate(userId: string, companyId: string): Promise<IOnboarding> {
    let record = await Onboarding.findOne({ user: userId });
    if (!record) {
      const user = await User.findById(userId);
      record = await Onboarding.create({
        user: userId,
        company: companyId,
        personalInfo: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          phone: user?.phone,
        },
        status: 'pending',
      });
    }
    return record;
  }

  /**
   * Get onboarding for a specific user (admin or self).
   */
  static async getByUser(userId: string, companyId?: string): Promise<IOnboarding> {
    const filter: Record<string, unknown> = { user: userId };
    if (companyId) filter.company = companyId;

    const record = await Onboarding.findOne(filter)
      .populate('user', 'firstName lastName email phone role')
      .populate('reviewedBy', 'firstName lastName');

    if (!record) {
      throw new AppError('Onboarding record not found.', 404);
    }
    return record;
  }

  /**
   * List all onboarding records for a company.
   */
  static async getAll(companyId?: string): Promise<IOnboarding[]> {
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;

    return Onboarding.find(filter)
      .populate('user', 'firstName lastName email phone role onboardingRequired onboardingCompleted')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ updatedAt: -1 });
  }

  /**
   * Save a step's data (partial update). Works for self or admin-on-behalf.
   */
  static async saveStep(
    userId: string,
    companyId: string,
    step: number,
    data: Record<string, unknown>,
  ): Promise<IOnboarding> {
    const record = await this.getOrCreate(userId, companyId);

    const stepFields: Record<number, string> = {
      0: 'personalInfo',
      1: 'idVerification',
      2: 'bankDetails',
      3: 'documents',
    };

    const field = stepFields[step];
    if (!field) throw new AppError('Invalid step number.', 400);

    (record as any)[field] = { ...(record as any)[field]?.toObject?.() ?? (record as any)[field] ?? {}, ...data };
    record.currentStep = Math.max(record.currentStep, step);
    if (record.status === 'pending') record.status = 'in_progress';
    await record.save();

    return record;
  }

  /**
   * Submit completed onboarding (user action).
   */
  static async submit(userId: string, companyId: string): Promise<IOnboarding> {
    const record = await this.getOrCreate(userId, companyId);

    record.status = 'submitted';
    record.currentStep = 4;
    record.submittedAt = new Date();
    await record.save();

    // Mark user onboarding as completed
    await User.findByIdAndUpdate(userId, { onboardingCompleted: true });

    return record;
  }

  /**
   * Admin: update any field on an onboarding record.
   */
  static async adminUpdate(
    userId: string,
    data: Partial<IOnboarding>,
    companyId?: string,
  ): Promise<IOnboarding> {
    const filter: Record<string, unknown> = { user: userId };
    if (companyId) filter.company = companyId;

    const record = await Onboarding.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!record) throw new AppError('Onboarding record not found.', 404);
    return record;
  }

  /**
   * Admin: delete an onboarding record and reset user onboarding flags.
   */
  static async delete(userId: string, companyId?: string): Promise<void> {
    const filter: Record<string, unknown> = { user: userId };
    if (companyId) filter.company = companyId;

    const record = await Onboarding.findOneAndDelete(filter);
    if (!record) throw new AppError('Onboarding record not found.', 404);

    // Reset user onboarding flags
    await User.findByIdAndUpdate(userId, { onboardingRequired: false, onboardingCompleted: false });
  }

  /**
   * Admin: approve or reject onboarding.
   */
  static async review(
    userId: string,
    action: 'approved' | 'rejected',
    reviewerId: string,
    remarks?: string,
    companyId?: string,
  ): Promise<IOnboarding> {
    const filter: Record<string, unknown> = { user: userId };
    if (companyId) filter.company = companyId;

    const record = await Onboarding.findOne(filter);
    if (!record) throw new AppError('Onboarding record not found.', 404);

    record.status = action;
    record.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    record.reviewedAt = new Date();
    if (remarks) record.remarks = remarks;
    await record.save();

    return record;
  }
}
