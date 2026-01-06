import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DepositController } from './deposit.controller.js';
import { DepositService } from './deposit.service.js';
import { PrivyService } from './services/privy.service.js';
import { DatabaseModule } from '../../database/database.module.js';

/**
 * DepositModule
 * 
 * Handles user deposits and balance management with Privy wallet integration.
 * Implements enterprise-grade security for financial transactions.
 */
@Module({
    imports: [
        ConfigModule,
        DatabaseModule,
    ],
    controllers: [DepositController],
    providers: [
        DepositService,
        PrivyService,
    ],
    exports: [DepositService],
})
export class DepositModule { }
