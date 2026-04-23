# ERP Backend - HR Management System API

## Overview
RESTful API for an HR Management System built with Express.js 5, TypeScript, MongoDB (Mongoose), and JWT authentication. Multi-tenant (company-scoped) architecture with 41 modules.

## Tech Stack
- **Runtime**: Node.js 20+ with TypeScript 5.8
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **File Upload**: Multer + Cloudinary (`config/cloudinary.ts`)
- **Logging**: Morgan + custom audit logger middleware
- **Messaging**: WhatsApp service (`services/whatsapp.service.ts`)

## Project Structure
```
src/
  server.ts              # Entry point: connect DB, auto-seed admin, start server
  app.ts                 # Express app: middleware, all route mounting, error handling
  config/
    index.ts             # Environment config (MongoDB URI, JWT, CORS, Cloudinary, etc.)
    database.ts          # MongoDB connection with lazy/singleton pattern for serverless
    cloudinary.ts        # Cloudinary upload config
  middleware/
    auth.ts              # authenticate (JWT verify + DB check) + authorize (role check)
    companyScope.ts      # requireCompany — ensures non-super_admin have a company
    onboardingGate.ts    # requireOnboardingComplete — blocks incomplete onboarding
    auditLogger.ts       # Logs all non-GET requests to audit collection
    errorHandler.ts      # AppError class, asyncHandler, globalErrorHandler
    validate.ts          # Zod validation middleware
    upload.ts            # Multer file upload middleware
  shared/
    types.ts             # IApiResponse, IQueryParams, IPagination interfaces
    helpers.ts           # buildResponse, buildErrorResponse, buildPagination, generateEmployeeId
  types/
    express.d.ts         # Express Request augmentation (req.user)
  services/
    whatsapp.service.ts  # WhatsApp messaging integration
  database/
    seed.ts              # Manual seed script (npm run db:seed)
    autoSeed.ts          # Auto-creates super_admin user on first startup
    migrateCompany.ts    # Migration helper for company data
    syncSchemaIndexes.ts # Sync MongoDB schema indexes
  modules/               # 41 feature modules (see full list below)
```

## All Modules (`src/modules/`)
| Module | Route prefix | Description |
|---|---|---|
| `auth` | `/auth` | User model, login/register/refresh/profile |
| `companies` | `/companies` | Multi-tenant company management |
| `onboarding` | `/onboarding` | KYC onboarding (exempt from gate) |
| `invitations` | `/invitations` | Invite users by email |
| `upload` | `/upload` | File upload (Cloudinary) |
| `employees` | `/employees` | Employee profiles, CRUD, documents |
| `departments` | `/departments` | Department tree hierarchy |
| `parent-departments` | `/parent-departments` | Top-level department grouping |
| `designations` | `/designations` | Designation CRUD + merge + employee count |
| `employee-groups` | `/employee-groups` | Employee group management |
| `shifts` | `/shifts` | Shift master + webhook routes |
| `branches` | `/branches` | Branch CRUD |
| `salary-heads` | `/salary-heads` | Salary head definitions |
| `salary-structures` | `/salary-structures` | Salary structure + assign heads |
| `qualifications` | `/qualifications` | Qualification list |
| `document-masters` | `/document-masters` | Document type definitions |
| `tags` | `/tags` | Tag management |
| `levels` | `/levels` | Level (seniority) master |
| `grades` | `/grades` | Grade master |
| `banks` | `/banks` | Bank master |
| `cities` | `/cities` | City master |
| `important-forms` | `/important-forms` | Important form links |
| `sims` | `/sims` | SIM card tracking |
| `other-incomes` | `/other-incomes` | Other income types |
| `att-upload-sites` | `/att-upload-sites` | Attendance upload site config |
| `att-auto-notifications` | `/att-auto-notifications` | Attendance auto-mail/SMS rules |
| `resignations` | `/resignations` | Employee resignation management |
| `user-rights` | `/user-rights` | User permission management |
| `day-authorizations` | `/day-authorizations` | Day-level authorization |
| `tds-exemption-groups` | `/tds-groups` | TDS exemption group master |
| `tds-exemptions` | `/tds-exemptions` | TDS exemption records |
| `sms-email-alerts` | `/sms-email-alerts` | SMS/email alert configuration |
| `image-galleries` | `/image-galleries` | Image gallery management |
| `manage-messages` | `/manage-messages` | Message management |
| `attendance` | `/attendance` | Attendance records, check-in/out, reports |
| `payroll` | `/payroll` | Payroll generation and payslip management |
| `recruitment` | `/recruitment` | Job postings + applications |
| `reports` | `/reports` | Aggregation reports |
| `dashboard` | `/dashboard` | Stats, overview, dept distribution |
| `audit` | `/audit-logs` | Audit log viewer |

## Module Pattern
Each module typically has 4–5 files:
- `*.model.ts` — Mongoose schema + TypeScript interface + enums
- `*.service.ts` — Business logic (static methods or plain functions)
- `*.controller.ts` — Request handlers wrapped in `asyncHandler`
- `*.validator.ts` — Zod schemas for request body validation
- `*.routes.ts` — Express Router with `authenticate`/`authorize`/`validate` middleware

## Authentication & Authorization
- **JWT tokens**: accessToken (7d) + refreshToken (30d)
- **Roles**: `super_admin`, `admin`, `hr_manager`, `manager`, `employee`
- **Middleware chain**: `authenticate` → `requireCompany` → `requireOnboardingComplete` → `authorize(...roles)`
- **Password**: bcrypt with 12 salt rounds
- Routes exempt from onboarding gate: `/auth`, `/invitations`, `/upload`, `/onboarding`, `/webhooks`

## Multi-Tenancy
- Each user (except `super_admin`) belongs to a `company` (ObjectId ref)
- `requireCompany` middleware enforces this association
- All module queries are scoped to `req.user.company`
- `super_admin` can manage all companies

## API Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
```
Use `buildResponse` / `buildErrorResponse` from `shared/helpers.ts`.

## Enums
ALL enum values are **lowercase snake_case** (defined in individual model files):
- UserRole: `super_admin`, `admin`, `hr_manager`, `manager`, `employee`
- AttendanceStatus: `present`, `absent`, `half_day`, `late`, `on_leave`, `work_from_home`

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
