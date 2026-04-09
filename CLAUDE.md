# ERP Backend - HR Management System API

## Overview
RESTful API for HR Management System built with Express.js 5, TypeScript, MongoDB (Mongoose), and JWT authentication. Provides 151 endpoints across 18 HR modules.

## Tech Stack
- **Runtime**: Node.js 20+ with TypeScript 5.8
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **File Upload**: Multer
- **Logging**: Morgan

## Project Structure
```
src/
  server.ts          # Entry point: connect DB, auto-seed admin, start server
  app.ts             # Express app: middleware, route mounting, error handling
  config/
    index.ts         # Environment config (MongoDB URI, JWT, CORS, etc.)
    database.ts      # MongoDB connection
  middleware/
    auth.ts          # JWT authenticate + role-based authorize
    errorHandler.ts  # AppError class, asyncHandler, globalErrorHandler
    validate.ts      # Zod validation middleware
  shared/
    types.ts         # Enums (UserRole, LeaveStatus, etc.), IApiResponse, IQueryParams
    helpers.ts       # buildResponse, buildPagination, generateEmployeeId
  types/
    express.d.ts     # Express Request augmentation (req.user)
  database/
    seed.ts          # Manual seed script (npm run db:seed)
    autoSeed.ts      # Auto-creates admin user on first startup
  modules/
    auth/            # User model + login/register/refresh/profile
    employees/       # EmployeeProfile model + CRUD + department/reportees
    departments/     # Department model + CRUD + tree hierarchy
    designations/    # Designation model + CRUD
    attendance/      # Attendance model + check-in/out + bulk mark + reports
    leaves/          # LeaveType + LeaveRequest + LeaveBalance + apply/approve/reject
    payroll/         # SalaryStructure + Payslip + generate/approve/markPaid
    recruitment/     # JobPosting + JobApplication + interview scheduling
    performance/     # PerformanceReview + Goal + ratings + submit workflow
    training/        # TrainingProgram + enroll/complete/drop
    documents/       # Document model + upload/download
    holidays/        # Holiday model + by year/upcoming
    announcements/   # Announcement + readBy tracking + active
    expenses/        # Expense + submit/approve/reject/reimburse workflow
    assets/          # Asset + assign/return + history tracking
    helpdesk/        # Ticket + comments + status workflow
    reports/         # 8 aggregation reports (employee, attendance, leave, payroll, etc.)
    dashboard/       # Stats, attendance overview, dept distribution, activities
```

## Module Pattern
Each module has 4-5 files:
- `*.model.ts` - Mongoose schema + TypeScript interface + enums
- `*.service.ts` - Business logic (static methods)
- `*.controller.ts` - Request handlers (asyncHandler wrapped)
- `*.validator.ts` - Zod schemas for request body validation
- `*.routes.ts` - Express Router with auth/validate middleware

## Authentication & Authorization
- **JWT tokens**: accessToken (7d) + refreshToken (30d)
- **Roles**: `super_admin`, `admin`, `hr_manager`, `manager`, `employee`
- **Middleware**: `authenticate` (verify JWT) → `authorize(...roles)` (check role)
- **Password**: bcrypt with 12 salt rounds
- All routes use `authenticate`, write operations also use `authorize`

## API Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Enums
ALL enum values are **lowercase snake_case**:
- UserRole: `super_admin`, `admin`, `hr_manager`, `manager`, `employee`
- AttendanceStatus: `present`, `absent`, `half_day`, `late`, `on_leave`, `work_from_home`
- LeaveStatus: `pending`, `approved`, `rejected`, `cancelled`
- PayslipStatus: `draft`, `generated`, `approved`, `paid`
- And more in `shared/types.ts` and individual model files

## Commands
```bash
npm run dev        # Start dev server with tsx watch (port 5000)
npm run build      # Compile TypeScript
npm run start      # Run compiled code
npm run db:seed    # Manually seed admin user
npm run db:studio  # Prisma studio (N/A - using Mongoose)
```

## Default Admin User
Auto-created on first startup when database is empty:
- Email: `admin@sheeraj.com`
- Password: `Admin@123`
- Role: `super_admin`

## Environment Variables (.env)
```
MONGODB_URI=mongodb://localhost:27017/erp_hr
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## Important Notes
- `validate()` middleware calls `schema.parse(req.body ?? {})` - handles empty body
- POST/PUT with optional-only fields accept `{}` as valid body
- Mongoose `toJSON` transforms remove `__v` and rename `_id` to `id`
- Error handling: AppError for operational errors, global handler for uncaught
- All dates stored as UTC, enum values as lowercase strings
- File uploads go to `./uploads/` directory (gitignored)
