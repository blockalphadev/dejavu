import { Module, Global } from '@nestjs/common';
import { SecurityService } from './security.service.js';
import { RateLimitGuard, IpBlacklistGuard, DeviceFingerprintGuard } from './guards/index.js';
import { DatabaseModule } from '../../database/database.module.js';

/**
 * SecurityModule
 * 
 * Provides security services and guards globally.
 * Includes:
 * - Rate limiting
 * - IP blacklisting
 * - Suspicious activity detection
 * - Device fingerprint tracking
 * - Withdrawal limits
 */
@Global()
@Module({
    imports: [DatabaseModule],
    providers: [
        SecurityService,
        RateLimitGuard,
        IpBlacklistGuard,
        DeviceFingerprintGuard,
    ],
    exports: [
        SecurityService,
        RateLimitGuard,
        IpBlacklistGuard,
        DeviceFingerprintGuard,
    ],
})
export class SecurityModule { }
