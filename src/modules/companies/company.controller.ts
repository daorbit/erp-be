import type { Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { UserRole } from '../../shared/types.js';
import { CompanyService } from './company.service.js';

// Returns the caller's own company id when they aren't a platform admin —
// the service uses this to scope reads + mutations to a single tenant group.
const tenantScope = (req: IAuthRequest): string | undefined =>
  req.user.role === UserRole.SUPER_ADMIN ? undefined : (req.user.company as any);

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

    const result = await CompanyService.getAll(query, tenantScope(req));
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
    if (req.user.role === UserRole.SUPER_ADMIN) {
      // Super Admin creates a main company (no parentCompany).
      const company = await CompanyService.create(req.body);
      return res.status(201).json(
        buildResponse(true, company, 'Company created successfully'),
      );
    }

    // Admin (Firm User) creates a sibling company within their group.
    if (!req.user.company) {
      throw new AppError('No company associated with this account.', 400);
    }
    const mainId = await CompanyService.resolveMainCompanyId(req.user.company as string);
    const company = await CompanyService.createSibling(req.body, mainId);
    res.status(201).json(
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
}
