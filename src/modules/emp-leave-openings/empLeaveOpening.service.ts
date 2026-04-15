import { AppError } from '../../middleware/errorHandler.js';
import EmpLeaveOpening from './empLeaveOpening.model.js';

export class EmpLeaveOpeningService {
  static async getAll(filters: Record<string, any>, companyId: string) {
    const filter: Record<string, unknown> = { company: companyId };
    if (filters.employee) filter.employee = filters.employee;
    if (filters.finyear) filter.finyear = filters.finyear;
    return EmpLeaveOpening.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('leaveType', 'name code')
      .populate('finyear', 'label dateFrom dateTo')
      .lean();
  }

  static async upsertBulk(rows: Array<{ employee: string; leaveType: string; finyear: string; openingBalance: number }>, companyId: string) {
    if (!rows || rows.length === 0) throw new AppError('No rows provided', 400);
    const ops = rows.map((row) => ({
      updateOne: {
        filter: { employee: row.employee, leaveType: row.leaveType, finyear: row.finyear, company: companyId },
        update: { $set: { openingBalance: row.openingBalance } },
        upsert: true,
      },
    }));
    await EmpLeaveOpening.bulkWrite(ops as any);
    return { saved: ops.length };
  }
}
