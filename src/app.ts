import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import { globalErrorHandler, AppError } from './middleware/errorHandler.js';
import { buildResponse, buildErrorResponse } from './shared/helpers.js';

// ─── Route imports ───────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import designationRoutes from './modules/designations/designation.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import leaveRoutes from './modules/leaves/leave.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import recruitmentRoutes from './modules/recruitment/recruitment.routes.js';
import performanceRoutes from './modules/performance/performance.routes.js';
import trainingRoutes from './modules/training/training.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import holidayRoutes from './modules/holidays/holiday.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import helpdeskRoutes from './modules/helpdesk/helpdesk.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import companyRoutes from './modules/companies/company.routes.js';
import invitationRoutes from './modules/invitations/invitation.routes.js';
import shiftRoutes from './modules/shifts/shift.routes.js';
import webhookRoutes from './modules/shifts/webhook.routes.js';
import { requireOnboardingComplete } from './middleware/onboardingGate.js';

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

let mongoConnectionPromise: Promise<void> | null = null;
const ensureMongoConnection = async (): Promise<void> => {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = connectDB().catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });
  }
  await mongoConnectionPromise;
};

void ensureMongoConnection();

// Ensure serverless functions wait for DB before processing requests.
app.use(async (_req, _res, next) => {
  try {
    await ensureMongoConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Request logging ─────────────────────────────────────────────────────────
if (config.server.nodeEnv !== 'test') {
  app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorResponse('Too many requests. Please try again later.'),
});
app.use('/api/', limiter);

// ─── Audit logger (logs all non-GET requests) ──────────────────────────────
import { auditLogger } from './middleware/auditLogger.js';
app.use(auditLogger);

// ─── API routes ──────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

// Health check
app.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.status(200).json(
    buildResponse(true, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
    }, 'Server is running'),
  );
});

// Webhook routes (no auth — called by Twilio)
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);

// Auth, invitation & onboarding routes (exempt from onboarding gate)
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/invitations`, invitationRoutes);

import onboardingRoutes from './modules/onboarding/onboarding.routes.js';
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);

// Onboarding gate — blocks users who haven't completed mandatory onboarding
app.use(`${API_PREFIX}`, requireOnboardingComplete);

// Module routes (protected by onboarding gate)
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/designations`, designationRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leaves`, leaveRoutes);
app.use(`${API_PREFIX}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/recruitment`, recruitmentRoutes);
app.use(`${API_PREFIX}/performance`, performanceRoutes);
app.use(`${API_PREFIX}/training`, trainingRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/holidays`, holidayRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/assets`, assetRoutes);
app.use(`${API_PREFIX}/helpdesk`, helpdeskRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/companies`, companyRoutes);
app.use(`${API_PREFIX}/shifts`, shiftRoutes);

import auditRoutes from './modules/audit/audit.routes.js';
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(globalErrorHandler);

export default app;
