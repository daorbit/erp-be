import type { Request, Response, NextFunction } from 'express';
import AuditLog from '../modules/audit/audit.model.js';

// Map HTTP methods to action verbs
const methodActionMap: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// Extract module name from path: /api/v1/employees/xxx → employees
function extractModule(path: string): string {
  const match = path.match(/\/api\/v1\/([a-z-]+)/);
  return match?.[1] || 'unknown';
}

// Extract target ID from path: /api/v1/employees/abc123 → abc123
function extractTargetId(path: string): string | undefined {
  const parts = path.split('/').filter(Boolean);
  // Find the segment after the module name that looks like an ID
  const moduleIdx = parts.findIndex((p) => p === 'v1') + 2;
  const candidate = parts[moduleIdx];
  if (candidate && /^[a-f0-9]{24}$/.test(candidate)) return candidate;
  return undefined;
}

// Build a human-readable description
function buildDescription(method: string, module: string, path: string): string {
  const action = methodActionMap[method] || method.toLowerCase();
  const moduleName = module.replace(/-/g, ' ');

  // Special cases
  if (path.includes('/toggle-status')) return `Toggled user active status`;
  if (path.includes('/onboarding')) return `${action}d onboarding data`;
  if (path.includes('/review')) return `Reviewed onboarding`;
  if (path.includes('/accept')) return `Accepted invitation`;
  if (path.includes('/register')) return `Registered a new user`;
  if (path.includes('/login')) return `User logged in`;
  if (path.includes('/invite')) return `Created an invitation`;
  if (path.includes('/step/')) return `Saved onboarding step`;

  return `${action.charAt(0).toUpperCase() + action.slice(1)}d ${moduleName} record`;
}

/**
 * Audit logger middleware.
 * Logs all non-GET requests after the response is sent.
 * Must be placed BEFORE route handlers (app-level).
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip GET/OPTIONS/HEAD — only log mutating actions
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    next();
    return;
  }

  // Capture the original end to hook into the response
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: any[]) {
    // Restore original
    res.end = originalEnd;
    const result = res.end.apply(this, args as any);

    // Log asynchronously — don't block the response
    const module = extractModule(req.originalUrl);
    // Map well-known auth paths to dedicated action verbs so filters like
    // ?action=login work; otherwise fall back to the HTTP method mapping.
    const path = req.originalUrl;
    let action: string;
    if (path.includes('/auth/login')) action = 'login';
    else if (path.includes('/auth/logout')) action = 'logout';
    else if (path.includes('/auth/register')) action = 'register';
    else if (path.includes('/auth/refresh-token')) action = 'refresh';
    else if (path.includes('/invitations/accept')) action = 'invite_accept';
    else if (path.includes('/invitations')) action = 'invite';
    else action = methodActionMap[req.method] || req.method.toLowerCase();

    // Strip sensitive data from body
    const sanitizedBody = req.body ? { ...req.body } : undefined;
    if (sanitizedBody) {
      delete sanitizedBody.password;
      delete sanitizedBody.oldPassword;
      delete sanitizedBody.newPassword;
      delete sanitizedBody.confirmPassword;
      delete sanitizedBody.refreshToken;
    }

    AuditLog.create({
      action,
      module,
      description: buildDescription(req.method, module, req.originalUrl),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      user: req.user?.id || undefined,
      userName: req.user?.email || undefined,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      company: req.user?.company || undefined,
      targetId: extractTargetId(req.originalUrl),
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestBody: sanitizedBody,
    }).catch(() => {
      // Silent — never block requests for audit failures
    });

    return result;
  } as any;

  next();
}
