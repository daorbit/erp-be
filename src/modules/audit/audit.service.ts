import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import AuditLog, { type IAuditLog } from './audit.model.js';

interface PaginatedResult {
  data: IAuditLog[];
  pagination: ReturnType<typeof buildPagination>;
}

export class AuditService {
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult> {
    const {
      page = 1,
      limit = 25,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.module) filter.module = filters.module;
    if (filters.action) filter.action = filters.action;
    if (filters.userRole) filter.userRole = filters.userRole;

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      data: logs as any as IAuditLog[],
      pagination: buildPagination(page, limit, total),
    };
  }
}
