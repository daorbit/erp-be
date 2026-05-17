import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { buildResourceScope, isPlatformAdmin } from '../../shared/scope.js';
import { BranchService } from './branch.service.js';

// Effective company for write ops & single-record reads — respects active
// company context (X-Active-Company header) and skips for platform admin.
function effectiveCompany(req: IAuthRequest): string | undefined {
  if (isPlatformAdmin(req.user)) return undefined;
  return req.user.activeCompany ?? req.user.company;
}

export class BranchController {
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    // Comma-separated query params (sent by the Site/Plant/Project list filters).
    const csv = (v: unknown): string[] | undefined => {
      if (typeof v !== 'string' || !v.trim()) return undefined;
      return v.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const filters = {
      ids: csv(req.query.ids),
      states: csv(req.query.states),
      division: req.query.division as string | undefined,
      siteStatus: req.query.siteStatus as 'active' | 'inactive' | 'all' | undefined,
      lockStatus: req.query.lockStatus as 'locked' | 'open' | 'all' | undefined,
    };

    // Branch is itself a site, so the site-scope filter targets the branch's
    // own _id (not a `branch` FK). For site_admin / user this restricts the
    // list to exactly their allowedSites — no other branches leak through.
    const scope = buildResourceScope(req.user, { branchField: '_id' });
    const scopeFilter: Record<string, unknown> = {
      ...(scope.companyFilter ?? {}),
      ...(scope.branchFilter ?? {}),
    };

    // For non-platform users we no longer hard-bind to a single company —
    // the scope object already constrains by allowedCompanies. Passing
    // undefined here lets that scope drive the company filter.
    const result = await BranchService.getAll(query, undefined, filters, scopeFilter);
    res.status(200).json(buildResponse(true, result.data, 'Branches retrieved successfully', result.pagination));
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.getById(req.params.id as string, effectiveCompany(req));
    res.status(200).json(buildResponse(true, branch, 'Branch retrieved successfully'));
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.create({ ...req.body, company: effectiveCompany(req) });
    res.status(201).json(buildResponse(true, branch, 'Branch created successfully'));
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.update(req.params.id as string, req.body, effectiveCompany(req));
    res.status(200).json(buildResponse(true, branch, 'Branch updated successfully'));
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = await BranchService.delete(req.params.id as string, effectiveCompany(req));
    res.status(200).json(buildResponse(true, branch, 'Branch deactivated successfully'));
  });
}
