import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { ExpenseService } from './expense.service.js';

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
      employee: req.query.employee as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    },
  };

  const { expenses, pagination } = await ExpenseService.getAll(query, authReq.user.company);

  res.status(200).json(
    buildResponse(true, expenses, 'Expenses retrieved successfully', pagination),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.getById(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, expense, 'Expense retrieved successfully'),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.create({
    ...req.body,
    employee: authReq.user.id,
    company: authReq.user.company,
  });

  res.status(201).json(
    buildResponse(true, expense, 'Expense created successfully'),
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.update(req.params.id as string, req.body, authReq.user.company);

  res.status(200).json(
    buildResponse(true, expense, 'Expense updated successfully'),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  await ExpenseService.delete(req.params.id as string, authReq.user.company);

  res.status(200).json(
    buildResponse(true, null, 'Expense deleted successfully'),
  );
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.submit(req.params.id as string, authReq.user.id, authReq.user.company);

  res.status(200).json(
    buildResponse(true, expense, 'Expense submitted for approval'),
  );
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.approve(
    req.params.id as string,
    authReq.user.id,
    req.body.remarks,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, expense, 'Expense approved successfully'),
  );
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.reject(
    req.params.id as string,
    authReq.user.id,
    req.body.remarks,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, expense, 'Expense rejected'),
  );
});

export const reimburse = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const expense = await ExpenseService.markReimbursed(
    req.params.id as string,
    req.body.reimbursementRef,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, expense, 'Expense marked as reimbursed'),
  );
});

export const getMyExpenses = asyncHandler(async (req: Request, res: Response) => {
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

  const { expenses, pagination } = await ExpenseService.getMyExpenses(
    authReq.user.id,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, expenses, 'My expenses retrieved successfully', pagination),
  );
});

export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { expenses, pagination } = await ExpenseService.getPendingApprovals(
    authReq.user.id,
    query,
    authReq.user.company,
  );

  res.status(200).json(
    buildResponse(true, expenses, 'Pending approvals retrieved successfully', pagination),
  );
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year || month < 1 || month > 12) {
    res.status(400).json(
      buildResponse(false, null, 'Valid month and year are required'),
    );
    return;
  }

  const authReq = req as IAuthRequest;
  const summary = await ExpenseService.getSummary(month, year, authReq.user.company);

  res.status(200).json(
    buildResponse(true, summary, 'Expense summary retrieved successfully'),
  );
});
