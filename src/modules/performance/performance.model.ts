import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ReviewType {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  HALF_YEARLY = 'HalfYearly',
  ANNUAL = 'Annual',
  PROBATION = 'Probation',
}

export enum OverallRating {
  OUTSTANDING = 'Outstanding',
  EXCEEDS_EXPECTATIONS = 'ExceedsExpectations',
  MEETS_EXPECTATIONS = 'MeetsExpectations',
  NEEDS_IMPROVEMENT = 'NeedsImprovement',
  UNSATISFACTORY = 'Unsatisfactory',
}

export enum ReviewStatus {
  DRAFT = 'Draft',
  SELF_REVIEW = 'SelfReview',
  MANAGER_REVIEW = 'ManagerReview',
  HR_REVIEW = 'HRReview',
  COMPLETED = 'Completed',
}

export enum GoalCategory {
  PERFORMANCE = 'Performance',
  LEARNING = 'Learning',
  PROJECT = 'Project',
  BEHAVIORAL = 'Behavioral',
}

export enum GoalPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum GoalStatus {
  NOT_STARTED = 'NotStarted',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  DEFERRED = 'Deferred',
  CANCELLED = 'Cancelled',
}

// ─── PerformanceReview Interface ────────────────────────────────────────────

export interface IReviewGoal {
  title: string;
  description?: string;
  weightage: number;
  selfRating?: number;
  managerRating?: number;
  comments?: string;
}

export interface IReviewPeriod {
  startDate: Date;
  endDate: Date;
}

export interface IPerformanceReview extends Document {
  employee: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewPeriod: IReviewPeriod;
  type: ReviewType;
  overallRating?: OverallRating;
  goals: IReviewGoal[];
  strengths: string[];
  areasOfImprovement: string[];
  employeeComments?: string;
  managerComments?: string;
  hrComments?: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── PerformanceReview Sub-Schemas ──────────────────────────────────────────

const reviewPeriodSchema = new Schema<IReviewPeriod>(
  {
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
  },
  { _id: false },
);

const reviewGoalSchema = new Schema<IReviewGoal>(
  {
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    weightage: {
      type: Number,
      required: [true, 'Weightage is required'],
      min: [0, 'Weightage cannot be negative'],
      max: [100, 'Weightage cannot exceed 100'],
    },
    selfRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    managerRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters'],
    },
  },
  { _id: true },
);

// ─── PerformanceReview Schema ───────────────────────────────────────────────

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    reviewPeriod: {
      type: reviewPeriodSchema,
      required: [true, 'Review period is required'],
    },
    type: {
      type: String,
      enum: Object.values(ReviewType),
      required: [true, 'Review type is required'],
    },
    overallRating: {
      type: String,
      enum: Object.values(OverallRating),
    },
    goals: [reviewGoalSchema],
    strengths: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    areasOfImprovement: [
      {
        type: String,
        trim: true,
        maxlength: 200,
      },
    ],
    employeeComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Employee comments cannot exceed 2000 characters'],
    },
    managerComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Manager comments cannot exceed 2000 characters'],
    },
    hrComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'HR comments cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.DRAFT,
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

// ─── PerformanceReview Indexes ──────────────────────────────────────────────

performanceReviewSchema.index({ employee: 1, type: 1 });
performanceReviewSchema.index({ reviewer: 1, status: 1 });
performanceReviewSchema.index({ status: 1 });
performanceReviewSchema.index({ employee: 1, 'reviewPeriod.startDate': 1 });

// ─── Goal Interface ─────────────────────────────────────────────────────────

export interface IGoal extends Document {
  employee: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  progress: number;
  status: GoalStatus;
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Goal Schema ────────────────────────────────────────────────────────────

const goalSchema = new Schema<IGoal>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(GoalCategory),
      required: [true, 'Goal category is required'],
    },
    priority: {
      type: String,
      enum: Object.values(GoalPriority),
      default: GoalPriority.MEDIUM,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
    status: {
      type: String,
      enum: Object.values(GoalStatus),
      default: GoalStatus.NOT_STARTED,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by is required'],
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

// ─── Goal Indexes ───────────────────────────────────────────────────────────

goalSchema.index({ employee: 1, status: 1 });
goalSchema.index({ assignedBy: 1 });
goalSchema.index({ dueDate: 1 });
goalSchema.index({ category: 1 });
goalSchema.index({ title: 'text', description: 'text' });

// ─── Models ─────────────────────────────────────────────────────────────────

const PerformanceReview: Model<IPerformanceReview> = mongoose.model<IPerformanceReview>(
  'PerformanceReview',
  performanceReviewSchema,
);

const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', goalSchema);

export { PerformanceReview, Goal };
