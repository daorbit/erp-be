import type { Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { getAccessibleCompanyIds, isPlatformAdmin } from '../../shared/scope.js';
import { CompanyService } from './company.service.js';

// Returns the "active" company ID used for tenant scoping. Platform admins
// (the only role with no company) get undefined → no scope. Everyone else,
// including company-level super_admin, is scoped to their active company.
const tenantScope = (req: IAuthRequest): string | undefined =>
  isPlatformAdmin(req.user) ? undefined : (req.user.activeCompany ?? (req.user.company as any));

export class CompanyController {
  static getMyCompany = asyncHandler(async (req: IAuthRequest, res: Response) => {
    if (!req.user.company) {
      throw new AppError('No company associated with this account.', 404);
    }
    const company = await CompanyService.getById(req.user.company);
    res.status(200).json(
      buildResponse(true, company, 'Company retrieved successfully'),
    );
  });

  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    // Scope to companies the caller can actually access (their own + every
    // company explicitly granted via allowedCompanies). super_admin (platform)
    // gets null → unrestricted.
    const accessibleIds = getAccessibleCompanyIds(req.user);
    const result = await CompanyService.getAll(query, accessibleIds);
    res.status(200).json(
      buildResponse(true, result.data, 'Companies retrieved successfully', result.pagination),
    );
  });

  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.getById(req.params.id as string, tenantScope(req));
    res.status(200).json(
      buildResponse(true, company, 'Company retrieved successfully'),
    );
  });

  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    // Route-level authorize() already restricted this to super_admin
    // (either platform `role=super_admin` or company-level
    // `userType=super_admin`). The branch here decides whether to make a
    // MAIN company or a SIBLING, keyed off whether the caller has a
    // company association:
    //   • Platform admin (no company)         → main company
    //   • Company-level super_admin (company) → sibling in their group
    if (!req.user.company) {
      const company = await CompanyService.create(req.body);
      return res.status(201).json(
        buildResponse(true, company, 'Company created successfully'),
      );
    }

    const mainId = await CompanyService.resolveMainCompanyId(req.user.company as string);
    const company = await CompanyService.createSibling(req.body, mainId);
    return res.status(201).json(
      buildResponse(true, company, 'Sibling company created successfully'),
    );
  });

  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.update(
      req.params.id as string,
      req.body,
      tenantScope(req),
    );
    res.status(200).json(
      buildResponse(true, company, 'Company updated successfully'),
    );
  });

  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const company = await CompanyService.delete(req.params.id as string, tenantScope(req));
    res.status(200).json(
      buildResponse(true, company, 'Company deleted successfully'),
    );
  });

  /**
   * Returns all companies in the caller's group (parent + all siblings),
   * plus a `isCurrent` flag indicating the active context company.
   * Used by the frontend company context switcher.
   */
  static getGroup = asyncHandler(async (req: IAuthRequest, res: Response) => {
    // Platform admin is the only role that legitimately has no company
    // (they manage the whole platform); any other user without a company
    // is in a broken state.
    if (!isPlatformAdmin(req.user) && !req.user.company) {
      throw new AppError('No company associated with this account.', 404);
    }

    // Switcher shows only the companies the user is permitted to switch
    // into — their accessibleCompanies set, not the entire parent-sibling
    // group. A site_admin with allowedCompanies=[DPK] sees DPK only,
    // never the siblings of DPK.
    const accessibleIds = getAccessibleCompanyIds(req.user);
    const companies = await CompanyService.getAccessibleCompanies(accessibleIds);
    const activeId = req.user.activeCompany ?? (req.user.company as string | undefined);

    const result = companies.map((c: any) => ({
      ...c,
      isCurrent: c._id.toString() === activeId,
    }));

    res.status(200).json(
      buildResponse(true, result, 'Group companies retrieved successfully'),
    );
  });
}
