import mongoose, { type FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Ticket, { type ITicket, TicketStatus } from './helpdesk.model.js';
import type {
  CreateTicketInput,
  UpdateTicketInput,
  AddCommentInput,
  UpdateTicketStatusInput,
  CloseTicketInput,
} from './helpdesk.validator.js';

export class HelpdeskService {
  /**
   * Generate a unique ticket number in the format TKT-YYYY-NNN.
   */
  private static async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;

    const lastTicket = await Ticket.findOne({ ticketNumber: { $regex: `^${prefix}` } })
      .sort({ ticketNumber: -1 })
      .lean();

    let sequence = 1;
    if (lastTicket) {
      const lastSeq = parseInt(lastTicket.ticketNumber.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  static async getAll(query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<ITicket> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.status) filter.status = filters.status;
    if (filters?.category) filter.category = filters.category;
    if (filters?.priority) filter.priority = filters.priority;
    if (filters?.assignedTo) filter.assignedTo = filters.assignedTo;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('comments.user', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return { tickets, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string) {
    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const ticket = await Ticket.findOne(findFilter)
      .populate('employee', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName email')
      .populate('closedBy', 'firstName lastName');

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    return ticket;
  }

  static async create(data: CreateTicketInput & { employee: string }) {
    const ticketNumber = await this.generateTicketNumber();

    const ticket = await Ticket.create({
      ...data,
      ticketNumber,
    });

    return ticket;
  }

  static async update(id: string, data: UpdateTicketInput, companyId?: string) {
    const updateFilter: Record<string, unknown> = { _id: id };
    if (companyId) updateFilter.company = companyId;

    const ticket = await Ticket.findOneAndUpdate(
      updateFilter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    return ticket;
  }

  static async assign(id: string, assignedToId: string, companyId?: string) {
    const assignFilter: Record<string, unknown> = { _id: id };
    if (companyId) assignFilter.company = companyId;

    const ticket = await Ticket.findOneAndUpdate(
      assignFilter,
      {
        $set: {
          assignedTo: assignedToId,
          status: TicketStatus.IN_PROGRESS,
        },
      },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    return ticket;
  }

  static async addComment(id: string, data: AddCommentInput & { userId: string }, companyId?: string) {
    const commentFilter: Record<string, unknown> = { _id: id };
    if (companyId) commentFilter.company = companyId;

    const ticket = await Ticket.findOne(commentFilter);
    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    ticket.comments.push({
      user: data.userId as never,
      message: data.message,
      createdAt: new Date(),
      attachments: data.attachments ?? [],
    });

    await ticket.save();

    // Populate and return
    const populated = await Ticket.findById(id)
      .populate('employee', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName');

    return populated;
  }

  static async updateStatus(id: string, data: UpdateTicketStatusInput, companyId?: string) {
    const updateData: Record<string, unknown> = { status: data.status };
    if (data.resolution) updateData.resolution = data.resolution;

    const statusFilter: Record<string, unknown> = { _id: id };
    if (companyId) statusFilter.company = companyId;

    const ticket = await Ticket.findOneAndUpdate(
      statusFilter,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    return ticket;
  }

  static async close(id: string, userId: string, data: CloseTicketInput, companyId?: string) {
    const closeFilter: Record<string, unknown> = { _id: id };
    if (companyId) closeFilter.company = companyId;

    const ticket = await Ticket.findOne(closeFilter);
    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();
    ticket.closedBy = userId as never;
    if (data.satisfaction) ticket.satisfaction = data.satisfaction;

    await ticket.save();
    return ticket;
  }

  static async getMyTickets(employeeId: string, query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<ITicket> = { employee: employeeId };
    if (companyId) filter.company = companyId;
    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('assignedTo', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return { tickets, pagination: buildPagination(page, limit, total) };
  }

  static async getAssignedTickets(userId: string, query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<ITicket> = { assignedTo: userId };
    if (companyId) filter.company = companyId;
    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('employee', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return { tickets, pagination: buildPagination(page, limit, total) };
  }

  static async getStats(companyId?: string) {
    const statsMatch: Record<string, unknown> = {};
    if (companyId) statsMatch.company = new mongoose.Types.ObjectId(companyId);

    const stats = await Ticket.aggregate([
      ...(Object.keys(statsMatch).length > 0 ? [{ $match: statsMatch }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts: Record<string, number> = {};
    let totalTickets = 0;

    for (const stat of stats) {
      statusCounts[stat._id as string] = stat.count as number;
      totalTickets += stat.count as number;
    }

    const priorityMatch: Record<string, unknown> = {
      status: { $nin: [TicketStatus.CLOSED, TicketStatus.RESOLVED] },
    };
    if (companyId) priorityMatch.company = new mongoose.Types.ObjectId(companyId);

    const priorityCounts = await Ticket.aggregate([
      {
        $match: priorityMatch,
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const openByPriority: Record<string, number> = {};
    for (const stat of priorityCounts) {
      openByPriority[stat._id as string] = stat.count as number;
    }

    return { totalTickets, statusCounts, openByPriority };
  }
}
