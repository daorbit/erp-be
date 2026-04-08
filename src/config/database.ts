import mongoose from 'mongoose';
import config from './index.js';

export async function connectDB(): Promise<void> {
  const conn = mongoose.connection;

  conn.on('connected', () => {
    console.log(`[MongoDB] Connected to database`);
  });

  conn.on('error', (err: Error) => {
    console.error(`[MongoDB] Connection error: ${err.message}`);
  });

  conn.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from database');
  });

  try {
    await mongoose.connect(config.mongodb.uri, {
      autoIndex: config.server.nodeEnv !== 'production',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[MongoDB] Initial connection failed: ${message}`);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected gracefully');
}
