import { z } from 'zod';

/**
 * Environment variable validation schema using Zod
 * Ensures all required env vars are present and correctly typed
 */
export const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
    API_PREFIX: z.string().default('api/v1'),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Database
    DATABASE_URL: z.string().min(1),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Google OAuth (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    // Security
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('60000'),
    RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default('100'),
    RATE_LIMIT_AUTH_MAX: z.string().transform(Number).pipe(z.number().positive()).default('5'),

    // Brute Force Protection
    LOCKOUT_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).default('5'),
    LOCKOUT_DURATION_MINUTES: z.string().transform(Number).pipe(z.number().positive()).default('15'),

    // Encryption (optional, for sensitive data at rest)
    ENCRYPTION_KEY: z.string().optional(),

    // CSRF Protection
    CSRF_SECRET: z.string().min(32).optional(),

    // Token Blacklist
    TOKEN_BLACKLIST_TTL_MS: z.string().transform(Number).pipe(z.number().positive()).default('604800000'), // 7 days

    // Security Events
    PERSIST_SECURITY_EVENTS: z.string().transform(val => val === 'true').default('false'),

    // Cookies
    COOKIE_DOMAIN: z.string().default('localhost'),
    COOKIE_SECURE: z.string().transform(val => val === 'true').default('false'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

    // Logging & Monitoring
    LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('debug'),
    ENABLE_AUDIT_LOG: z.string().transform(val => val !== 'false').default('true'),

    // Session (optional)
    SESSION_SECRET: z.string().optional(),

    // Trusted Proxies (for production behind load balancer)
    TRUSTED_PROXIES: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

