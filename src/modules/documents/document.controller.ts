import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { DocumentService } from './document.service.js';

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
      employee: req.query.employee as string,
      isPublic: req.query.isPublic !== undefined
        ? req.query.isPublic === 'true'
        : undefined,
    },
  };

  const { documents, pagination } = await DocumentService.getAll(query, authReq.user.company);

  res.status(200).json(
    buildResponse(true, documents, 'Documents retrieved successfully', pagination),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const document = await DocumentService.getById(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, document, 'Document retrieved successfully'),
  );
});

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const document = await DocumentService.upload({
    ...req.body,
    uploadedBy: authReq.user.id,
    company: authReq.user.company,
  });

  res.status(201).json(
    buildResponse(true, document, 'Document uploaded successfully'),
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const document = await DocumentService.update(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, document, 'Document updated successfully'),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  await DocumentService.delete(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, null, 'Document deleted successfully'),
  );
});

export const getByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { documents, pagination } = await DocumentService.getByEmployee(
    req.params.employeeId as string,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, documents, 'Employee documents retrieved successfully', pagination),
  );
});

export const getPublicDocuments = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { documents, pagination } = await DocumentService.getPublicDocuments(query, authReq.user.company);

  res.status(200).json(
    buildResponse(true, documents, 'Public documents retrieved successfully', pagination),
  );
});

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { documents, pagination } = await DocumentService.getByCategory(
    req.params.category as string,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, documents, 'Documents retrieved successfully', pagination),
  );
});
