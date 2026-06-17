import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { UserRole, UserCategory, UserType, ErpModule } from '../../shared/types.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  employeeId: string;
  /** FK to EmployeeProfile — set when the User is linked to an Employee record
   *  (internal users created via the "Employee" search on the User form). */
  employee?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  avatar?: string;
  onboardingRequired: boolean;
  onboardingCompleted: boolean;
  passwordChangeRequired: boolean;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;

  // ─── NwayERP User master extensions ──────────────────────────────────────
  username?: string;               // "User Name" — separate from email for login
  userCategory?: UserCategory;     // internal / external
  userType?: UserType;             // super_admin / admin / ho_user / site_admin / user
  allowedDepartments?: mongoose.Types.ObjectId[];
  allowedBranches?: mongoose.Types.ObjectId[];
  allowedModules?: string[];
  /** Sibling companies this user is permitted to switch context into. */
  allowedCompanies?: mongoose.Types.ObjectId[];
  remark?: string;
  isErpDevCoUser?: boolean;        // Admin → User Profile flag

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
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'EmployeeProfile',
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
    onboardingRequired: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false,
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

    // NwayERP extensions
    username: { type: String, trim: true, maxlength: 50 },
    userCategory: { type: String, enum: Object.values(UserCategory) },
    userType: { type: String, enum: Object.values(UserType) },
    allowedDepartments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
    allowedBranches: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    allowedModules: [{ type: String, enum: Object.values(ErpModule) }],
    allowedCompanies: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    remark: { type: String, trim: true, maxlength: 500 },
    isErpDevCoUser: { type: Boolean, default: false },
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

function buildJwtPayload(user: any): Record<string, unknown> {
  const companyId = user.company?._id?.toString() || user.company?.toString() || null;
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    userType: user.userType ?? null,
    company: companyId,
  };
}

userSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    buildJwtPayload(this),
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    buildJwtPayload(this),
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions,
  );
};

// ─── Model ───────────────────────────────────────────────────────────────────

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
