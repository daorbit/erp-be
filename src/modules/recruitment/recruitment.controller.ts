import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import type { IAuthRequest, IQueryParams } from '../../shared/types.js';
import { RecruitmentService } from './recruitment.service.js';

// ─── Job Posting Controllers ────────────────────────────────────────────────

export const getAllJobs = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      department: req.query.department as string,
      status: req.query.status as string,
      employmentType: req.query.employmentType as string,
    },
  };

  const { jobs, pagination } = await RecruitmentService.getAllJobs(query);

  res.status(200).json(
    buildResponse(true, jobs, 'Job postings retrieved successfully', pagination),
  );
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await RecruitmentService.getJobById(req.params.id as string);

  res.status(200).json(
    buildResponse(true, job, 'Job posting retrieved successfully'),
  );
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as IAuthRequest;
  const job = await RecruitmentService.createJob({
    ...req.body,
    postedBy: authReq.user.id,
  });

  res.status(201).json(
    buildResponse(true, job, 'Job posting created successfully'),
  );
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await RecruitmentService.updateJob(req.params.id as string, req.body);

  res.status(200).json(
    buildResponse(true, job, 'Job posting updated successfully'),
  );
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  await RecruitmentService.deleteJob(req.params.id as string);

  res.status(200).json(
    buildResponse(true, null, 'Job posting deleted successfully'),
  );
});

export const updateJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const job = await RecruitmentService.updateJobStatus(req.params.id as string, req.body.status);

  res.status(200).json(
    buildResponse(true, job, 'Job posting status updated successfully'),
  );
});

export const getJobStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await RecruitmentService.getJobStats(req.params.jobId as string);

  res.status(200).json(
    buildResponse(true, stats, 'Job statistics retrieved successfully'),
  );
});

// ─── Application Controllers ────────────────────────────────────────────────

export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search as string,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      jobPosting: req.query.jobPosting as string,
      status: req.query.status as string,
    },
  };

  const { applications, pagination } = await RecruitmentService.getAllApplications(query);

  res.status(200).json(
    buildResponse(true, applications, 'Applications retrieved successfully', pagination),
  );
});

export const getApplicationById = asyncHandler(async (req: Request, res: Response) => {
  const application = await RecruitmentService.getApplicationById(req.params.id as string);

  res.status(200).json(
    buildResponse(true, application, 'Application retrieved successfully'),
  );
});

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await RecruitmentService.createApplication(req.body);

  res.status(201).json(
    buildResponse(true, application, 'Application submitted successfully'),
  );
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const application = await RecruitmentService.updateApplicationStatus(
    req.params.id as string,
    req.body,
  );

  res.status(200).json(
    buildResponse(true, application, 'Application status updated successfully'),
  );
});

export const scheduleInterview = asyncHandler(async (req: Request, res: Response) => {
  const application = await RecruitmentService.scheduleInterview(
    req.params.id as string,
    req.body,
  );

  res.status(200).json(
    buildResponse(true, application, 'Interview scheduled successfully'),
  );
});

export const getApplicationsByJob = asyncHandler(async (req: Request, res: Response) => {
  const query: IQueryParams = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: {
      status: req.query.status as string,
    },
  };

  const { applications, pagination } = await RecruitmentService.getApplicationsByJob(
    req.params.jobId as string,
    query,
  );

  res.status(200).json(
    buildResponse(true, applications, 'Applications retrieved successfully', pagination),
  );
});
