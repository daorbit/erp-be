import User from '../modules/auth/auth.model.js';
import { UserRole } from '../shared/types.js';

/**
 * Creates a default Platform Admin user if no users exist in the database.
 * This is the application-level admin who manages companies — no company association.
 * Runs automatically on server startup — safe to call multiple times.
 */
export async function seedAdminUser(): Promise<void> {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    // Platform admin has no company — they manage the entire platform
    const admin = await User.create({
      firstName: 'Platform',
      lastName: 'Admin',
      email: 'admin@sheeraj.com',
      password: 'Admin@123',
      phone: '+91 9999999999',
      role: UserRole.SUPER_ADMIN,
      employeeId: 'PLATFORM-001',
      isActive: true,
    });

    console.log('[SEED] Default platform admin created:');
    console.log('[SEED]   Email:    admin@sheeraj.com');
    console.log('[SEED]   Password: Admin@123');
    console.log('[SEED]   Role:     Platform Admin (super_admin)');
    console.log('[SEED]   Company:  None (platform-level)');
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
