import type { FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import {
  JobPosting,
  JobApplication,
  type IJobPosting,
  type IJobApplication,
  JobPostingStatus,
  ApplicationStatus,
} from './recruitment.model.js';
import type {
  CreateJobPostingInput,
  UpdateJobPostingInput,
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  ScheduleInterviewInput,
} from './recruitment.validator.js';

export class RecruitmentService {
  // ─── Job Posting CRUD ───────────────────────────────────────────────────

  static async getAllJobs(query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IJobPosting> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.department) filter.department = filters.department;
    if (filters?.status) filter.status = filters.status;
    if (filters?.employmentType) filter.employmentType = filters.employmentType;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [jobs, total] = await Promise.all([
      JobPosting.find(filter)
        .populate('department', 'name')
        .populate('designation', 'title')
        .populate('postedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      JobPosting.countDocuments(filter),
    ]);

    return { jobs, pagination: buildPagination(page, limit, total) };
  }

  static async getJobById(id: string, companyId?: string) {
    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const job = await JobPosting.findOne(findFilter)
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate('postedBy', 'firstName lastName');

    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    return job;
  }

  static async createJob(data: CreateJobPostingInput & { postedBy: string }) {
    const job = await JobPosting.create(data);
    return job;
  }

  static async updateJob(id: string, data: UpdateJobPostingInput, companyId?: string) {
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const job = await JobPosting.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('department', 'name')
      .populate('designation', 'title');

    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    return job;
  }

  static async deleteJob(id: string, companyId?: string) {
    const deleteFilter: Record<string, unknown> = { _id: id };
    if (companyId) deleteFilter.company = companyId;

    const job = await JobPosting.findOneAndDelete(deleteFilter);
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    // Remove associated applications
    await JobApplication.deleteMany({ jobPosting: id });

    return job;
  }

  static async updateJobStatus(id: string, status: string, companyId?: string) {
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const job = await JobPosting.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    return job;
  }

  // ─── Job Applications ─────────────────────────────────────────────────

  static async getAllApplications(query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IJobApplication> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.jobPosting) filter.jobPosting = filters.jobPosting;
    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .populate('jobPosting', 'title department')
        .populate('interviewers', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication.countDocuments(filter),
    ]);

    return { applications, pagination: buildPagination(page, limit, total) };
  }

  static async getApplicationById(id: string, companyId?: string) {
    const appFindFilter: Record<string, unknown> = { _id: id };
    if (companyId) appFindFilter.company = companyId;

    const application = await JobApplication.findOne(appFindFilter)
      .populate('jobPosting', 'title department employmentType location')
      .populate('interviewers', 'firstName lastName email');

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    return application;
  }

  static async createApplication(data: CreateApplicationInput) {
    // Check if the job posting exists and is open
    const job = await JobPosting.findById(data.jobPosting);
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }
    if (job.status !== JobPostingStatus.OPEN) {
      throw new AppError('This job posting is not accepting applications.', 400);
    }

    const application = await JobApplication.create(data);
    return application;
  }

  static async updateApplicationStatus(
    id: string,
    data: UpdateApplicationStatusInput,
    companyId?: string,
  ) {
    const updateData: Record<string, unknown> = { status: data.status };
    if (data.remarks) updateData.remarks = data.remarks;

    const appUpdateFilter: Record<string, unknown> = { _id: id };
    if (companyId) appUpdateFilter.company = companyId;

    const application = await JobApplication.findOneAndUpdate(
      appUpdateFilter,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate('jobPosting', 'title');

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    return application;
  }

  static async scheduleInterview(id: string, data: ScheduleInterviewInput, companyId?: string) {
    const interviewFilter: Record<string, unknown> = { _id: id };
    if (companyId) interviewFilter.company = companyId;

    const application = await JobApplication.findOneAndUpdate(
      interviewFilter,
      {
        $set: {
          interviewDate: data.interviewDate,
          interviewers: data.interviewers,
          interviewNotes: data.interviewNotes,
          status: ApplicationStatus.INTERVIEW_SCHEDULED,
        },
      },
      { new: true, runValidators: true },
    )
      .populate('jobPosting', 'title')
      .populate('interviewers', 'firstName lastName email');

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    return application;
  }

  static async getApplicationsByJob(jobId: string, query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IJobApplication> = { jobPosting: jobId };
    if (companyId) filter.company = companyId;
    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .populate('interviewers', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication.countDocuments(filter),
    ]);

    return { applications, pagination: buildPagination(page, limit, total) };
  }

  static async getJobStats(jobId: string, companyId?: string) {
    const statsFilter: Record<string, unknown> = { _id: jobId };
    if (companyId) statsFilter.company = companyId;

    const job = await JobPosting.findOne(statsFilter);
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    const stats = await JobApplication.aggregate([
      { $match: { jobPosting: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts: Record<string, number> = {};
    let totalApplications = 0;

    for (const stat of stats) {
      statusCounts[stat._id as string] = stat.count as number;
      totalApplications += stat.count as number;
    }

    return { jobId, title: job.title, totalApplications, statusCounts };
  }
}
