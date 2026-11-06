require('dotenv').config({ quiet: true });
const { z } = require('zod');

const production = process.env.NODE_ENV === 'production';
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@localhost:5432/venue'),
  ADMIN_EMAIL: z.string().trim().toLowerCase().email().default('admin@playspot.local'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must contain at least 8 characters')
    .default('admin123'),
  JWT_SECRET: z
    .string()
    .min(production ? 32 : 1, 'JWT_SECRET must contain at least 32 characters')
    .default('local-development-secret-change-in-production'),
  APP_TZ: z
    .string()
    .default('Asia/Kolkata')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'APP_TZ must be a valid IANA timezone'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default(production ? 'true' : 'false')
    .transform((v) => v === 'true'),
  // Empty means "print emails to the API console" (local development).
  SMTP_URL: z.preprocess(
    (v) => v || undefined,
    z.string().url('SMTP_URL must look like smtp://user:pass@host:587').optional(),
  ),
  MAIL_FROM: z.string().default('PlaySpot <no-reply@playspot.local>'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default(production ? 'true' : 'false')
    .transform((v) => v === 'true'),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment: ${message}`);
}
const env = result.data;
if (production && env.ADMIN_PASSWORD === 'admin123')
  throw new Error('Invalid environment: set a strong ADMIN_PASSWORD in production');

module.exports = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD,
  jwtSecret: env.JWT_SECRET,
  timeZone: env.APP_TZ,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
  cookieSecure: env.COOKIE_SECURE,
  trustProxy: env.TRUST_PROXY,
  smtpUrl: env.SMTP_URL,
  mailFrom: env.MAIL_FROM,
  production,
};
