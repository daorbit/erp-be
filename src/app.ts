import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { globalErrorHandler, AppError } from './middleware/errorHandler.js';
import { buildResponse, buildErrorResponse } from './shared/helpers.js';

// ─── Route imports ───────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import designationRoutes from './modules/designations/designation.routes.js';
import recruitmentRoutes from './modules/recruitment/recruitment.routes.js';

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

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

// Module routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/designations`, designationRoutes);
app.use(`${API_PREFIX}/recruitment`, recruitmentRoutes);

// Placeholder routes for future modules — uncomment as they are implemented
// app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
// app.use(`${API_PREFIX}/leaves`, leaveRoutes);
// app.use(`${API_PREFIX}/payroll`, payrollRoutes);
// app.use(`${API_PREFIX}/performance`, performanceRoutes);
// app.use(`${API_PREFIX}/training`, trainingRoutes);
// app.use(`${API_PREFIX}/documents`, documentRoutes);
// app.use(`${API_PREFIX}/holidays`, holidayRoutes);
// app.use(`${API_PREFIX}/announcements`, announcementRoutes);
// app.use(`${API_PREFIX}/expenses`, expenseRoutes);
// app.use(`${API_PREFIX}/assets`, assetRoutes);
// app.use(`${API_PREFIX}/helpdesk`, helpdeskRoutes);
// app.use(`${API_PREFIX}/reports`, reportRoutes);
// app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(globalErrorHandler);

export default app;
