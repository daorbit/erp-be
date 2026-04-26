import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AuditService } from './audit.service.js';

export class AuditController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    // Login Log's "Order by" radio maps onto sortBy / sortOrder. The
    // user-name / employee-name / unique-ip cases need post-fetch handling
    // (Mongo can't sort by a populated field cheaply); the service handles them.
    const orderBy = req.query.orderBy as string | undefined;
    let sortBy = (req.query.sortBy as string) || 'createdAt';
    let sortOrder: 'asc' | 'desc' = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    if (orderBy === 'first_login') { sortBy = 'createdAt'; sortOrder = 'asc'; }

    // Comma-separated lists used by reports.
    const siteIds = typeof req.query.siteIds === 'string' && req.query.siteIds.length > 0
      ? req.query.siteIds.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
      search: req.query.search as string,
      sortBy,
      sortOrder,
      filters: {
        module: req.query.module as string,
        action: req.query.action as string,
        // `userRole` matches the UserRole enum already stored on the audit log
        // record. `userType` matches the User.userType field — the service
        // resolves it to the matching user ids and filters by `user`. The
        // Login Log dropdown sends `userType`; older callers may still send
        // `userRole`. Both are honoured.
        userRole: req.query.userRole as string,
        userType: req.query.userType as string,
        // ?user= or ?userId= — used by Login Log + Idle User Report.
        user: (req.query.user as string) || (req.query.userId as string),
        // Date-range filters on createdAt — sent as ISO strings.
        from: req.query.from as string,
        to: req.query.to as string,
        siteIds,
        orderBy,
      } as any,
    };

    // Platform admin sees all, company admin sees only their company
    const result = await AuditService.getAll(query, req.user.company);

    res.status(200).json(
      buildResponse(true, result.data, 'Audit logs retrieved', result.pagination),
    );
  });
}
