import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import AuditLog, { type IAuditLog } from './audit.model.js';
import User from '../auth/auth.model.js';

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

    const f = filters as Record<string, any>;

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
    if (f.user) filter.user = f.user;

    // Date range on createdAt — used by Login Log's From/To pickers.
    const from = f.from as string | undefined;
    const to = f.to as string | undefined;
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      filter.createdAt = dateFilter;
    }

    // Site Name + User Type both have to be resolved through the User
    // collection because the audit log doesn't carry a branch ref or a
    // userType column. We build a single User query that matches every
    // constraint and use the resulting ids to restrict the audit query.
    const siteIds: string[] | undefined = Array.isArray(f.siteIds) ? f.siteIds : undefined;
    const userType = f.userType as string | undefined;
    if ((siteIds && siteIds.length > 0) || userType) {
      const userMatch: Record<string, unknown> = {};
      if (companyId) userMatch.company = companyId;
      if (userType) userMatch.userType = userType;
      if (siteIds && siteIds.length > 0) {
        userMatch.$or = [
          { branch: { $in: siteIds } },
          { allowedSites: { $in: siteIds } },
          { allowedBranches: { $in: siteIds } },
        ];
      }
      const matchedUsers = await User.find(userMatch).select('_id').lean();
      const userIdList = matchedUsers.map((u) => u._id);
      if (userIdList.length === 0) {
        // No user matches the resolved filters — short-circuit with an empty page.
        return {
          data: [],
          pagination: buildPagination(page, limit, 0),
        };
      }
      // If a single-user filter was already applied, intersect; otherwise
      // restrict to the resolved set.
      if (filter.user) {
        filter.user = userIdList.find((id) => String(id) === String(filter.user)) ?? '__none__';
      } else {
        filter.user = { $in: userIdList };
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        // Populate the user reference so the Login Log report can render
        // first/last name + employeeId without an extra round-trip.
        .populate('user', 'firstName lastName username employeeId role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    // Post-fetch ordering for cases Mongo can't sort on (populated fields,
    // or the "Distinct IP" view). The Login Log page handles paging
    // server-side, so we only re-order the returned page here.
    let rows = logs as any[];
    const orderBy = f.orderBy as string | undefined;
    if (orderBy === 'user_name') {
      rows = rows.sort((a, b) => {
        const an = (a.user?.username || a.userEmail || a.userName || '').toString();
        const bn = (b.user?.username || b.userEmail || b.userName || '').toString();
        return an.localeCompare(bn);
      });
    } else if (orderBy === 'employee_name') {
      rows = rows.sort((a, b) => {
        const an = `${a.user?.firstName ?? ''} ${a.user?.lastName ?? ''}`.trim();
        const bn = `${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''}`.trim();
        return an.localeCompare(bn);
      });
    } else if (orderBy === 'unique_ip') {
      // Keep one row per (user × ip) combination, preferring the most recent.
      const seen = new Set<string>();
      const unique: any[] = [];
      // The query was already sorted desc by createdAt so the first hit per
      // key is the latest.
      for (const r of rows) {
        const key = `${String(r.user?._id ?? r.user)}::${r.ip ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(r);
      }
      rows = unique;
    }

    return {
      data: rows as any as IAuditLog[],
      pagination: buildPagination(page, limit, total),
    };
  }
}
