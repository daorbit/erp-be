import dotenv from 'dotenv';

dotenv.config();

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

const config = {
  mongodb: {
    uri: requiredEnv('MONGODB_URI'),
  },
  jwt: {
    secret: requiredEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  server: {
    port: parseInt(optionalEnv('PORT', '5000'), 10),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
  },
  cors: {
    origin: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },
  upload: {
    dir: optionalEnv('UPLOAD_DIR', './uploads'),
    maxFileSize: parseInt(optionalEnv('MAX_FILE_SIZE', '5242880'), 10),
  },
} as const;

export type Config = typeof config;

export default config;
