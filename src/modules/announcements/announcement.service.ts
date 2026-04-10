import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Announcement, { type IAnnouncement } from './announcement.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class AnnouncementService {
  /**
   * Get all announcements with filters and pagination.
   */
  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<IAnnouncement>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'publishDate',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters.category) {
      filter.category = filters.category;
    }

    if (filters.priority) {
      filter.priority = filters.priority;
    }

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('targetDepartments', 'name code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    return {
      data: announcements as any as IAnnouncement[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get an announcement by ID.
   */
  static async getById(id: string, companyId?: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const announcement = await Announcement.findOne(findFilter)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetDepartments', 'name code');

    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }

    return announcement;
  }

  /**
   * Create a new announcement.
   */
  static async create(data: Partial<IAnnouncement>): Promise<IAnnouncement> {
    const announcement = await Announcement.create(data);

    return Announcement.findById(announcement._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetDepartments', 'name code') as unknown as IAnnouncement;
  }

  /**
   * Update an announcement.
   */
  static async update(id: string, data: Partial<IAnnouncement>, companyId?: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const updateFilter: Record<string, unknown> = { _id: id };
    if (companyId) updateFilter.company = companyId;

    const announcement = await Announcement.findOneAndUpdate(
      updateFilter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('targetDepartments', 'name code');

    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }

    return announcement;
  }

  /**
   * Soft delete an announcement.
   */
  static async delete(id: string, companyId?: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const deleteFilter: Record<string, unknown> = { _id: id };
    if (companyId) deleteFilter.company = companyId;

    const announcement = await Announcement.findOneAndUpdate(
      deleteFilter,
      { isActive: false },
      { new: true },
    );

    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }

    return announcement;
  }

  /**
   * Get all currently active announcements (published and not expired).
   */
  static async getActive(companyId?: string): Promise<IAnnouncement[]> {
    const now = new Date();

    const activeFilter: Record<string, unknown> = {
      isActive: true,
      publishDate: { $lte: now },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ],
    };
    if (companyId) activeFilter.company = companyId;

    const announcements = await Announcement.find(activeFilter)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetDepartments', 'name code')
      .sort({ priority: -1, publishDate: -1 })
      .lean();

    return announcements as any as IAnnouncement[];
  }

  /**
   * Mark an announcement as read by an employee.
   */
  static async markRead(announcementId: string, employeeId: string, companyId?: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const readFilter: Record<string, unknown> = { _id: announcementId };
    if (companyId) readFilter.company = companyId;

    const announcement = await Announcement.findOne(readFilter);
    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }

    // Avoid duplicate entries
    const alreadyRead = announcement.readBy.some(
      (receipt) => receipt.employee.toString() === employeeId,
    );

    if (!alreadyRead) {
      announcement.readBy.push({ employee: new mongoose.Types.ObjectId(employeeId), readAt: new Date() } as any);
      await announcement.save();
    }

    return announcement;
  }
}
