import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { PerformanceService } from './performance.service.js';

// ─── Review Controllers ─────────────────────────────────────────────────────

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      employee: req.query.employee,
      status: req.query.status,
      type: req.query.type,
    },
  };

  const { reviews, pagination } = await PerformanceService.getAllReviews(query);

  res.status(200).json(
    buildResponse(true, reviews, 'Reviews retrieved successfully', pagination),
  );
});

export const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const review = await PerformanceService.getReviewById(req.params.id);

  res.status(200).json(
    buildResponse(true, review, 'Review retrieved successfully'),
  );
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const review = await PerformanceService.createReview({
    ...req.body,
    reviewer: authReq.user.id,
  });

  res.status(201).json(
    buildResponse(true, review, 'Review created successfully'),
  );
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await PerformanceService.updateReview(req.params.id, req.body);

  res.status(200).json(
    buildResponse(true, review, 'Review updated successfully'),
  );
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await PerformanceService.deleteReview(req.params.id);

  res.status(200).json(
    buildResponse(true, null, 'Review deleted successfully'),
  );
});

export const submitReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await PerformanceService.submitReview(req.params.id);

  res.status(200).json(
    buildResponse(true, review, 'Review submitted to the next stage successfully'),
  );
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { reviews, pagination } = await PerformanceService.getMyReviews(
    authReq.user.id,
    query,
  );

  res.status(200).json(
    buildResponse(true, reviews, 'My reviews retrieved successfully', pagination),
  );
});

export const getPendingReviews = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { reviews, pagination } = await PerformanceService.getPendingReviews(
    authReq.user.id,
    query,
  );

  res.status(200).json(
    buildResponse(true, reviews, 'Pending reviews retrieved successfully', pagination),
  );
});

// ─── Goal Controllers ───────────────────────────────────────────────────────

export const getAllGoals = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      employee: req.query.employee,
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
    },
  };

  const { goals, pagination } = await PerformanceService.getAllGoals(query);

  res.status(200).json(
    buildResponse(true, goals, 'Goals retrieved successfully', pagination),
  );
});

export const getGoalById = asyncHandler(async (req: Request, res: Response) => {
  const goal = await PerformanceService.getGoalById(req.params.id);

  res.status(200).json(
    buildResponse(true, goal, 'Goal retrieved successfully'),
  );
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const goal = await PerformanceService.createGoal({
    ...req.body,
    assignedBy: authReq.user.id,
  });

  res.status(201).json(
    buildResponse(true, goal, 'Goal created successfully'),
  );
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await PerformanceService.updateGoal(req.params.id, req.body);

  res.status(200).json(
    buildResponse(true, goal, 'Goal updated successfully'),
  );
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  await PerformanceService.deleteGoal(req.params.id);

  res.status(200).json(
    buildResponse(true, null, 'Goal deleted successfully'),
  );
});

export const getMyGoals = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'dueDate',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  };

  const { goals, pagination } = await PerformanceService.getMyGoals(
    authReq.user.id,
    query,
  );

  res.status(200).json(
    buildResponse(true, goals, 'My goals retrieved successfully', pagination),
  );
});

export const updateGoalProgress = asyncHandler(async (req: Request, res: Response) => {
  const goal = await PerformanceService.updateGoalProgress(req.params.id, req.body);

  res.status(200).json(
    buildResponse(true, goal, 'Goal progress updated successfully'),
  );
});

export const getGoalsByEmployee = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'dueDate',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  };

  const { goals, pagination } = await PerformanceService.getGoalsByEmployee(
    req.params.employeeId,
    query,
  );

  res.status(200).json(
    buildResponse(true, goals, 'Employee goals retrieved successfully', pagination),
  );
});
