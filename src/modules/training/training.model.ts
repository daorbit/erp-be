import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum TrainingCategory {
  TECHNICAL = 'technical',
  SOFT_SKILLS = 'soft_skills',
  COMPLIANCE = 'compliance',
  LEADERSHIP = 'leadership',
  SAFETY = 'safety',
  OTHER = 'other',
}

export enum TrainerType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum TrainingMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  HYBRID = 'hybrid',
}

export enum TrainingStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ParticipantStatus {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

// ─── Sub-Interfaces ─────────────────────────────────────────────────────────

export interface IParticipant {
  employee: mongoose.Types.ObjectId;
  status: ParticipantStatus;
  completedAt?: Date;
  score?: number;
  certificate?: string;
}

export interface ITrainingMaterial {
  name: string;
  fileUrl: string;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ITrainingProgram extends Document {
  title: string;
  company: mongoose.Types.ObjectId;
  description?: string;
  category: TrainingCategory;
  trainer?: string;
  trainerType: TrainerType;
  startDate: Date;
  endDate: Date;
  duration?: string;
  location?: string;
  mode: TrainingMode;
  maxParticipants?: number;
  participants: IParticipant[];
  materials: ITrainingMaterial[];
  cost?: number;
  status: TrainingStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ────────────────────────────────────────────────────────────

const participantSchema = new Schema<IParticipant>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    status: {
      type: String,
      enum: Object.values(ParticipantStatus),
      default: ParticipantStatus.ENROLLED,
    },
    completedAt: {
      type: Date,
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    certificate: {
      type: String,
    },
  },
  { _id: true },
);

const trainingMaterialSchema = new Schema<ITrainingMaterial>(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
  },
  { _id: true },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(TrainingCategory),
      required: [true, 'Category is required'],
    },
    trainer: {
      type: String,
      trim: true,
      maxlength: [100, 'Trainer name cannot exceed 100 characters'],
    },
    trainerType: {
      type: String,
      enum: Object.values(TrainerType),
      default: TrainerType.INTERNAL,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [50, 'Duration cannot exceed 50 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    mode: {
      type: String,
      enum: Object.values(TrainingMode),
      default: TrainingMode.OFFLINE,
    },
    maxParticipants: {
      type: Number,
      min: [1, 'Must have at least 1 participant slot'],
    },
    participants: [participantSchema],
    materials: [trainingMaterialSchema],
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(TrainingStatus),
      default: TrainingStatus.PLANNED,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
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

trainingProgramSchema.index({ title: 'text', description: 'text' });
trainingProgramSchema.index({ category: 1 });
trainingProgramSchema.index({ status: 1 });
trainingProgramSchema.index({ startDate: 1, endDate: 1 });
trainingProgramSchema.index({ 'participants.employee': 1 });
trainingProgramSchema.index({ createdBy: 1 });

// ─── Validation ─────────────────────────────────────────────────────────────

trainingProgramSchema.pre<ITrainingProgram>('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after the start date');
  }
  next();
});

// ─── Model ───────────────────────────────────────────────────────────────────

const TrainingProgram: Model<ITrainingProgram> = mongoose.model<ITrainingProgram>(
  'TrainingProgram',
  trainingProgramSchema,
);

export default TrainingProgram;
