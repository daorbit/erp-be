import mongoose, { Schema, type Document, type Model } from 'mongoose';
import crypto from 'crypto';
import { UserRole } from '../../shared/types.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IInvitation extends Document {
  email: string;
  role: UserRole;
  company?: mongoose.Types.ObjectId;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  onboardingRequired: boolean;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: [true, 'Role is required'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter is required'],
    },
    onboardingRequired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ company: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Invitation: Model<IInvitation> = mongoose.model<IInvitation>('Invitation', invitationSchema);

export default Invitation;
