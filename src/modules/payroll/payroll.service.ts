import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import { PayrollStatus } from '../../shared/types.js';
import {
  SalaryStructure,
  Payslip,
  type ISalaryStructure,
  type IPayslip,
} from './payroll.model.js';
import EmployeeProfile from '../employees/employee.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

interface PaymentDetails {
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
}

interface SalarySummary {
  month: number;
  year: number;
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalDeductions: number;
  totalAllowances: number;
  statusBreakdown: Record<string, number>;
}

export class PayrollService {
  // ─── Salary Structure ──────────────────────────────────────────────────────

  /**
   * Get all salary structures with pagination.
   */
  static async getAllSalaryStructures(
    query: IQueryParams,
  ): Promise<PaginatedResult<ISalaryStructure>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [structures, total] = await Promise.all([
      SalaryStructure.find(filter)
        .populate({
          path: 'employee',
          select: 'employeeId userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      SalaryStructure.countDocuments(filter),
    ]);

    return {
      data: structures as ISalaryStructure[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get salary structure by ID.
   */
  static async getSalaryStructureById(id: string): Promise<ISalaryStructure> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid salary structure ID format.', 400);
    }

    const structure = await SalaryStructure.findById(id).populate({
      path: 'employee',
      select: 'employeeId userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    });

    if (!structure) {
      throw new AppError('Salary structure not found.', 404);
    }

    return structure;
  }

  /**
   * Create a new salary structure.
   */
  static async createSalaryStructure(
    data: Partial<ISalaryStructure>,
  ): Promise<ISalaryStructure> {
    // Deactivate any existing active structure for this employee
    if (data.employee) {
      await SalaryStructure.updateMany(
        { employee: data.employee, isActive: true },
        { isActive: false, effectiveTo: new Date() },
      );
    }

    // Calculate gross and net salary
    const allowances = data.allowances ?? { hra: 0, da: 0, ta: 0, medical: 0, special: 0, other: 0 };
    const deductions = data.deductions ?? { pf: 0, esi: 0, tax: 0, professionalTax: 0, other: 0 };
    const basicSalary = data.basicSalary ?? 0;

    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + (val || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);

    const grossSalary = basicSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    const structure = await SalaryStructure.create({
      ...data,
      grossSalary,
      netSalary,
    });

    return SalaryStructure.findById(structure._id).populate({
      path: 'employee',
      select: 'employeeId userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    }) as unknown as ISalaryStructure;
  }

  /**
   * Update a salary structure.
   */
  static async updateSalaryStructure(
    id: string,
    data: Partial<ISalaryStructure>,
  ): Promise<ISalaryStructure> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid salary structure ID format.', 400);
    }

    // Recalculate if salary components changed
    if (data.basicSalary || data.allowances || data.deductions) {
      const existing = await SalaryStructure.findById(id);
      if (!existing) {
        throw new AppError('Salary structure not found.', 404);
      }

      const basicSalary = data.basicSalary ?? existing.basicSalary;
      const allowances = { ...existing.allowances.toJSON?.() ?? existing.allowances, ...data.allowances };
      const deductions = { ...existing.deductions.toJSON?.() ?? existing.deductions, ...data.deductions };

      const totalAllowances = Object.values(allowances).reduce(
        (sum: number, val: unknown) => sum + (Number(val) || 0),
        0,
      );
      const totalDeductions = Object.values(deductions).reduce(
        (sum: number, val: unknown) => sum + (Number(val) || 0),
        0,
      );

      data.grossSalary = basicSalary + totalAllowances;
      data.netSalary = data.grossSalary - totalDeductions;
    }

    const structure = await SalaryStructure.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    ).populate({
      path: 'employee',
      select: 'employeeId userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    });

    if (!structure) {
      throw new AppError('Salary structure not found.', 404);
    }

    return structure;
  }

  /**
   * Get salary structure by employee ID.
   */
  static async getByEmployee(employeeId: string): Promise<ISalaryStructure> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    const structure = await SalaryStructure.findOne({
      employee: employeeId,
      isActive: true,
    }).populate({
      path: 'employee',
      select: 'employeeId userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    });

    if (!structure) {
      throw new AppError('No active salary structure found for this employee.', 404);
    }

    return structure;
  }

  // ─── Payslip ───────────────────────────────────────────────────────────────

  /**
   * Generate a payslip for an employee for a given month/year.
   */
  static async generate(
    employeeId: string,
    month: number,
    year: number,
    generatedBy?: string,
  ): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError('Invalid employee ID format.', 400);
    }

    // Check for existing payslip
    const existing = await Payslip.findOne({ employee: employeeId, month, year });
    if (existing) {
      throw new AppError(`Payslip already exists for ${month}/${year}.`, 409);
    }

    // Get active salary structure
    const salary = await SalaryStructure.findOne({
      employee: employeeId,
      isActive: true,
    });

    if (!salary) {
      throw new AppError('No active salary structure found for this employee.', 404);
    }

    const allowances = salary.allowances;
    const deductions = salary.deductions;

    const totalAllowances =
      (allowances.hra || 0) +
      (allowances.da || 0) +
      (allowances.ta || 0) +
      (allowances.medical || 0) +
      (allowances.special || 0) +
      (allowances.other || 0);

    const totalDeductions =
      (deductions.pf || 0) +
      (deductions.esi || 0) +
      (deductions.tax || 0) +
      (deductions.professionalTax || 0) +
      (deductions.other || 0);

    const payslip = await Payslip.create({
      employee: employeeId,
      salaryStructure: salary._id,
      month,
      year,
      basicSalary: salary.basicSalary,
      totalAllowances,
      totalDeductions,
      grossSalary: salary.grossSalary,
      netSalary: salary.netSalary,
      workingDays: 0,
      presentDays: 0,
      leaveDays: 0,
      overtimeHours: 0,
      overtimePay: 0,
      bonus: 0,
      status: PayrollStatus.DRAFT,
      generatedBy: generatedBy ? new mongoose.Types.ObjectId(generatedBy) : undefined,
    });

    return Payslip.findById(payslip._id).populate({
      path: 'employee',
      select: 'employeeId userId',
      populate: { path: 'userId', select: 'firstName lastName email' },
    }) as unknown as IPayslip;
  }

  /**
   * Bulk generate payslips for all active employees.
   */
  static async bulkGenerate(
    month: number,
    year: number,
    generatedBy?: string,
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    const employees = await EmployeeProfile.find({ isActive: true }).select('_id');
    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      try {
        await PayrollService.generate(
          emp._id.toString(),
          month,
          year,
          generatedBy,
        );
        generated++;
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 409) {
          skipped++;
        } else {
          errors.push(
            `Employee ${emp._id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }
    }

    return { generated, skipped, errors };
  }

  /**
   * Get all payslips with filters and pagination.
   */
  static async getAllPayslips(query: IQueryParams): Promise<PaginatedResult<IPayslip>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = query;

    const filter: Record<string, unknown> = {};

    if (filters.employee) filter.employee = filters.employee;
    if (filters.month) filter.month = Number(filters.month);
    if (filters.year) filter.year = Number(filters.year);
    if (filters.status) filter.status = filters.status;

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate({
          path: 'employee',
          select: 'employeeId userId',
          populate: { path: 'userId', select: 'firstName lastName email' },
        })
        .populate('generatedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Payslip.countDocuments(filter),
    ]);

    return {
      data: payslips as IPayslip[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get payslip by ID.
   */
  static async getPayslipById(id: string): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid payslip ID format.', 400);
    }

    const payslip = await Payslip.findById(id)
      .populate({
        path: 'employee',
        select: 'employeeId userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('salaryStructure')
      .populate('generatedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!payslip) {
      throw new AppError('Payslip not found.', 404);
    }

    return payslip;
  }

  /**
   * Approve a payslip.
   */
  static async approve(id: string, approverId: string): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid payslip ID format.', 400);
    }

    const payslip = await Payslip.findById(id);
    if (!payslip) {
      throw new AppError('Payslip not found.', 404);
    }

    if (payslip.status !== PayrollStatus.DRAFT) {
      throw new AppError(`Cannot approve a payslip with status: ${payslip.status}`, 400);
    }

    payslip.status = PayrollStatus.PROCESSING;
    payslip.approvedBy = new mongoose.Types.ObjectId(approverId);
    await payslip.save();

    return Payslip.findById(id)
      .populate({
        path: 'employee',
        select: 'employeeId userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate('approvedBy', 'firstName lastName') as unknown as IPayslip;
  }

  /**
   * Mark a payslip as paid.
   */
  static async markPaid(id: string, details: PaymentDetails): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid payslip ID format.', 400);
    }

    const payslip = await Payslip.findById(id);
    if (!payslip) {
      throw new AppError('Payslip not found.', 404);
    }

    if (payslip.status === PayrollStatus.PAID) {
      throw new AppError('Payslip is already marked as paid.', 409);
    }

    payslip.status = PayrollStatus.PAID;
    payslip.paymentDate = new Date(details.paymentDate);
    payslip.paymentMethod = details.paymentMethod;
    if (details.transactionId) {
      payslip.transactionId = details.transactionId;
    }
    await payslip.save();

    return Payslip.findById(id)
      .populate({
        path: 'employee',
        select: 'employeeId userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      }) as unknown as IPayslip;
  }

  /**
   * Get own payslips (employee view).
   * Accepts either a User ID or an EmployeeProfile ID. If a User ID is provided,
   * the corresponding EmployeeProfile is resolved first.
   */
  static async getMyPayslips(
    userId: string,
    query: IQueryParams,
  ): Promise<PaginatedResult<IPayslip>> {
    // Resolve User ID to EmployeeProfile ID
    const profile = await EmployeeProfile.findOne({ userId }).select('_id');
    const employeeId = profile ? profile._id.toString() : userId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'year',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { employee: employeeId };

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate('salaryStructure')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Payslip.countDocuments(filter),
    ]);

    return {
      data: payslips as IPayslip[],
      pagination: buildPagination(page, limit, total),
    };
  }

  /**
   * Get salary summary for a given month/year.
   */
  static async getSalarySummary(month: number, year: number): Promise<SalarySummary> {
    const payslips = await Payslip.find({ month, year }).lean();

    const statusBreakdown: Record<string, number> = {};
    let totalGrossSalary = 0;
    let totalNetSalary = 0;
    let totalDeductions = 0;
    let totalAllowances = 0;

    for (const slip of payslips) {
      totalGrossSalary += slip.grossSalary;
      totalNetSalary += slip.netSalary;
      totalDeductions += slip.totalDeductions;
      totalAllowances += slip.totalAllowances;

      const status = slip.status;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    }

    return {
      month,
      year,
      totalEmployees: payslips.length,
      totalGrossSalary,
      totalNetSalary,
      totalDeductions,
      totalAllowances,
      statusBreakdown,
    };
  }
}
