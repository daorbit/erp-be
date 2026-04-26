import dotenv from 'dotenv';
dotenv.config();

import config from './config/index.js';
import { connectDB } from './config/database.js';
import app from './app.js';
import { seedAdminUser } from './database/autoSeed.js';
import { seedIndianStates } from './database/seedStates.js';
import { syncSchemaIndexes } from './database/syncSchemaIndexes.js';
import { startShiftScheduler, stopShiftScheduler } from './modules/shifts/shiftScheduler.js';

// ─── Unhandled rejection handler ─────────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  // Give the server time to finish ongoing requests, then exit
  server?.close(() => {
    process.exit(1);
  });
  // Force exit after 10 s if graceful shutdown stalls
  setTimeout(() => process.exit(1), 10_000).unref();
});

// ─── Uncaught exception handler ──────────────────────────────────────────────
process.on('uncaughtException', (error: Error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

// ─── SIGTERM handler ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
  stopShiftScheduler();
  server?.close(() => {
    console.log('[SERVER] Process terminated.');
    process.exit(0);
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
let server: ReturnType<typeof app.listen> | undefined;

async function bootstrap(): Promise<void> {
  try {
    await connectDB();
    // Drop indexes no longer declared in any schema (e.g. the legacy `code_1`
    // unique index on departments). Idempotent — cheap on subsequent boots.
    await syncSchemaIndexes();
    await seedAdminUser();
    await seedIndianStates();

    server = app.listen(config.server.port, () => {
      console.log(
        `[SERVER] Running on port ${config.server.port} in ${config.server.nodeEnv} mode`,
      );
    });

    // Start shift reminder scheduler
    startShiftScheduler();
  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
