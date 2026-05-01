import mongoose from 'mongoose';
import config from './index.js';

let connectionPromise: Promise<void> | null = null;
let listenersRegistered = false;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  const conn = mongoose.connection;

  if (!listenersRegistered) {
    listenersRegistered = true;

    conn.on('connected', () => {
      console.log(`[MongoDB] Connected to database`);
    });

    conn.on('error', (err: Error) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    conn.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
    });
  }

  connectionPromise = mongoose
    .connect(config.mongodb.uri, {
      autoIndex: config.mongodb.autoIndex,
      serverSelectionTimeoutMS: config.mongodb.serverSelectionTimeoutMs,
    })
    .then(() => undefined)
    .catch((error) => {
      connectionPromise = null;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[MongoDB] Initial connection failed: ${message}`);
      process.exit(1);
    });

  return connectionPromise;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected gracefully');
}
