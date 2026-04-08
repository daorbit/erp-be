import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum TicketCategory {
  IT = 'IT',
  HR = 'HR',
  FINANCE = 'Finance',
  ADMIN = 'Admin',
  FACILITIES = 'Facilities',
  OTHER = 'Other',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'InProgress',
  ON_HOLD = 'OnHold',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  REOPENED = 'Reopened',
}

// ─── Sub-Interfaces ─────────────────────────────────────────────────────────

export interface ICommentAttachment {
  name: string;
  fileUrl: string;
}

export interface ITicketComment {
  user: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  attachments: ICommentAttachment[];
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ITicket extends Document {
  ticketNumber: string;
  employee: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  comments: ITicketComment[];
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  satisfaction?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ────────────────────────────────────────────────────────────

const commentAttachmentSchema = new Schema<ICommentAttachment>(
  {
    name: {
      type: String,
      required: [true, 'Attachment name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
  },
  { _id: false },
);

const ticketCommentSchema = new Schema<ITicketComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    attachments: [commentAttachmentSchema],
  },
  { _id: true },
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: [true, 'Ticket number is required'],
      trim: true,
      match: [/^TKT-\d{4}-\d{3,}$/, 'Ticket number must follow the format TKT-YYYY-NNN'],
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [3000, 'Resolution cannot exceed 3000 characters'],
    },
    comments: [ticketCommentSchema],
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    satisfaction: {
      type: Number,
      min: [1, 'Satisfaction must be at least 1'],
      max: [5, 'Satisfaction cannot exceed 5'],
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

ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ subject: 'text', description: 'text' });
ticketSchema.index({ employee: 1, status: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket;
