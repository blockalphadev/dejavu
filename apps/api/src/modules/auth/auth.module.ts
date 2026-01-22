import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy, GoogleStrategy, WalletStrategy } from './strategies/index.js';
import { JwtAuthGuard, CsrfGuard } from './guards/index.js';
import { UsersModule } from '../users/users.module.js';
import { PasswordValidator } from './validators/index.js';
import { TokenBlacklistService, SecurityEventService } from './services/index.js';
import { WalletConnectService } from './services/wallet-connect.service.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
                },
            }),
        }),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        WalletConnectService,
        JwtStrategy,
        GoogleStrategy,
        WalletStrategy,
        JwtAuthGuard,
        CsrfGuard,
        PasswordValidator,
        TokenBlacklistService,
        SecurityEventService,
    ],
    exports: [
        AuthService,
        WalletConnectService,
        JwtAuthGuard,
        CsrfGuard,
        PasswordValidator,
        TokenBlacklistService,
        SecurityEventService,
    ],
})
export class AuthModule { }

