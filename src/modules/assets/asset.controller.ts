import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { AssetService } from './asset.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      category: req.query.category as string,
      status: req.query.status as string,
      condition: req.query.condition as string,
    },
  };

  const { assets, pagination } = await AssetService.getAll(query, authReq.user.company);

  res.status(200).json(
    buildResponse(true, assets, 'Assets retrieved successfully', pagination),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const asset = await AssetService.getById(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, asset, 'Asset retrieved successfully'),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const asset = await AssetService.create({ ...req.body, company: authReq.user.company });

  res.status(201).json(
    buildResponse(true, asset, 'Asset created successfully'),
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const asset = await AssetService.update(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, asset, 'Asset updated successfully'),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  await AssetService.delete(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, null, 'Asset deleted successfully'),
  );
});

export const assignToEmployee = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const asset = await AssetService.assignToEmployee(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, asset, 'Asset assigned to employee successfully'),
  );
});

export const returnAsset = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const asset = await AssetService.returnAsset(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, asset, 'Asset returned successfully'),
  );
});

export const getByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const assets = await AssetService.getByEmployee(req.params.employeeId as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, assets, 'Employee assets retrieved successfully'),
  );
});

export const getAvailable = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const assets = await AssetService.getAvailable(authReq.user.company);

  res.status(200).json(
    buildResponse(true, assets, 'Available assets retrieved successfully'),
  );
});

export const getMaintenanceDue = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const assets = await AssetService.getMaintenanceDue(authReq.user.company);

  res.status(200).json(
    buildResponse(true, assets, 'Maintenance due assets retrieved successfully'),
  );
});
