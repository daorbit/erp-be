import dotenv from "dotenv";

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

function parseCorsOrigin(value: string): string | string[] {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}

const config = {
  mongodb: {
    uri: requiredEnv("MONGODB_URI"),
  },
  jwt: {
    secret: requiredEnv("JWT_SECRET"),
    expiresIn: optionalEnv("JWT_EXPIRES_IN", "7d"),
    refreshExpiresIn: optionalEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  server: {
    port: parseInt(optionalEnv("PORT", "5000"), 10),
    nodeEnv: optionalEnv("NODE_ENV", "development"),
  },
  cors: {
    origin: parseCorsOrigin(
      optionalEnv(
        "CORS_ORIGIN",
        "http://localhost:3000,https://erp-fe-beta.vercel.app,http://localhost:8080,https://lovable.dev,https://id-preview--75024a70-623a-4fd1-a4b0-229c36d7644c.lovable.app",
      ),
    ),
  },
  upload: {
    dir: optionalEnv("UPLOAD_DIR", "./uploads"),
    maxFileSize: parseInt(optionalEnv("MAX_FILE_SIZE", "5242880"), 10),
  },
} as const;

export type Config = typeof config;

export default config;
