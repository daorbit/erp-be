import User from '../modules/auth/auth.model.js';
import { UserRole } from '../shared/types.js';

/**
 * Creates a default Super Admin user if no users exist in the database.
 * Runs automatically on server startup — safe to call multiple times.
 */
export async function seedAdminUser(): Promise<void> {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@sheeraj.com',
      password: 'Admin@123',
      phone: '+91 9999999999',
      role: UserRole.SUPER_ADMIN,
      employeeId: 'EMP-2024-001',
      isActive: true,
    });

    console.log('[SEED] Default admin user created:');
    console.log('[SEED]   Email:    admin@sheeraj.com');
    console.log('[SEED]   Password: Admin@123');
    console.log('[SEED]   Role:     Super Admin');
    console.log(`[SEED]   ID:       ${admin._id}`);
  } catch (error: any) {
    // Don't crash the server if seeding fails
    if (error.code === 11000) {
      // Duplicate key — admin already exists, silently skip
      return;
    }
    console.error('[SEED] Failed to create admin user:', error.message);
  }
}
