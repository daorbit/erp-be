import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum MaritalStatus {
  SINGLE = 'Single',
  MARRIED = 'Married',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed',
}

export enum EmploymentType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CONTRACT = 'Contract',
  INTERN = 'Intern',
  FREELANCER = 'Freelancer',
}

export enum AccountType {
  SAVINGS = 'Savings',
  CURRENT = 'Current',
  SALARY = 'Salary',
}

// ─── Sub-Interfaces ─────────────────────────────────────────────────────────

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface IEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export interface IBankDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  accountType?: AccountType;
}

export interface IIdentityDocs {
  aadhaarNumber?: string;
  panNumber?: string;
  passportNumber?: string;
  drivingLicense?: string;
}

export interface ISalaryBreakdown {
  basic?: number;
  hra?: number;
  da?: number;
  specialAllowance?: number;
  grossSalary?: number;
  deductions?: number;
  netSalary?: number;
  ctc?: number;
}

export interface IEmployeeDocument {
  name: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt: Date;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IEmployeeProfile extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  dateOfBirth?: Date;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  currentAddress?: IAddress;
  permanentAddress?: IAddress;
  emergencyContact?: IEmergencyContact;
  bankDetails?: IBankDetails;
  identityDocs?: IIdentityDocs;
  joinDate?: Date;
  confirmationDate?: Date;
  probationEndDate?: Date;
  resignationDate?: Date;
  lastWorkingDate?: Date;
  employmentType: EmploymentType;
  workShift?: string;
  workLocation?: string;
  reportingManager?: mongoose.Types.ObjectId;
  salary?: ISalaryBreakdown;
  documents?: IEmployeeDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ────────────────────────────────────────────────────────────

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 100 },
    zipCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true, maxlength: 100 },
    relationship: { type: String, trim: true, maxlength: 50 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 100 },
  },
  { _id: false },
);

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    bankName: { type: String, trim: true, maxlength: 100 },
    accountNumber: { type: String, trim: true, maxlength: 30 },
    ifscCode: { type: String, trim: true, uppercase: true, maxlength: 20 },
    branchName: { type: String, trim: true, maxlength: 100 },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
    },
  },
  { _id: false },
);

const identityDocsSchema = new Schema<IIdentityDocs>(
  {
    aadhaarNumber: { type: String, trim: true, maxlength: 12 },
    panNumber: { type: String, trim: true, uppercase: true, maxlength: 10 },
    passportNumber: { type: String, trim: true, uppercase: true, maxlength: 20 },
    drivingLicense: { type: String, trim: true, maxlength: 30 },
  },
  { _id: false },
);

const salaryBreakdownSchema = new Schema<ISalaryBreakdown>(
  {
    basic: { type: Number, min: 0 },
    hra: { type: Number, min: 0 },
    da: { type: Number, min: 0 },
    specialAllowance: { type: Number, min: 0 },
    grossSalary: { type: Number, min: 0 },
    deductions: { type: Number, min: 0 },
    netSalary: { type: Number, min: 0 },
    ctc: { type: Number, min: 0 },
  },
  { _id: false },
);

const employeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    fileUrl: { type: String, required: true },
    fileType: { type: String, trim: true, maxlength: 50 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const employeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      required: [true, 'Employee ID is required'],
      trim: true,
      match: [/^EMP-\d{4}-\d{3,}$/, 'Employee ID must follow the format EMP-YYYY-NNN'],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    maritalStatus: {
      type: String,
      enum: Object.values(MaritalStatus),
    },
    bloodGroup: {
      type: String,
      trim: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [50, 'Nationality cannot exceed 50 characters'],
    },
    religion: {
      type: String,
      trim: true,
      maxlength: [50, 'Religion cannot exceed 50 characters'],
    },
    currentAddress: addressSchema,
    permanentAddress: addressSchema,
    emergencyContact: emergencyContactSchema,
    bankDetails: bankDetailsSchema,
    identityDocs: identityDocsSchema,
    joinDate: {
      type: Date,
    },
    confirmationDate: {
      type: Date,
    },
    probationEndDate: {
      type: Date,
    },
    resignationDate: {
      type: Date,
    },
    lastWorkingDate: {
      type: Date,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      default: EmploymentType.FULL_TIME,
    },
    workShift: {
      type: String,
      trim: true,
      maxlength: [50, 'Work shift cannot exceed 50 characters'],
    },
    workLocation: {
      type: String,
      trim: true,
      maxlength: [100, 'Work location cannot exceed 100 characters'],
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    salary: salaryBreakdownSchema,
    documents: [employeeDocumentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

employeeProfileSchema.index({ employeeId: 1 });
employeeProfileSchema.index({ userId: 1 });
employeeProfileSchema.index({ reportingManager: 1 });
employeeProfileSchema.index({ employmentType: 1, isActive: 1 });
employeeProfileSchema.index({ joinDate: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const EmployeeProfile: Model<IEmployeeProfile> = mongoose.model<IEmployeeProfile>(
  'EmployeeProfile',
  employeeProfileSchema,
);

export default EmployeeProfile;
