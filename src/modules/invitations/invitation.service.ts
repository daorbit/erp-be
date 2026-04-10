import { AppError } from '../../middleware/errorHandler.js';
import { generateEmployeeId } from '../../shared/helpers.js';
import config from '../../config/index.js';
import User from '../auth/auth.model.js';
import Invitation, { type IInvitation } from './invitation.model.js';
import type { CreateInvitationInput, AcceptInvitationInput } from './invitation.validator.js';

interface CreateResult {
  invitation: IInvitation;
  invitationLink: string;
}

export class InvitationService {
  /**
   * Create a new invitation and generate a shareable link.
   */
  static async create(data: CreateInvitationInput, invitedBy: string): Promise<CreateResult> {
    // Validate company is present for non-super_admin roles
    if (data.role !== 'super_admin' && !data.company) {
      throw new AppError('Company is required for non-platform-admin roles.', 400);
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409);
    }

    // Expire any existing pending invitations for this email
    await Invitation.updateMany(
      { email: data.email, status: 'pending' },
      { $set: { status: 'expired' } },
    );

    const invitation = await Invitation.create({
      email: data.email,
      role: data.role,
      company: data.company || undefined,
      onboardingRequired: data.onboardingRequired ?? false,
      invitedBy,
    });

    const invitationLink = `${config.frontendUrl}/invite/${invitation.token}`;

    return { invitation, invitationLink };
  }

  /**
   * Accept an invitation — create the user account.
   */
  static async accept(data: AcceptInvitationInput): Promise<{ user: any }> {
    const invitation = await Invitation.findOne({
      token: data.token,
      status: 'pending',
    });

    if (!invitation) {
      throw new AppError('Invalid or expired invitation link.', 404);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new AppError('This invitation has expired.', 410);
    }

    // Check if user was created in the meantime
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const employeeId = generateEmployeeId();

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: invitation.email,
      password: data.password,
      phone: data.phone,
      role: invitation.role,
      company: invitation.company,
      employeeId,
      onboardingRequired: invitation.onboardingRequired,
      onboardingCompleted: false,
      isActive: true,
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    return { user };
  }

  /**
   * List pending invitations, scoped by company.
   */
  static async getAll(companyId?: string): Promise<any[]> {
    const filter: Record<string, unknown> = { expiresAt: { $gt: new Date() } };
    if (companyId) filter.company = companyId;

    const invitations = await Invitation.find(filter)
      .populate('invitedBy', 'firstName lastName email')
      .populate('company', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Attach invitation link for pending invitations so admin can re-share
    return invitations.map((inv) => ({
      ...inv,
      invitationLink: inv.status === 'pending'
        ? `${config.frontendUrl}/invite/${inv.token}`
        : null,
    }));
  }

  /**
   * Get invitation details by token (public — for the accept form).
   */
  static async getByToken(token: string): Promise<{ email: string; role: string; company?: any }> {
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
    }).populate('company', 'name code');

    if (!invitation) {
      throw new AppError('Invalid or expired invitation link.', 404);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      throw new AppError('This invitation has expired.', 410);
    }

    return {
      email: invitation.email,
      role: invitation.role,
      company: invitation.company,
    };
  }
}
