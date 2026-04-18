import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import { buildPagination } from '../../shared/helpers.js';
import type { IQueryParams } from '../../shared/types.js';
import SalaryStructureTemplate, {
  SalaryStructureHead,
  type ISalaryStructureTemplate,
  type ISalaryStructureHead,
} from './salaryStructure.model.js';
import EmployeeProfile from '../employees/employee.model.js';

interface PaginatedResult<T> {
  data: T[];
  pagination: ReturnType<typeof buildPagination>;
}

export class SalaryStructureService {
  // ─── Templates ─────────────────────────────────────────────────────────────

  static async getAll(query: IQueryParams, companyId?: string): Promise<PaginatedResult<ISalaryStructureTemplate>> {
    const { page = 1, limit = 200, search, sortBy = 'name', sortOrder = 'asc' } = query;

    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [rows, total] = await Promise.all([
      SalaryStructureTemplate.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      SalaryStructureTemplate.countDocuments(filter),
    ]);

    return {
      data: rows as any as ISalaryStructureTemplate[],
      pagination: buildPagination(page, limit, total),
    };
  }

  static async getById(id: string, companyId?: string): Promise<ISalaryStructureTemplate> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Structure ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const doc = await SalaryStructureTemplate.findOne(filter);
    if (!doc) throw new AppError('Salary Structure not found.', 404);
    return doc;
  }

  static async create(data: Partial<ISalaryStructureTemplate>): Promise<ISalaryStructureTemplate> {
    return SalaryStructureTemplate.create(data);
  }

  static async update(id: string, data: Partial<ISalaryStructureTemplate>, companyId?: string): Promise<ISalaryStructureTemplate> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Structure ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const doc = await SalaryStructureTemplate.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new AppError('Salary Structure not found.', 404);
    return doc;
  }

  // Hard delete because structures are reference data. Before deleting, ensure
  // no SalaryStructureHead rows still reference this structure.
  static async delete(id: string, companyId?: string): Promise<{ deleted: true }> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Salary Structure ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const assignedCount = await SalaryStructureHead.countDocuments({ structure: id, isActive: true });
    if (assignedCount > 0) {
      throw new AppError(
        `Cannot delete. ${assignedCount} salary head(s) are assigned to this structure. Remove them first.`,
        409,
      );
    }

    const result = await SalaryStructureTemplate.deleteOne(filter);
    if (result.deletedCount === 0) throw new AppError('Salary Structure not found.', 404);
    return { deleted: true };
  }

  // ─── Assigned Heads ────────────────────────────────────────────────────────

  static async getAssignedHeads(structureId: string, companyId?: string): Promise<ISalaryStructureHead[]> {
    if (!mongoose.Types.ObjectId.isValid(structureId)) throw new AppError('Invalid Salary Structure ID.', 400);
    const filter: Record<string, unknown> = { structure: structureId, isActive: true };
    if (companyId) filter.company = companyId;

    return SalaryStructureHead.find(filter)
      .populate('salaryHead', 'name printName headType displayOrder')
      .populate('structure', 'name')
      .sort({ showOrder: 1 })
      .lean() as unknown as ISalaryStructureHead[];
  }

  static async assignHead(data: Partial<ISalaryStructureHead>): Promise<ISalaryStructureHead> {
    // Duplicate (structure, salaryHead) is prevented by unique index — but we
    // give a clearer error message than Mongoose's default.
    const existing = await SalaryStructureHead.findOne({
      structure: data.structure,
      salaryHead: data.salaryHead,
    });
    if (existing) {
      if (existing.isActive) {
        throw new AppError('This Salary Head is already assigned to this Structure.', 409);
      }
      // Reactivate + overwrite the previous assignment rather than insert new.
      Object.assign(existing, data, { isActive: true });
      await existing.save();
      return existing;
    }

    const row = await SalaryStructureHead.create(data);
    return (await SalaryStructureHead.findById(row._id)
      .populate('salaryHead', 'name printName headType')
      .populate('structure', 'name')) as unknown as ISalaryStructureHead;
  }

  static async updateAssignedHead(
    id: string,
    data: Partial<ISalaryStructureHead>,
    companyId?: string,
  ): Promise<ISalaryStructureHead> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid assignment ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const row = await SalaryStructureHead.findOneAndUpdate(filter, { $set: data }, { new: true, runValidators: true })
      .populate('salaryHead', 'name printName headType')
      .populate('structure', 'name');
    if (!row) throw new AppError('Assignment not found.', 404);
    return row;
  }

  static async removeAssignedHead(id: string, companyId?: string): Promise<{ removed: true }> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid assignment ID.', 400);
    const filter: Record<string, unknown> = { _id: id };
    if (companyId) filter.company = companyId;

    const row = await SalaryStructureHead.findOneAndDelete(filter);
    if (!row) throw new AppError('Assignment not found.', 404);
    return { removed: true };
  }

  /**
   * Bulk-assign one salary structure to a list of employees. Writes into each
   * EmployeeProfile via the $set operator on the designated salary sub-doc or
   * a dedicated reference field.
   *
   * Note: this writes `salaryStructure` as a bare ObjectId on EmployeeProfile.
   * That keeps the integration decoupled from the legacy hardcoded Payroll.
   */
  static async bulkAssignToEmployees(
    employeeIds: string[],
    structureId: string,
    options: { pfApplicable?: boolean; esicApplicable?: boolean } = {},
    companyId?: string,
  ): Promise<{ matched: number; modified: number }> {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new AppError('No employees provided', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(structureId)) {
      throw new AppError('Invalid structure ID', 400);
    }
    const filter: Record<string, unknown> = { _id: { $in: employeeIds } };
    if (companyId) filter.company = companyId;
    const result = await EmployeeProfile.updateMany(filter, {
      $set: {
        salaryStructure: structureId,
        ...(options.pfApplicable !== undefined ? { pfApplicable: options.pfApplicable } : {}),
        ...(options.esicApplicable !== undefined ? { esicApplicable: options.esicApplicable } : {}),
      },
    });
    return {
      matched: (result as any).matchedCount ?? 0,
      modified: (result as any).modifiedCount ?? 0,
    };
  }

  /**
   * Apply a percentage appraisal to the basic/gross of many employees.
   * If no percent given (0), this is a no-op.
   */
  static async bulkAppraisal(
    employeeIds: string[],
    percent: number,
    companyId?: string,
  ): Promise<{ matched: number; modified: number }> {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new AppError('No employees provided', 400);
    }
    if (!percent || percent <= 0) {
      throw new AppError('Appraisal percent must be > 0', 400);
    }
    const factor = 1 + percent / 100;

    // Mongoose's $mul applies multiplication server-side without a round-trip.
    const filter: Record<string, unknown> = { _id: { $in: employeeIds } };
    if (companyId) filter.company = companyId;
    const result = await EmployeeProfile.updateMany(filter, {
      $mul: {
        'salary.basic': factor,
        'salary.grossSalary': factor,
        'salary.netSalary': factor,
        'salary.ctc': factor,
      },
    } as any);
    return {
      matched: (result as any).matchedCount ?? 0,
      modified: (result as any).modifiedCount ?? 0,
    };
  }
}
