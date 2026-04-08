import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum JobPostingStatus {
  DRAFT = 'Draft',
  OPEN = 'Open',
  ON_HOLD = 'OnHold',
  CLOSED = 'Closed',
  FILLED = 'Filled',
}

export enum JobEmploymentType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CONTRACT = 'Contract',
  INTERN = 'Intern',
  FREELANCER = 'Freelancer',
}

export enum ApplicationStatus {
  APPLIED = 'Applied',
  SCREENING = 'Screening',
  SHORTLISTED = 'Shortlisted',
  INTERVIEW_SCHEDULED = 'InterviewScheduled',
  INTERVIEWED = 'Interviewed',
  SELECTED = 'Selected',
  REJECTED = 'Rejected',
  OFFERED = 'Offered',
  HIRED = 'Hired',
  WITHDRAWN = 'Withdrawn',
}

// ─── JobPosting Interface ───────────────────────────────────────────────────

export interface IExperienceRange {
  min: number;
  max: number;
}

export interface ISalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface IJobPosting extends Document {
  title: string;
  description: string;
  department: mongoose.Types.ObjectId;
  designation?: mongoose.Types.ObjectId;
  location: string;
  employmentType: JobEmploymentType;
  experience: IExperienceRange;
  salary?: ISalaryRange;
  skills: string[];
  qualifications: string[];
  vacancies: number;
  status: JobPostingStatus;
  postedBy: mongoose.Types.ObjectId;
  applicationDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── JobPosting Schema ──────────────────────────────────────────────────────

const experienceRangeSchema = new Schema<IExperienceRange>(
  {
    min: { type: Number, min: 0, default: 0 },
    max: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const salaryRangeSchema = new Schema<ISalaryRange>(
  {
    min: { type: Number, min: 0, default: 0 },
    max: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'INR', trim: true, maxlength: 5 },
  },
  { _id: false },
);

const jobPostingSchema = new Schema<IJobPosting>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    employmentType: {
      type: String,
      enum: Object.values(JobEmploymentType),
      default: JobEmploymentType.FULL_TIME,
    },
    experience: {
      type: experienceRangeSchema,
      required: [true, 'Experience range is required'],
    },
    salary: salaryRangeSchema,
    skills: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],
    qualifications: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    vacancies: {
      type: Number,
      required: [true, 'Number of vacancies is required'],
      min: [1, 'Must have at least 1 vacancy'],
    },
    status: {
      type: String,
      enum: Object.values(JobPostingStatus),
      default: JobPostingStatus.DRAFT,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by is required'],
    },
    applicationDeadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── JobPosting Indexes ─────────────────────────────────────────────────────

jobPostingSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ department: 1 });
jobPostingSchema.index({ employmentType: 1 });
jobPostingSchema.index({ applicationDeadline: 1 });

// ─── JobApplication Interface ───────────────────────────────────────────────

export interface IJobApplication extends Document {
  jobPosting: mongoose.Types.ObjectId;
  candidateName: string;
  email: string;
  phone: string;
  resume?: string;
  coverLetter?: string;
  experience?: number;
  currentSalary?: number;
  expectedSalary?: number;
  skills: string[];
  status: ApplicationStatus;
  interviewDate?: Date;
  interviewNotes?: string;
  interviewers: mongoose.Types.ObjectId[];
  rating?: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── JobApplication Schema ──────────────────────────────────────────────────

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    jobPosting: {
      type: Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: [true, 'Job posting is required'],
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      maxlength: [100, 'Candidate name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    resume: {
      type: String,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
    },
    currentSalary: {
      type: Number,
      min: [0, 'Current salary cannot be negative'],
    },
    expectedSalary: {
      type: Number,
      min: [0, 'Expected salary cannot be negative'],
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: 100,
      },
    ],
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.APPLIED,
    },
    interviewDate: {
      type: Date,
    },
    interviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Interview notes cannot exceed 2000 characters'],
    },
    interviewers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [2000, 'Remarks cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ─── JobApplication Indexes ─────────────────────────────────────────────────

jobApplicationSchema.index({ jobPosting: 1, status: 1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ candidateName: 'text', email: 'text', skills: 'text' });

// ─── Models ─────────────────────────────────────────────────────────────────

const JobPosting: Model<IJobPosting> = mongoose.model<IJobPosting>(
  'JobPosting',
  jobPostingSchema,
);

const JobApplication: Model<IJobApplication> = mongoose.model<IJobApplication>(
  'JobApplication',
  jobApplicationSchema,
);

export { JobPosting, JobApplication };
