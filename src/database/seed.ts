import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../modules/auth/auth.model.js';
import { UserRole } from '../shared/types.js';

const ADMIN_USER = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'admin@sheeraj.com',
  password: 'Admin@123',
  phone: '+91 9999999999',
  role: UserRole.SUPER_ADMIN,
  employeeId: 'EMP-2024-001',
  isActive: true,
};

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_USER.email });
    if (existing) {
      console.log('Admin user already exists:');
      console.log(`  Email:    ${existing.email}`);
      console.log(`  Role:     ${existing.role}`);
      console.log(`  Name:     ${existing.firstName} ${existing.lastName}`);
      console.log('\nSkipping seed. No changes made.');
    } else {
      const admin = await User.create(ADMIN_USER);
      console.log('Default admin user created successfully!\n');
      console.log('  ┌─────────────────────────────────────┐');
      console.log('  │  LOGIN CREDENTIALS                  │');
      console.log('  ├─────────────────────────────────────┤');
      console.log(`  │  Email:    ${ADMIN_USER.email}     │`);
      console.log(`  │  Password: ${ADMIN_USER.password}            │`);
      console.log('  │  Role:     Super Admin              │');
      console.log('  └─────────────────────────────────────┘');
      console.log(`\n  User ID: ${admin._id}`);
    }
  } catch (error: any) {
    console.error('Seed failed:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error — admin may already exist with that email or employeeId.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
