import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/index.js';
import { AuditLogInterceptor } from './common/interceptors/index.js';

/**
 * Bootstrap the NestJS application with comprehensive security configuration
 */
async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3001);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    // ===================
    // Security Middleware
    // ===================

    // Helmet - Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        crossOriginEmbedderPolicy: false, // Required for some OAuth flows
    }));

    // Compression
    app.use(compression());

    // ===================
    // CORS Configuration
    // ===================
    const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:5173');
    app.enableCors({
        origin: corsOrigins.split(',').map(origin => origin.trim()),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
        exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
        maxAge: 86400, // 24 hours
    });

    // ===================
    // Rate Limiting
    // ===================
    const rateLimitWindowMs = configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000);
    const rateLimitMax = configService.get<number>('RATE_LIMIT_MAX', 100);
    const rateLimitAuthMax = configService.get<number>('RATE_LIMIT_AUTH_MAX', 5);

    // General rate limiter
    app.use(rateLimit({
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
        message: {
            statusCode: 429,
            message: 'Too many requests. Please try again later.',
            error: 'Too Many Requests',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.url === '/health',
        keyGenerator: (req) => {
            // Use X-Forwarded-For if behind proxy, otherwise use IP
            const forwardedFor = req.headers['x-forwarded-for'];
            if (forwardedFor) {
                const ips = Array.isArray(forwardedFor)
                    ? forwardedFor[0]
                    : forwardedFor.split(',')[0];
                return ips.trim();
            }
            return req.ip || 'unknown';
        },
    }));

    // Stricter rate limiting for auth endpoints
    app.use('/api/v1/auth', rateLimit({
        windowMs: rateLimitWindowMs,
        max: rateLimitAuthMax,
        message: {
            statusCode: 429,
            message: 'Too many authentication attempts. Please try again later.',
            error: 'Too Many Requests',
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const forwardedFor = req.headers['x-forwarded-for'];
            if (forwardedFor) {
                const ips = Array.isArray(forwardedFor)
                    ? forwardedFor[0]
                    : forwardedFor.split(',')[0];
                return ips.trim();
            }
            return req.ip || 'unknown';
        },
    }));

    // ===================
    // Global Pipes
    // ===================
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true, // Strip unknown properties
        forbidNonWhitelisted: true, // Throw error on unknown properties
        transform: true, // Auto-transform payloads to DTO instances
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: nodeEnv === 'production',
    }));

    // ===================
    // Global Exception Filter
    // ===================
    app.useGlobalFilters(new GlobalExceptionFilter());

    // ===================
    // Global Interceptors
    // ===================
    const auditInterceptor = app.get(AuditLogInterceptor);
    app.useGlobalInterceptors(auditInterceptor);

    // ===================
    // API Prefix
    // ===================
    app.setGlobalPrefix(apiPrefix);

    // ===================
    // Graceful Shutdown
    // ===================
    app.enableShutdownHooks();

    // ===================
    // Swagger Documentation
    // ===================
    if (nodeEnv !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('DeJaVu API')
            .setDescription('The DeJaVu API documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }

    // ===================
    // Trust Proxy (for production behind load balancer)
    // ===================
    const trustedProxies = configService.get<string>('TRUSTED_PROXIES');
    if (trustedProxies) {
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.set('trust proxy', trustedProxies.split(',').map(p => p.trim()));
    }

    await app.listen(port);

    logger.log(`🚀 DeJaVu API running on http://localhost:${port}/${apiPrefix}`);
    if (nodeEnv !== 'production') {
        logger.log(`📚 Swagger UI: http://localhost:${port}/docs`);
    }
    logger.log(`📝 Environment: ${nodeEnv}`);
    logger.log(`🔒 CORS enabled for: ${corsOrigins}`);
    logger.log(`📊 Rate limiting: ${rateLimitMax} req/${rateLimitWindowMs}ms (auth: ${rateLimitAuthMax})`);
    logger.log(`📋 Audit logging: ${configService.get('ENABLE_AUDIT_LOG') ? 'enabled' : 'disabled'}`);
}

bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
