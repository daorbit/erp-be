import type { Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { DepartmentService } from './department.service.js';

export class DepartmentController {
  /**
   * GET / - Get all departments.
   */
  static getAll = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const query: IQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'name',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
    };

    const result = await DepartmentService.getAll(query, req.user.company);
    res.status(200).json(
      buildResponse(true, result.data, 'Departments retrieved successfully', result.pagination),
    );
  });

  /**
   * GET /tree - Get hierarchical department tree.
   */
  static getTree = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const tree = await DepartmentService.getDepartmentTree(req.user.company);
    res.status(200).json(
      buildResponse(true, tree, 'Department tree retrieved successfully'),
    );
  });

  /**
   * GET /:id - Get department by ID.
   */
  static getById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const department = await DepartmentService.getById(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, department, 'Department retrieved successfully'),
    );
  });

  /**
   * POST / - Create a new department.
   */
  static create = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const department = await DepartmentService.create({ ...req.body, company: req.user.company });
    res.status(201).json(
      buildResponse(true, department, 'Department created successfully'),
    );
  });

  /**
   * PUT /:id - Update a department.
   */
  static update = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const department = await DepartmentService.update(req.params.id as string, req.body, req.user.company);
    res.status(200).json(
      buildResponse(true, department, 'Department updated successfully'),
    );
  });

  /**
   * DELETE /:id - Soft delete a department.
   */
  static delete = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const department = await DepartmentService.delete(req.params.id as string, req.user.company);
    res.status(200).json(
      buildResponse(true, department, 'Department deactivated successfully'),
    );
  });
}
