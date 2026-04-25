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
import payrollRoutes from './modules/payroll/payroll.routes.js';
import recruitmentRoutes from './modules/recruitment/recruitment.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import companyRoutes from './modules/companies/company.routes.js';
import invitationRoutes from './modules/invitations/invitation.routes.js';
import shiftRoutes from './modules/shifts/shift.routes.js';
import branchRoutes from './modules/branches/branch.routes.js';
import webhookRoutes from './modules/shifts/webhook.routes.js';
import parentDepartmentRoutes from './modules/parent-departments/parentDepartment.routes.js';
import employeeGroupRoutes from './modules/employee-groups/employeeGroup.routes.js';
import salaryHeadRoutes from './modules/salary-heads/salaryHead.routes.js';
import salaryStructureRoutes from './modules/salary-structures/salaryStructure.routes.js';
import qualificationRoutes from './modules/qualifications/qualification.routes.js';
import documentMasterRoutes from './modules/document-masters/documentMaster.routes.js';
import tagRoutes from './modules/tags/tag.routes.js';
import levelRoutes from './modules/levels/level.routes.js';
import gradeRoutes from './modules/grades/grade.routes.js';
import bankRoutes from './modules/banks/bank.routes.js';
import cityRoutes from './modules/cities/city.routes.js';
import importantFormRoutes from './modules/important-forms/importantForm.routes.js';
import simRoutes from './modules/sims/sim.routes.js';
import otherIncomeRoutes from './modules/other-incomes/otherIncome.routes.js';

import attUploadSiteRoutes from './modules/att-upload-sites/attUploadSite.routes.js';
import attAutoNotificationRoutes from './modules/att-auto-notifications/attAutoNotification.routes.js';
import resignationRoutes from './modules/resignations/resignation.routes.js';
import userRightRoutes from './modules/user-rights/userRight.routes.js';
import dayAuthorizationRoutes from './modules/day-authorizations/dayAuthorization.routes.js';

import tdsGroupRoutes from './modules/tds-exemption-groups/tdsGroup.routes.js';
import tdsExemptionRoutes from './modules/tds-exemptions/tdsExemption.routes.js';
import smsEmailAlertRoutes from './modules/sms-email-alerts/smsEmailAlert.routes.js';
import imageGalleryRoutes from './modules/image-galleries/imageGallery.routes.js';
import manageMessageRoutes from './modules/manage-messages/manageMessage.routes.js';
import locationRoutes from './modules/locations/location.routes.js';
import stateRoutes from './modules/states/state.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
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

// Auth, invitation, upload & onboarding routes (exempt from onboarding gate)
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/invitations`, invitationRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);

import onboardingRoutes from './modules/onboarding/onboarding.routes.js';
app.use(`${API_PREFIX}/onboarding`, onboardingRoutes);

// Onboarding gate — blocks users who haven't completed mandatory onboarding
app.use(`${API_PREFIX}`, requireOnboardingComplete);

// Module routes (protected by onboarding gate)
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/designations`, designationRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/recruitment`, recruitmentRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/companies`, companyRoutes);
app.use(`${API_PREFIX}/shifts`, shiftRoutes);
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/parent-departments`, parentDepartmentRoutes);
app.use(`${API_PREFIX}/employee-groups`, employeeGroupRoutes);
app.use(`${API_PREFIX}/salary-heads`, salaryHeadRoutes);
app.use(`${API_PREFIX}/salary-structures`, salaryStructureRoutes);
app.use(`${API_PREFIX}/qualifications`, qualificationRoutes);
app.use(`${API_PREFIX}/document-masters`, documentMasterRoutes);
app.use(`${API_PREFIX}/tags`, tagRoutes);
app.use(`${API_PREFIX}/levels`, levelRoutes);
app.use(`${API_PREFIX}/grades`, gradeRoutes);
app.use(`${API_PREFIX}/banks`, bankRoutes);
app.use(`${API_PREFIX}/cities`, cityRoutes);
app.use(`${API_PREFIX}/important-forms`, importantFormRoutes);
app.use(`${API_PREFIX}/sims`, simRoutes);
app.use(`${API_PREFIX}/other-incomes`, otherIncomeRoutes);

app.use(`${API_PREFIX}/att-upload-sites`, attUploadSiteRoutes);
app.use(`${API_PREFIX}/att-auto-notifications`, attAutoNotificationRoutes);
app.use(`${API_PREFIX}/resignations`, resignationRoutes);
app.use(`${API_PREFIX}/user-rights`, userRightRoutes);
app.use(`${API_PREFIX}/day-authorizations`, dayAuthorizationRoutes);

app.use(`${API_PREFIX}/tds-groups`, tdsGroupRoutes);
app.use(`${API_PREFIX}/tds-exemptions`, tdsExemptionRoutes);
app.use(`${API_PREFIX}/sms-email-alerts`, smsEmailAlertRoutes);
app.use(`${API_PREFIX}/image-galleries`, imageGalleryRoutes);
app.use(`${API_PREFIX}/manage-messages`, manageMessageRoutes);
app.use(`${API_PREFIX}/locations`, locationRoutes);
app.use(`${API_PREFIX}/states`, stateRoutes);

import auditRoutes from './modules/audit/audit.routes.js';
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(globalErrorHandler);

export default app;
