import type { FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import {
  PerformanceReview,
  Goal,
  type IPerformanceReview,
  type IGoal,
  ReviewStatus,
  GoalStatus,
} from './performance.model.js';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  CreateGoalInput,
  UpdateGoalInput,
  UpdateGoalProgressInput,
} from './performance.validator.js';

export class PerformanceService {
  // ─── Performance Reviews ────────────────────────────────────────────────

  static async getAllReviews(query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IPerformanceReview> = {};

    if (search) {
      filter.$or = [
        { employeeComments: { $regex: search, $options: 'i' } },
        { managerComments: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.employee) filter.employee = filters.employee;
    if (filters?.status) filter.status = filters.status;
    if (filters?.type) filter.type = filters.type;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      PerformanceReview.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('reviewer', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceReview.countDocuments(filter),
    ]);

    return { reviews, pagination: buildPagination(page, limit, total) };
  }

  static async getReviewById(id: string) {
    const review = await PerformanceReview.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('reviewer', 'firstName lastName email');

    if (!review) {
      throw new AppError('Performance review not found.', 404);
    }

    return review;
  }

  static async createReview(data: CreateReviewInput & { reviewer: string }) {
    const review = await PerformanceReview.create(data);
    return review;
  }

  static async updateReview(id: string, data: UpdateReviewInput) {
    const review = await PerformanceReview.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('reviewer', 'firstName lastName');

    if (!review) {
      throw new AppError('Performance review not found.', 404);
    }

    return review;
  }

  static async deleteReview(id: string) {
    const review = await PerformanceReview.findByIdAndDelete(id);
    if (!review) {
      throw new AppError('Performance review not found.', 404);
    }
    return review;
  }

  static async submitReview(id: string) {
    const review = await PerformanceReview.findById(id);
    if (!review) {
      throw new AppError('Performance review not found.', 404);
    }

    const statusFlow: Record<string, ReviewStatus> = {
      [ReviewStatus.DRAFT]: ReviewStatus.SELF_REVIEW,
      [ReviewStatus.SELF_REVIEW]: ReviewStatus.MANAGER_REVIEW,
      [ReviewStatus.MANAGER_REVIEW]: ReviewStatus.HR_REVIEW,
      [ReviewStatus.HR_REVIEW]: ReviewStatus.COMPLETED,
    };

    const nextStatus = statusFlow[review.status];
    if (!nextStatus) {
      throw new AppError('Review is already completed and cannot be advanced.', 400);
    }

    review.status = nextStatus;
    await review.save();

    return review;
  }

  static async getMyReviews(employeeId: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IPerformanceReview> = { employee: employeeId };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      PerformanceReview.find(filter)
        .populate('reviewer', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceReview.countDocuments(filter),
    ]);

    return { reviews, pagination: buildPagination(page, limit, total) };
  }

  static async getPendingReviews(reviewerId: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IPerformanceReview> = {
      reviewer: reviewerId,
      status: { $in: [ReviewStatus.SELF_REVIEW, ReviewStatus.MANAGER_REVIEW] },
    };

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      PerformanceReview.find(filter)
        .populate('employee', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PerformanceReview.countDocuments(filter),
    ]);

    return { reviews, pagination: buildPagination(page, limit, total) };
  }

  // ─── Goals ────────────────────────────────────────────────────────────

  static async getAllGoals(query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IGoal> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.employee) filter.employee = filters.employee;
    if (filters?.status) filter.status = filters.status;
    if (filters?.priority) filter.priority = filters.priority;
    if (filters?.category) filter.category = filters.category;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [goals, total] = await Promise.all([
      Goal.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Goal.countDocuments(filter),
    ]);

    return { goals, pagination: buildPagination(page, limit, total) };
  }

  static async getGoalById(id: string) {
    const goal = await Goal.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    if (!goal) {
      throw new AppError('Goal not found.', 404);
    }

    return goal;
  }

  static async createGoal(data: CreateGoalInput & { assignedBy: string }) {
    const goal = await Goal.create(data);
    return goal;
  }

  static async updateGoal(id: string, data: UpdateGoalInput) {
    const goal = await Goal.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    if (!goal) {
      throw new AppError('Goal not found.', 404);
    }

    return goal;
  }

  static async deleteGoal(id: string) {
    const goal = await Goal.findByIdAndDelete(id);
    if (!goal) {
      throw new AppError('Goal not found.', 404);
    }
    return goal;
  }

  static async getMyGoals(employeeId: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'dueDate', sortOrder = 'asc' } = query;

    const filter: FilterQuery<IGoal> = { employee: employeeId };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [goals, total] = await Promise.all([
      Goal.find(filter)
        .populate('assignedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Goal.countDocuments(filter),
    ]);

    return { goals, pagination: buildPagination(page, limit, total) };
  }

  static async updateGoalProgress(id: string, data: UpdateGoalProgressInput) {
    const goal = await Goal.findById(id);
    if (!goal) {
      throw new AppError('Goal not found.', 404);
    }

    goal.progress = data.progress;

    if (data.progress === 100) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedDate = new Date();
    } else if (data.progress > 0) {
      goal.status = GoalStatus.IN_PROGRESS;
    }

    await goal.save();
    return goal;
  }

  static async getGoalsByEmployee(employeeId: string, query: IQueryParams) {
    const { page = 1, limit = 10, sortBy = 'dueDate', sortOrder = 'asc' } = query;

    const filter: FilterQuery<IGoal> = { employee: employeeId };
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [goals, total] = await Promise.all([
      Goal.find(filter)
        .populate('assignedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Goal.countDocuments(filter),
    ]);

    return { goals, pagination: buildPagination(page, limit, total) };
  }
}
