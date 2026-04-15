import mongoose, { Schema, type Document, type Model } from 'mongoose';
import {
  EmpStatus, LocalMigrant, CategorySkill, SubCompany, PFScheme, TDSRegime,
  Relation, Division, RoleType, ReligionType,
} from '../../shared/types.js';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  FREELANCER = 'freelancer',
}

export enum AccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  SALARY = 'salary',
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
  company: mongoose.Types.ObjectId;
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
  shift?: mongoose.Types.ObjectId;
  workShift?: string;
  workLocation?: string;
  reportingManager?: mongoose.Types.ObjectId;
  salary?: ISalaryBreakdown;
  documents?: IEmployeeDocument[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // ─── Extended fields (NwayERP form) ────────────────────────────────────────
  // Top-panel
  title?: string;                 // Mr./Mrs./Ms./Dr.
  fileNo?: string;
  workId?: string;
  branch?: mongoose.Types.ObjectId;
  level?: mongoose.Types.ObjectId;
  grade?: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  employeeGroup?: mongoose.Types.ObjectId;
  specialEmployee?: boolean;

  // Personal tab
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  anniversary?: Date;
  mobileNo?: string;
  alternateMobileNo?: string;
  email?: string;
  alternateEmail?: string;
  city?: mongoose.Types.ObjectId;             // Present-address city
  permanentCity?: mongoose.Types.ObjectId;    // Permanent-address city
  heightFeet?: number;
  heightInches?: number;
  weightKg?: number;
  religionEnum?: ReligionType;
  firstVaccinationDate?: Date;
  secondVaccinationDate?: Date;
  firstVaccinationCertificateUrl?: string;
  secondVaccinationCertificateUrl?: string;
  localMigrant?: LocalMigrant;
  categorySkill?: CategorySkill;
  subCompany?: SubCompany;
  pfScheme?: PFScheme;
  empStatus?: EmpStatus;
  isPhysicallyChallenged?: boolean;
  isInternationalEmployee?: boolean;
  eligibleForExcessEPF?: boolean;
  eligibleForExcessEPS?: boolean;
  vocationalTrainingCentre?: boolean;
  independentMedicalExamination?: boolean;

  // HR Detail tab
  joiningDateCompanyGrp?: Date;
  interviewDate?: Date;
  confirmationDay?: number;
  reportingEmp?: mongoose.Types.ObjectId;   // ref User
  tagName?: mongoose.Types.ObjectId;        // ref Tag
  validTill?: Date;
  drivingLicenseNo?: string;
  licenseCategory?: string;
  licenseIssueBy?: string;
  passportNo?: string;
  issueCountry?: string;
  passportIssueDate?: Date;
  passportExpiryDate?: Date;
  visaType?: string;
  visaExpiryDate?: Date;
  voterId?: string;
  previousExperienceYear?: number;
  previousExperienceMonth?: number;
  pfNumber?: string;
  pfDate?: Date;
  pfExitDate?: Date;
  universalAccNo?: string;
  aadhaarCardName?: string;
  virtualId?: string;
  panCardName?: string;
  esicNo?: string;
  esicDate?: Date;
  panAadhaarLinkingDec?: boolean;
  empRemark?: string;
  totalWorkingPerDay?: number;
  noticePeriodDays?: number;
  tdsRegimeType?: TDSRegime;
  tdsRegimeFileUrl?: string;
  lwf?: string;
  serviceBookNo?: string;
  fuelRate?: number;
  markOfIdentification?: string;
  bondExpiryDate?: Date;
  educationLevel?: string;
  referredBy?: string;
  referredContactNo?: string;
  appointmentIssueDate?: Date;
  receiveDate?: Date;
  pranNps?: string;
  citizenNo?: string;
  currency?: string;
  employeeBankName?: string;
  employeeBankAccNo?: string;
  ifscCode?: string;
  bankAccountHolderName?: string;
  employeeBankBranch?: string;
  bankFileUrl?: string;
  employerBankName?: string;
  customEmployeeCode?: string;

  // Media
  photoUrl?: string;
  signatureUrl?: string;

  // Embedded tables
  relatives?: IEmployeeRelative[];
  education?: IEmployeeEducation[];
  empRoles?: IEmployeeRole[];
  previousOrgs?: IPreviousOrg[];
  branchHistory?: IBranchHistoryEntry[];
  leaveTemplate?: ILeaveTemplateEntry[];
  bankHistory?: IBankHistoryEntry[];
  additionalDocs?: IAdditionalDoc[];
}

// ─── Embedded sub-schema interfaces ─────────────────────────────────────────

export interface IEmployeeRelative {
  relation: Relation;
  relativeName: string;
  isNominee: boolean;
  contactNo?: string;
  isEmergency: boolean;
  aadhaarNo?: string;
  dob?: Date;
  bloodGroup?: string;
}

export interface IEmployeeEducation {
  degreeOfExam?: string;
  universityCollegeSchool?: string;
  division?: Division;
  percentageOfMarks?: number;
  passingYear?: string;
  principalSubject?: string;
  remark?: string;
  fileUrl?: string;
}

export interface IEmployeeRole {
  roleType: RoleType;
  description?: string;
}

export interface IPreviousOrg {
  name?: string;
  from?: Date;
  to?: Date;
  designation?: string;
  lastSalaryDrawn?: number;
  reasonForLeaving?: string;
  fileUrl?: string;
}

export interface IBranchHistoryEntry {
  fromDate: Date;
  toDate?: Date;
  company?: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  level?: mongoose.Types.ObjectId;
  grade?: mongoose.Types.ObjectId;
  isActive: boolean;
}

export interface ILeaveTemplateEntry {
  leaveType: mongoose.Types.ObjectId; // ref LeaveType
  value: number;                      // Balance for this leave type
}

export interface IBankHistoryEntry {
  uptoMonth?: string;      // e.g. "2024-12"
  bankAccountHolderName?: string;
  employeeBankAccNo?: string;
  employeeBankName?: string;
  employeeBankBranch?: string;
  ifscCode?: string;
  employerBankName?: string;
  fileUrl?: string;
}

export interface IAdditionalDoc {
  documentType?: mongoose.Types.ObjectId;  // ref DocumentMaster
  remarks?: string;
  fileUrl?: string;
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

// ─── Extended sub-schemas (NwayERP tables) ─────────────────────────────────

const relativeSchema = new Schema<IEmployeeRelative>(
  {
    relation: { type: String, enum: Object.values(Relation), required: true },
    relativeName: { type: String, required: true, trim: true, maxlength: 100 },
    isNominee: { type: Boolean, default: false },
    contactNo: { type: String, trim: true, maxlength: 20 },
    isEmergency: { type: Boolean, default: false },
    aadhaarNo: { type: String, trim: true, maxlength: 20 },
    dob: { type: Date },
    bloodGroup: { type: String, trim: true },
  },
  { _id: true },
);

const educationSchema = new Schema<IEmployeeEducation>(
  {
    degreeOfExam: { type: String, trim: true, maxlength: 100 },
    universityCollegeSchool: { type: String, trim: true, maxlength: 200 },
    division: { type: String, enum: Object.values(Division) },
    percentageOfMarks: { type: Number, min: 0, max: 100 },
    passingYear: { type: String, trim: true, maxlength: 10 },
    principalSubject: { type: String, trim: true, maxlength: 200 },
    remark: { type: String, trim: true, maxlength: 500 },
    fileUrl: { type: String, trim: true },
  },
  { _id: true },
);

const empRoleSchema = new Schema<IEmployeeRole>(
  {
    roleType: { type: String, enum: Object.values(RoleType), required: true },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: true },
);

const previousOrgSchema = new Schema<IPreviousOrg>(
  {
    name: { type: String, trim: true, maxlength: 200 },
    from: { type: Date },
    to: { type: Date },
    designation: { type: String, trim: true, maxlength: 100 },
    lastSalaryDrawn: { type: Number, min: 0 },
    reasonForLeaving: { type: String, trim: true, maxlength: 500 },
    fileUrl: { type: String, trim: true },
  },
  { _id: true },
);

const branchHistorySchema = new Schema<IBranchHistoryEntry>(
  {
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
    level: { type: Schema.Types.ObjectId, ref: 'Level' },
    grade: { type: Schema.Types.ObjectId, ref: 'Grade' },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);

const leaveTemplateSchema = new Schema<ILeaveTemplateEntry>(
  {
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    value: { type: Number, default: 0, min: 0 },
  },
  { _id: true },
);

const bankHistorySchema = new Schema<IBankHistoryEntry>(
  {
    uptoMonth: { type: String, trim: true, maxlength: 10 },
    bankAccountHolderName: { type: String, trim: true, maxlength: 100 },
    employeeBankAccNo: { type: String, trim: true, maxlength: 30 },
    employeeBankName: { type: String, trim: true, maxlength: 100 },
    employeeBankBranch: { type: String, trim: true, maxlength: 100 },
    ifscCode: { type: String, trim: true, maxlength: 20 },
    employerBankName: { type: String, trim: true, maxlength: 100 },
    fileUrl: { type: String, trim: true },
  },
  { _id: true, timestamps: true },
);

const additionalDocSchema = new Schema<IAdditionalDoc>(
  {
    documentType: { type: Schema.Types.ObjectId, ref: 'DocumentMaster' },
    remarks: { type: String, trim: true, maxlength: 500 },
    fileUrl: { type: String, trim: true },
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
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
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
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
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

    // ─── Extended (NwayERP form) fields ─────────────────────────────────────
    title: { type: String, trim: true, maxlength: 10 },
    fileNo: { type: String, trim: true, maxlength: 30 },
    workId: { type: String, trim: true, maxlength: 30 },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    level: { type: Schema.Types.ObjectId, ref: 'Level' },
    grade: { type: Schema.Types.ObjectId, ref: 'Grade' },
    designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    employeeGroup: { type: Schema.Types.ObjectId, ref: 'EmployeeGroup' },
    specialEmployee: { type: Boolean, default: false },

    // Personal
    fatherName: { type: String, trim: true, maxlength: 100 },
    motherName: { type: String, trim: true, maxlength: 100 },
    spouseName: { type: String, trim: true, maxlength: 100 },
    anniversary: { type: Date },
    mobileNo: { type: String, trim: true, maxlength: 20 },
    alternateMobileNo: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 100 },
    alternateEmail: { type: String, trim: true, lowercase: true, maxlength: 100 },
    city: { type: Schema.Types.ObjectId, ref: 'City' },
    permanentCity: { type: Schema.Types.ObjectId, ref: 'City' },
    heightFeet: { type: Number, min: 0 },
    heightInches: { type: Number, min: 0, max: 11 },
    weightKg: { type: Number, min: 0 },
    religionEnum: { type: String, enum: Object.values(ReligionType) },
    firstVaccinationDate: { type: Date },
    secondVaccinationDate: { type: Date },
    firstVaccinationCertificateUrl: { type: String, trim: true },
    secondVaccinationCertificateUrl: { type: String, trim: true },
    localMigrant: { type: String, enum: Object.values(LocalMigrant) },
    categorySkill: { type: String, enum: Object.values(CategorySkill) },
    subCompany: { type: String, enum: Object.values(SubCompany) },
    pfScheme: { type: String, enum: Object.values(PFScheme) },
    empStatus: { type: String, enum: Object.values(EmpStatus) },
    isPhysicallyChallenged: { type: Boolean, default: false },
    isInternationalEmployee: { type: Boolean, default: false },
    eligibleForExcessEPF: { type: Boolean, default: false },
    eligibleForExcessEPS: { type: Boolean, default: false },
    vocationalTrainingCentre: { type: Boolean, default: false },
    independentMedicalExamination: { type: Boolean, default: false },

    // HR
    joiningDateCompanyGrp: { type: Date },
    interviewDate: { type: Date },
    confirmationDay: { type: Number, min: 0 },
    reportingEmp: { type: Schema.Types.ObjectId, ref: 'User' },
    tagName: { type: Schema.Types.ObjectId, ref: 'Tag' },
    validTill: { type: Date },
    drivingLicenseNo: { type: String, trim: true, maxlength: 30 },
    licenseCategory: { type: String, trim: true, maxlength: 50 },
    licenseIssueBy: { type: String, trim: true, maxlength: 100 },
    passportNo: { type: String, trim: true, uppercase: true, maxlength: 20 },
    issueCountry: { type: String, trim: true, maxlength: 100 },
    passportIssueDate: { type: Date },
    passportExpiryDate: { type: Date },
    visaType: { type: String, trim: true, maxlength: 50 },
    visaExpiryDate: { type: Date },
    voterId: { type: String, trim: true, maxlength: 20 },
    previousExperienceYear: { type: Number, min: 0, default: 0 },
    previousExperienceMonth: { type: Number, min: 0, max: 11, default: 0 },
    pfNumber: { type: String, trim: true, maxlength: 30 },
    pfDate: { type: Date },
    pfExitDate: { type: Date },
    universalAccNo: { type: String, trim: true, maxlength: 30 },
    aadhaarCardName: { type: String, trim: true, maxlength: 100 },
    virtualId: { type: String, trim: true, maxlength: 30 },
    panCardName: { type: String, trim: true, maxlength: 100 },
    esicNo: { type: String, trim: true, maxlength: 30 },
    esicDate: { type: Date },
    panAadhaarLinkingDec: { type: Boolean, default: false },
    empRemark: { type: String, trim: true, maxlength: 500 },
    totalWorkingPerDay: { type: Number, min: 0, default: 0 },
    noticePeriodDays: { type: Number, min: 0, default: 0 },
    tdsRegimeType: { type: String, enum: Object.values(TDSRegime), default: TDSRegime.NEW },
    tdsRegimeFileUrl: { type: String, trim: true },
    lwf: { type: String, trim: true, maxlength: 30 },
    serviceBookNo: { type: String, trim: true, maxlength: 30 },
    fuelRate: { type: Number, min: 0, default: 0 },
    markOfIdentification: { type: String, trim: true, maxlength: 200 },
    bondExpiryDate: { type: Date },
    educationLevel: { type: String, trim: true, maxlength: 100 },
    referredBy: { type: String, trim: true, maxlength: 100 },
    referredContactNo: { type: String, trim: true, maxlength: 20 },
    appointmentIssueDate: { type: Date },
    receiveDate: { type: Date },
    pranNps: { type: String, trim: true, maxlength: 30 },
    citizenNo: { type: String, trim: true, maxlength: 30 },
    currency: { type: String, trim: true, maxlength: 10 },
    employeeBankName: { type: String, trim: true, maxlength: 100 },
    employeeBankAccNo: { type: String, trim: true, maxlength: 30 },
    ifscCode: { type: String, trim: true, uppercase: true, maxlength: 20 },
    bankAccountHolderName: { type: String, trim: true, maxlength: 100 },
    employeeBankBranch: { type: String, trim: true, maxlength: 100 },
    bankFileUrl: { type: String, trim: true },
    employerBankName: { type: String, trim: true, maxlength: 100 },
    customEmployeeCode: { type: String, trim: true, maxlength: 30 },

    // Media
    photoUrl: { type: String, trim: true },
    signatureUrl: { type: String, trim: true },

    // Embedded tables
    relatives: [relativeSchema],
    education: [educationSchema],
    empRoles: [empRoleSchema],
    previousOrgs: [previousOrgSchema],
    branchHistory: [branchHistorySchema],
    leaveTemplate: [leaveTemplateSchema],
    bankHistory: [bankHistorySchema],
    additionalDocs: [additionalDocSchema],
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
