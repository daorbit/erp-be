import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AuditService } from './audit.service.js';

export class AuditController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        module: req.query.module as string,
        action: req.query.action as string,
        userRole: req.query.userRole as string,
      },
    };

    // Platform admin sees all, company admin sees only their company
    const result = await AuditService.getAll(query, req.user.company);

    res.status(200).json(
      buildResponse(true, result.data, 'Audit logs retrieved', result.pagination),
    );
  });
}
