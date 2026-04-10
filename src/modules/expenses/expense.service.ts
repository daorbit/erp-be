import mongoose, { type FilterQuery } from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import Expense, { type IExpense, ExpenseStatus } from './expense.model.js';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from './expense.validator.js';

export class ExpenseService {
  static async getAll(query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IExpense> = {};
    if (companyId) filter.company = companyId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (filters?.status) filter.status = filters.status;
    if (filters?.category) filter.category = filters.category;
    if (filters?.employee) filter.employee = filters.employee;

    if (filters?.dateFrom || filters?.dateTo) {
      filter.date = {};
      if (filters.dateFrom) filter.date.$gte = new Date(filters.dateFrom as string);
      if (filters.dateTo) filter.date.$lte = new Date(filters.dateTo as string);
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('employee', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return { expenses, pagination: buildPagination(page, limit, total) };
  }

  static async getById(id: string, companyId?: string) {
    const findFilter: Record<string, unknown> = { _id: id };
    if (companyId) findFilter.company = companyId;

    const expense = await Expense.findOne(findFilter)
      .populate('employee', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    return expense;
  }

  static async create(data: CreateExpenseInput & { employee: string }) {
    const expense = await Expense.create(data);
    return expense;
  }

  static async update(id: string, data: UpdateExpenseInput, companyId?: string) {
    const updateFindFilter: Record<string, unknown> = { _id: id };
    if (companyId) updateFindFilter.company = companyId;

    const expense = await Expense.findOne(updateFindFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new AppError('Only draft expenses can be updated.', 400);
    }

    const updated = await Expense.findOneAndUpdate(
      updateFindFilter,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('employee', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');

    return updated;
  }

  static async delete(id: string, companyId?: string) {
    const deleteFindFilter: Record<string, unknown> = { _id: id };
    if (companyId) deleteFindFilter.company = companyId;

    const expense = await Expense.findOne(deleteFindFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new AppError('Only draft expenses can be deleted.', 400);
    }

    await expense.deleteOne();
    return expense;
  }

  static async submit(id: string, employeeId: string, companyId?: string) {
    const submitFilter: Record<string, unknown> = { _id: id };
    if (companyId) submitFilter.company = companyId;

    const expense = await Expense.findOne(submitFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.employee.toString() !== employeeId) {
      throw new AppError('You can only submit your own expenses.', 403);
    }

    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new AppError('Only draft expenses can be submitted.', 400);
    }

    expense.status = ExpenseStatus.SUBMITTED;
    await expense.save();

    return expense;
  }

  static async approve(id: string, approverId: string, remarks?: string, companyId?: string) {
    const approveFilter: Record<string, unknown> = { _id: id };
    if (companyId) approveFilter.company = companyId;

    const expense = await Expense.findOne(approveFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.status !== ExpenseStatus.SUBMITTED && expense.status !== ExpenseStatus.UNDER_REVIEW) {
      throw new AppError('Only submitted or under-review expenses can be approved.', 400);
    }

    expense.status = ExpenseStatus.APPROVED;
    expense.approvedBy = approverId as never;
    expense.approvedAt = new Date();
    if (remarks) expense.approverRemarks = remarks;

    await expense.save();
    return expense;
  }

  static async reject(id: string, approverId: string, remarks?: string, companyId?: string) {
    const rejectFilter: Record<string, unknown> = { _id: id };
    if (companyId) rejectFilter.company = companyId;

    const expense = await Expense.findOne(rejectFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.status !== ExpenseStatus.SUBMITTED && expense.status !== ExpenseStatus.UNDER_REVIEW) {
      throw new AppError('Only submitted or under-review expenses can be rejected.', 400);
    }

    expense.status = ExpenseStatus.REJECTED;
    expense.approvedBy = approverId as never;
    expense.approvedAt = new Date();
    if (remarks) expense.approverRemarks = remarks;

    await expense.save();
    return expense;
  }

  static async markReimbursed(id: string, reimbursementRef?: string, companyId?: string) {
    const reimburseFilter: Record<string, unknown> = { _id: id };
    if (companyId) reimburseFilter.company = companyId;

    const expense = await Expense.findOne(reimburseFilter);
    if (!expense) {
      throw new AppError('Expense not found.', 404);
    }

    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new AppError('Only approved expenses can be marked as reimbursed.', 400);
    }

    expense.status = ExpenseStatus.REIMBURSED;
    expense.reimbursedAt = new Date();
    if (reimbursementRef) expense.reimbursementRef = reimbursementRef;

    await expense.save();
    return expense;
  }

  static async getMyExpenses(employeeId: string, query: IQueryParams, companyId?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters,
    } = query;

    const filter: FilterQuery<IExpense> = { employee: employeeId };
    if (companyId) filter.company = companyId;
    if (filters?.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('approvedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return { expenses, pagination: buildPagination(page, limit, total) };
  }

  static async getPendingApprovals(managerId: string, query: IQueryParams, companyId?: string) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<IExpense> = {
      status: { $in: [ExpenseStatus.SUBMITTED, ExpenseStatus.UNDER_REVIEW] },
    };
    if (companyId) filter.company = companyId;

    // Managers see expenses from employees they manage; for now return all pending
    // A full implementation would filter by reporting relationship

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('employee', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    // Suppress unused parameter warning
    void managerId;

    return { expenses, pagination: buildPagination(page, limit, total) };
  }

  static async getSummary(month: number, year: number, companyId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const summaryMatch: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate },
      status: { $in: [ExpenseStatus.APPROVED, ExpenseStatus.REIMBURSED] },
    };
    if (companyId) summaryMatch.company = new mongoose.Types.ObjectId(companyId);

    const summary = await Expense.aggregate([
      {
        $match: summaryMatch,
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const grandTotal = summary.reduce(
      (acc, item) => acc + (item.totalAmount as number),
      0,
    );

    return { month, year, categories: summary, grandTotal };
  }
}
