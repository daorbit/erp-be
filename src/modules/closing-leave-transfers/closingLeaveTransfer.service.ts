import ClosingLeaveTransfer from './closingLeaveTransfer.model.js';

export class ClosingLeaveTransferService {
  static async getAll(companyId: string, filters: Record<string, any> = {}) {
    const filter: Record<string, unknown> = { company: companyId };
    if (filters.employee) filter.employee = filters.employee;
    if (filters.fromFinyear) filter.fromFinyear = filters.fromFinyear;
    if (filters.toFinyear) filter.toFinyear = filters.toFinyear;
    return ClosingLeaveTransfer.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('leaveType', 'name code')
      .populate('fromFinyear', 'label')
      .populate('toFinyear', 'label')
      .lean();
  }

  static async transfer(rows: Array<{ employee: string; leaveType: string; fromFinyear: string; toFinyear: string; closingBalance: number; transferredBalance: number }>, companyId: string) {
    const ops = rows.map((r) => ({
      updateOne: {
        filter: { employee: r.employee, leaveType: r.leaveType, fromFinyear: r.fromFinyear, toFinyear: r.toFinyear, company: companyId },
        update: { $set: { closingBalance: r.closingBalance, transferredBalance: r.transferredBalance } },
        upsert: true,
      },
    }));
    if (ops.length > 0) await ClosingLeaveTransfer.bulkWrite(ops as any);
    return { saved: ops.length };
  }
}
