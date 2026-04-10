import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { UserRole } from '../../shared/types.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  employeeId: string;
  company?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Exclude from queries by default
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    employeeId: {
      type: String,
      unique: true,
      required: [true, 'Employee ID is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ company: 1 });

// ─── Pre-save: Hash password ─────────────────────────────────────────────────

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ─── Methods ─────────────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function (): string {
  // company may be a populated object or a raw ObjectId — always extract the ID
  const companyId = this.company?._id?.toString() || this.company?.toString() || null;
  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
      role: this.role,
      company: companyId,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const companyId = this.company?._id?.toString() || this.company?.toString() || null;
  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
      role: this.role,
      company: companyId,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions,
  );
};

// ─── Model ───────────────────────────────────────────────────────────────────

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
