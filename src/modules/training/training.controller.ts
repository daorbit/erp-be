import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { TrainingService } from './training.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      category: req.query.category as string,
      status: req.query.status as string,
      mode: req.query.mode as string,
    },
  };

  const { trainings, pagination } = await TrainingService.getAll(query);

  res.status(200).json(
    buildResponse(true, trainings, 'Training programs retrieved successfully', pagination),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const training = await TrainingService.getById(req.params.id as string);

  res.status(200).json(
    buildResponse(true, training, 'Training program retrieved successfully'),
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const training = await TrainingService.create({
    ...req.body,
    createdBy: authReq.user.id,
  });

  res.status(201).json(
    buildResponse(true, training, 'Training program created successfully'),
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const training = await TrainingService.update(req.params.id as string, req.body);

  res.status(200).json(
    buildResponse(true, training, 'Training program updated successfully'),
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await TrainingService.delete(req.params.id as string);

  res.status(200).json(
    buildResponse(true, null, 'Training program deleted successfully'),
  );
});

export const enrollEmployee = asyncHandler(async (req: Request, res: Response) => {
  const training = await TrainingService.enrollEmployee(
    req.params.id as string,
    req.body.employeeId,
  );

  res.status(200).json(
    buildResponse(true, training, 'Employee enrolled successfully'),
  );
});

export const completeTraining = asyncHandler(async (req: Request, res: Response) => {
  const training = await TrainingService.completeTraining(
    req.params.id as string,
    req.body.employeeId,
    req.body,
  );

  res.status(200).json(
    buildResponse(true, training, 'Training marked as completed for employee'),
  );
});

export const dropEmployee = asyncHandler(async (req: Request, res: Response) => {
  const training = await TrainingService.dropEmployee(
    req.params.id as string,
    req.body.employeeId,
  );

  res.status(200).json(
    buildResponse(true, training, 'Employee dropped from training'),
  );
});

export const getMyTrainings = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'startDate',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const { trainings, pagination } = await TrainingService.getMyTrainings(
    authReq.user.id,
    query,
  );

  res.status(200).json(
    buildResponse(true, trainings, 'My trainings retrieved successfully', pagination),
  );
});

export const getUpcoming = asyncHandler(async (_req: Request, res: Response) => {
  const trainings = await TrainingService.getUpcoming();

  res.status(200).json(
    buildResponse(true, trainings, 'Upcoming trainings retrieved successfully'),
  );
});
