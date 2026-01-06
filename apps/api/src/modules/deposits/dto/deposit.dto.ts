import {
    IsString,
    IsNumber,
    IsPositive,
    IsEnum,
    IsOptional,
    Min,
    Max,
    MaxLength,
    Matches,
    IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Supported blockchain networks for deposits
 */
export enum DepositChain {
    ETHEREUM = 'ethereum',
    SOLANA = 'solana',
    SUI = 'sui',
    BASE = 'base',
}

/**
 * Deposit transaction status
 */
export enum DepositStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    FAILED = 'failed',
    EXPIRED = 'expired',
}

/**
 * DTO for initiating a new deposit
 */
export class InitiateDepositDto {
    @ApiProperty({
        description: 'Amount to deposit in USD',
        example: 100.00,
        minimum: 1,
        maximum: 100000,
    })
    @IsNumber({ maxDecimalPlaces: 8 })
    @IsPositive()
    @Min(1, { message: 'Minimum deposit amount is $1' })
    @Max(100000, { message: 'Maximum deposit amount is $100,000' })
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'Blockchain network for deposit',
        enum: DepositChain,
        example: DepositChain.BASE,
    })
    @IsEnum(DepositChain, { message: 'Invalid chain. Supported: ethereum, solana, sui, base' })
    chain: DepositChain;
}

/**
 * DTO for verifying/confirming a deposit transaction
 */
export class VerifyDepositDto {
    @ApiProperty({
        description: 'Unique nonce from initiation',
        example: 'dep_abc123xyz',
    })
    @IsString()
    @MaxLength(64)
    @Matches(/^dep_[a-zA-Z0-9]+$/, { message: 'Invalid nonce format' })
    nonce: string;

    @ApiProperty({
        description: 'Transaction hash from blockchain',
        example: '0x1234567890abcdef...',
    })
    @IsString()
    @MaxLength(128)
    @Matches(/^(0x[a-fA-F0-9]{64}|[1-9A-HJ-NP-Za-km-z]{87,88})$/, {
        message: 'Invalid transaction hash format',
    })
    txHash: string;

    @ApiPropertyOptional({
        description: 'Privy authentication token (if using embedded wallet)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    privyToken?: string;
}

/**
 * DTO for querying deposit history
 */
export class DepositHistoryQueryDto {
    @ApiPropertyOptional({
        description: 'Page number (1-indexed)',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: DepositStatus,
    })
    @IsOptional()
    @IsEnum(DepositStatus)
    status?: DepositStatus;

    @ApiPropertyOptional({
        description: 'Filter by chain',
        enum: DepositChain,
    })
    @IsOptional()
    @IsEnum(DepositChain)
    chain?: DepositChain;
}

/**
 * Response DTO for user balance
 */
export class BalanceResponseDto {
    @ApiProperty({ example: '1000.00' })
    balance: string;

    @ApiProperty({ example: '50.00' })
    lockedBalance: string;

    @ApiProperty({ example: '950.00' })
    availableBalance: string;

    @ApiProperty({ example: 'USDC' })
    currency: string;
}

/**
 * Response DTO for deposit initiation
 */
export class InitiateDepositResponseDto {
    @ApiProperty({ example: 'dep_abc123xyz' })
    nonce: string;

    @ApiProperty({ example: '0x1234...5678' })
    depositAddress: string;

    @ApiProperty({ example: 300 })
    expiresInSeconds: number;

    @ApiProperty({ example: '100.00' })
    amount: string;

    @ApiProperty({ example: 'base' })
    chain: string;
}

/**
 * Response DTO for deposit transaction
 */
export class DepositTransactionDto {
    @ApiProperty({ example: 'uuid-here' })
    id: string;

    @ApiProperty({ example: '100.00' })
    amount: string;

    @ApiProperty({ example: 'USDC' })
    currency: string;

    @ApiProperty({ example: 'base' })
    chain: string;

    @ApiProperty({ example: '0x1234...5678' })
    txHash: string | null;

    @ApiProperty({ enum: DepositStatus, example: 'confirmed' })
    status: DepositStatus;

    @ApiProperty({ example: '2026-01-06T12:00:00Z' })
    createdAt: string;

    @ApiProperty({ example: '2026-01-06T12:01:00Z' })
    confirmedAt: string | null;
}
