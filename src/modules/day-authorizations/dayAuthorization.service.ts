import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler.js';
import DayAuthorization, { type IDayAuthorizationRow } from './dayAuthorization.model.js';

// Default scaffold — shown as "empty" rows in the UI until user customises.
const DEFAULT_MODULES: Array<{ moduleName: string; entities: string[] }> = [
  {
    moduleName: 'HUMAN-RESOURCE',
    entities: [
      'Advance', 'Attendance Entry', 'Employee Group Transfer', 'Employee Site Transfer',
      'Loan Application', 'OD Entry', 'Other Addition', 'Other Deduction',
      'Salary Calculation', 'Sim Allotment', 'Sim Bill Entry', 'Sim Surrender',
    ],
  },
];

export class DayAuthorizationService {
  /**
   * Return stored rows for a user, falling back to the default module/entity
   * scaffold with unlimited adds/edits and blocked deletes.
   */
  static async getForUser(userId: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
    const stored = await DayAuthorization.find({ user: userId, company: companyId }).lean();
    const storedMap = new Map<string, IDayAuthorizationRow>();
    for (const row of stored as any[]) storedMap.set(`${row.moduleName}::${row.entityName}`, row);

    const rows: any[] = [];
    for (const m of DEFAULT_MODULES) {
      for (const entity of m.entities) {
        const key = `${m.moduleName}::${entity}`;
        const row = storedMap.get(key);
        rows.push(row ?? {
          moduleName: m.moduleName,
          entityName: entity,
          addLimit: 1000,
          editLimit: 1000,
          deleteLimit: -1,
        });
      }
    }
    return rows;
  }

  /**
   * Upsert many rows at once — the UI submits the whole table back.
   */
  static async saveBulk(userId: string, companyId: string, rows: Array<Partial<IDayAuthorizationRow>>) {
    const ops = rows.map((row) => ({
      updateOne: {
        filter: {
          user: userId,
          moduleName: row.moduleName,
          entityName: row.entityName,
          company: companyId,
        },
        update: {
          $set: {
            addLimit: row.addLimit ?? 1000,
            editLimit: row.editLimit ?? 1000,
            deleteLimit: row.deleteLimit ?? -1,
          },
          $setOnInsert: {
            user: userId,
            moduleName: row.moduleName,
            entityName: row.entityName,
            company: companyId,
          },
        },
        upsert: true,
      },
    }));
    if (ops.length > 0) await DayAuthorization.bulkWrite(ops as any);
    return { saved: ops.length };
  }
}
