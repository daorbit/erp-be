import dayjs from 'dayjs';
import User from '../auth/auth.model.js';
import Company from '../companies/company.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import Department from '../departments/department.model.js';
import { UserRole } from '../../shared/types.js';

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalEmployeeProfiles: number;
  totalDepartments: number;
  recentCompanies: number;
  roleDistribution: {
    admins: number;
    hrManagers: number;
    managers: number;
    employees: number;
  };
}

interface CompanyOverview {
  _id: string;
  name: string;
  code: string;
  email: string;
  industry?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  userCount: number;
  departmentCount: number;
}

interface CompanyGrowth {
  month: string;
  companies: number;
}

export class PlatformDashboardService {
  /**
   * High-level platform statistics for the application admin.
   */
  static async getStats(): Promise<PlatformStats> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalEmployeeProfiles,
      totalDepartments,
      recentCompanies,
      admins,
      hrManagers,
      managers,
      employees,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: { $ne: UserRole.SUPER_ADMIN } }),
      EmployeeProfile.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Company.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ isActive: true, role: UserRole.ADMIN }),
      User.countDocuments({ isActive: true, role: UserRole.HR_MANAGER }),
      User.countDocuments({ isActive: true, role: UserRole.MANAGER }),
      User.countDocuments({ isActive: true, role: UserRole.EMPLOYEE }),
    ]);

    return {
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalEmployeeProfiles,
      totalDepartments,
      recentCompanies,
      roleDistribution: { admins, hrManagers, managers, employees },
    };
  }

  /**
   * Overview of each *tenant group* with rolled-up user and department
   * counts. One row per main (parent) company — sibling companies are not
   * listed separately; their users/departments are aggregated into the
   * main company's row. This matches platform-admin mental model: each
   * row is one tenant, not one legal entity.
   */
  static async getCompanyOverviews(): Promise<CompanyOverview[]> {
    // Main companies only: no parentCompany set.
    const mains = await Company.find({
      $or: [{ parentCompany: { $exists: false } }, { parentCompany: null }],
    }).sort({ createdAt: -1 }).lean();

    const overviews: CompanyOverview[] = [];

    for (const main of mains) {
      // Resolve every company that belongs to this group (the main itself
      // plus any companies whose parentCompany points at it).
      const siblings = await Company.find({ parentCompany: main._id })
        .select('_id')
        .lean();
      const groupIds = [main._id, ...siblings.map((s) => s._id)];

      const [userCount, departmentCount] = await Promise.all([
        User.countDocuments({ company: { $in: groupIds }, isActive: true }),
        Department.countDocuments({ company: { $in: groupIds }, isActive: true }),
      ]);

      overviews.push({
        _id: main._id.toString(),
        name: main.name,
        code: main.code,
        email: main.email,
        industry: main.industry,
        logo: main.logo,
        isActive: main.isActive,
        createdAt: main.createdAt,
        userCount,
        departmentCount,
      });
    }

    return overviews;
  }

  /**
   * Company creation trend over the last 12 months.
   */
  static async getCompanyGrowth(): Promise<CompanyGrowth[]> {
    const twelveMonthsAgo = dayjs().subtract(11, 'month').startOf('month').toDate();

    const pipeline = await Company.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill all 12 months even if no companies were created
    const result: CompanyGrowth[] = [];
    for (let i = 0; i < 12; i++) {
      const d = dayjs().subtract(11 - i, 'month');
      const year = d.year();
      const month = d.month() + 1;
      const found = pipeline.find((p: any) => p._id.year === year && p._id.month === month);
      result.push({
        month: d.format('MMM'),
        companies: found?.count ?? 0,
      });
    }

    return result;
  }

  /**
   * User count grouped by company (top companies).
   */
  static async getUserDistribution(): Promise<Array<{ company: string; code: string; users: number }>> {
    const result = await User.aggregate([
      { $match: { isActive: true, company: { $exists: true, $ne: null } } },
      { $group: { _id: '$company', users: { $sum: 1 } } },
      { $sort: { users: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyInfo',
          pipeline: [{ $project: { name: 1, code: 1 } }],
        },
      },
      { $unwind: '$companyInfo' },
      {
        $project: {
          company: '$companyInfo.name',
          code: '$companyInfo.code',
          users: 1,
        },
      },
    ]);

    return result;
  }
}
