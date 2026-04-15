import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { DesignationService } from './designation.service.js';

export class DesignationController {
  /**
   * GET / - Get all designations.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'displayOrder',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      filters: {
        department: req.query.department as string,
      },
    };

    const result = await DesignationService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Designations retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /:id - Get designation by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const designation = await DesignationService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, designation, 'Designation retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new designation.
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const designation = await DesignationService.create({ ...req.body, company: req.user.company });
    res.status(201).json(
      buildResponse(true, designation, 'Designation created successfully'),
    );
  });

  /**
   * PUT /:id - Update a designation.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const designation = await DesignationService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, designation, 'Designation updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete a designation.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const designation = await DesignationService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, designation, 'Designation deactivated successfully'),
    );
  });

  /**
   * POST /merge - Merge one designation into another.
   */
  static merge = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { fromDesignation, toDesignation } = req.body as { fromDesignation: string; toDesignation: string };
    const result = await DesignationService.merge(fromDesignation, toDesignation, req.user.company);
    res.status(200).json(
      buildResponse(true, result, `Designation merged successfully. ${result.movedUsers} user(s) reassigned.`),
    );
  });

  /**
   * GET /employee-count?branch=<id> - Count active users per designation.
   * Branch is optional; when absent, counts across the whole company.
   */
  static employeeCount = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const branch = (req.query.branch as string) || undefined;
    const rows = await DesignationService.countByBranch(req.user.company, branch);
    res.status(200).json(
      buildResponse(true, rows, 'Employee counts retrieved successfully'),
    );
  });
}
