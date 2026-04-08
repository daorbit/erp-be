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
  static async getAll(query: IQueryParams): Promise<PaginatedResult<IAnnouncement>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'publishDate',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};

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
      data: announcements as IAnnouncement[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get an announcement by ID.
   */
  static async getById(id: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const announcement = await Announcement.findById(id)
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
  static async update(id: string, data: Partial<IAnnouncement>): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
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
  static async delete(id: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
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
  static async getActive(): Promise<IAnnouncement[]> {
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      publishDate: { $lte: now },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ],
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('targetDepartments', 'name code')
      .sort({ priority: -1, publishDate: -1 })
      .lean();

    return announcements as IAnnouncement[];
  }

  /**
   * Mark an announcement as read by an employee.
   */
  static async markRead(announcementId: string, employeeId: string): Promise<IAnnouncement> {
    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      throw new AppError('Invalid announcement ID format.', 400);
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      throw new AppError('Announcement not found.', 404);
    }

    const employeeObjId = new mongoose.Types.ObjectId(employeeId);

    // Avoid duplicate entries
    const alreadyRead = announcement.readBy.some(
      (id) => id.toString() === employeeId,
    );

    if (!alreadyRead) {
      announcement.readBy.push(employeeObjId);
      await announcement.save();
    }

    return announcement;
  }
}
