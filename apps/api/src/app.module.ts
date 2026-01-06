import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { MarketsModule } from './modules/markets/markets.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { DepositModule } from './modules/deposits/deposit.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { envSchema } from './config/env.validation.js';
import {
    LoggerMiddleware,
    RequestIdMiddleware,
    SecurityHeadersMiddleware,
    InputSanitizerMiddleware,
} from './common/middleware/index.js';
import { AuditLogInterceptor } from './common/interceptors/index.js';

@Module({
    imports: [
        // Configuration with validation
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
            validate: (config) => envSchema.parse(config),
            cache: true,
        }),

        // Database
        DatabaseModule,

        // Feature Modules
        AuthModule,
        UsersModule,
        DashboardModule,
        MarketsModule,
        OrdersModule,
        DepositModule,
    ],
    controllers: [HealthController],
    providers: [
        AuditLogInterceptor,
    ],
    exports: [
        AuditLogInterceptor,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply security middlewares to all routes
        consumer
            .apply(
                RequestIdMiddleware,      // Generate request ID first
                SecurityHeadersMiddleware, // Add security headers
                LoggerMiddleware,          // Log requests with ID
            )
            .forRoutes('*');

        // Apply input sanitizer to routes that accept body
        consumer
            .apply(InputSanitizerMiddleware)
            .forRoutes(
                { path: '*', method: RequestMethod.POST },
                { path: '*', method: RequestMethod.PUT },
                { path: '*', method: RequestMethod.PATCH },
            );
    }
}

