import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { HelpdeskService } from './helpdesk.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      status: req.query.status as string,
      category: req.query.category as string,
      priority: req.query.priority as string,
      assignedTo: req.query.assignedTo as string,
    },
  };

  const { tickets, pagination } = await HelpdeskService.getAll(query, authReq.user.company);

  res.status(200).json(
    buildResponse(true, tickets, 'Tickets retrieved successfully', pagination),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.getById(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, ticket, 'Ticket retrieved successfully'),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.create({
    ...req.body,
    employee: authReq.user.id,
    company: authReq.user.company,
  });

  res.status(201).json(
    buildResponse(true, ticket, 'Ticket created successfully'),
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.update(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, ticket, 'Ticket updated successfully'),
  );
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.assign(req.params.id as string, req.body.assignedTo, authReq.user.company);

  res.status(200).json(
    buildResponse(true, ticket, 'Ticket assigned successfully'),
  );
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.addComment(req.params.id as string, {
    ...req.body,
    userId: authReq.user.id,
  }, authReq.user.company);

  res.status(200).json(
    buildResponse(true, ticket, 'Comment added successfully'),
  );
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.updateStatus(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, ticket, 'Ticket status updated successfully'),
  );
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const ticket = await HelpdeskService.close(
    req.params.id as string,
    authReq.user.id,
    req.body,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, ticket, 'Ticket closed successfully'),
  );
});

export const getMyTickets = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      status: req.query.status as string,
    },
  };

  const { tickets, pagination } = await HelpdeskService.getMyTickets(
    authReq.user.id,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, tickets, 'My tickets retrieved successfully', pagination),
  );
});

export const getAssignedTickets = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      status: req.query.status as string,
    },
  };

  const { tickets, pagination } = await HelpdeskService.getAssignedTickets(
    authReq.user.id,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, tickets, 'Assigned tickets retrieved successfully', pagination),
  );
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const stats = await HelpdeskService.getStats(authReq.user.company);

  res.status(200).json(
    buildResponse(true, stats, 'Ticket statistics retrieved successfully'),
  );
});
