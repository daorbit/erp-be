import mongoose from 'mongoose';
import { config } from 'dotenv';
import { UserRole } from '../shared/types.js';

config(); // Load .env

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_hr';

/**
 * Migration script: Creates a default company and associates all existing
 * documents with it. Run once after upgrading to multi-tenant.
 *
 * Usage: npm run db:migrate-company
 */
async function migrateCompany(): Promise<void> {
  console.log('[MIGRATE] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[MIGRATE] Connected.');

  const db = mongoose.connection.db!;

  // 1. Create (or find) default company
  const companiesCol = db.collection('companies');
  const existing = await companiesCol.findOne({ code: 'DEFAULT' });

  let companyId: mongoose.Types.ObjectId;

  if (existing) {
    companyId = existing._id as mongoose.Types.ObjectId;
    console.log(`[MIGRATE] Default company already exists: ${companyId}`);
  } else {
    const result = await companiesCol.insertOne({
      name: 'Default Company',
      code: 'DEFAULT',
      email: 'admin@default.com',
      address: { country: 'India' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    companyId = result.insertedId as unknown as mongoose.Types.ObjectId;
    console.log(`[MIGRATE] Created default company: ${companyId}`);
  }

  // 2. Update all Users (except super_admin) with company
  const usersResult = await db.collection('users').updateMany(
    { role: { $ne: UserRole.SUPER_ADMIN }, company: { $exists: false } },
    { $set: { company: companyId } },
  );
  console.log(`[MIGRATE] Updated ${usersResult.modifiedCount} users`);

  // 3. Update all other collections
  const collections = [
    'departments',
    'designations',
    'employeeprofiles',
    'attendances',
    'leavetypes',
    'leaverequests',
    'leavebalances',
    'salarystructures',
    'payslips',
    'jobpostings',
    'jobapplications',
    'performancereviews',
    'goals',
    'trainingprograms',
    'documents',
    'holidays',

  ];

  for (const col of collections) {
    try {
      const result = await db.collection(col).updateMany(
        { company: { $exists: false } },
        { $set: { company: companyId } },
      );
      if (result.modifiedCount > 0) {
        console.log(`[MIGRATE] Updated ${result.modifiedCount} documents in ${col}`);
      }
    } catch {
      // Collection may not exist yet — skip
    }
  }

  console.log('[MIGRATE] Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrateCompany().catch((err) => {
  console.error('[MIGRATE] Migration failed:', err);
  process.exit(1);
});
