import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;          // 'create' | 'update' | 'delete' | 'login' | 'register' | 'invite' | etc.
  module: string;          // 'employees' | 'departments' | 'auth' | 'payroll' | etc.
  description: string;     // Human-readable: "Created department Engineering"
  method: string;          // HTTP method: POST, PUT, PATCH, DELETE
  path: string;            // API path: /api/v1/departments
  statusCode: number;      // Response status code
  user?: mongoose.Types.ObjectId;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  company?: mongoose.Types.ObjectId;
  targetId?: string;       // ID of the affected resource
  ip?: string;
  userAgent?: string;
  requestBody?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    description: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: String,
    userEmail: String,
    userRole: String,
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    targetId: String,
    ip: String,
    userAgent: String,
    requestBody: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        // Strip sensitive fields from requestBody
        if (ret.requestBody) {
          delete ret.requestBody.password;
          delete ret.requestBody.oldPassword;
          delete ret.requestBody.newPassword;
          delete ret.requestBody.confirmPassword;
        }
        return ret;
      },
    },
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ company: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
