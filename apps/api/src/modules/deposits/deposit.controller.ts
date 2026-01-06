import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { DepositService } from './deposit.service.js';
import { PrivyService } from './services/privy.service.js';
import {
    InitiateDepositDto,
    VerifyDepositDto,
    DepositHistoryQueryDto,
    BalanceResponseDto,
    InitiateDepositResponseDto,
    DepositTransactionDto,
    DepositChain,
    InitiateWithdrawalDto,
    ConfirmWithdrawalDto,
    WithdrawalResponseDto,
} from './dto/index.js';

/**
 * Wallet response DTO
 */
class WalletResponseDto {
    address: string;
    chain: string;
    walletType: string;
    createdAt: string;
}

/**
 * DepositController
 * 
 * Handles deposit operations with enterprise-grade security.
 * All endpoints require JWT authentication.
 */
@ApiTags('Deposits')
@ApiBearerAuth()
@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {
    private readonly logger = new Logger(DepositController.name);

    constructor(
        private readonly depositService: DepositService,
        private readonly privyService: PrivyService,
    ) { }

    /**
     * Get current user's balance
     */
    @Get('balance')
    @ApiOperation({
        summary: 'Get user balance',
        description: 'Returns the current balance, locked balance, and available balance for the authenticated user.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Balance retrieved successfully',
        type: BalanceResponseDto,
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
    async getBalance(@CurrentUser('id') userId: string): Promise<BalanceResponseDto> {
        this.logger.debug(`Getting balance for user ${userId}`);
        return this.depositService.getBalance(userId);
    }

    /**
     * Generate or get deposit wallet address
     */
    @Post('wallet/generate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Generate deposit wallet',
        description: 'Creates or retrieves a Privy embedded wallet for the user on the specified chain. This wallet address can be used to receive deposits.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                chain: { type: 'string', enum: ['ethereum', 'base', 'solana', 'sui'], default: 'base' },
                privyUserId: { type: 'string', description: 'Privy user ID from frontend' },
            },
            required: ['privyUserId'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Wallet generated or retrieved successfully',
        type: WalletResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid chain or Privy not configured' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
    async generateWallet(
        @CurrentUser('id') userId: string,
        @Body() body: { chain?: string; privyUserId?: string },
    ): Promise<WalletResponseDto> {
        const chain = (body.chain || 'base') as string;

        this.logger.log(`Generating wallet for user ${userId} on ${chain}`);

        // Use the authenticated user ID (UUID) directly
        // The service will handle mapping to Privy DID (importing if needed)
        const wallet = await this.depositService.getOrCreateDepositWallet(userId, chain);

        return {
            address: wallet.address,
            chain: wallet.chain,
            walletType: wallet.walletType,
            createdAt: wallet.createdAt,
        };
    }

    /**
     * Get user's deposit wallet for a chain
     */
    @Get('wallet/:chain')
    @ApiOperation({
        summary: 'Get deposit wallet',
        description: 'Get the user\'s deposit wallet address for a specific chain.',
    })
    @ApiParam({ name: 'chain', enum: ['ethereum', 'base', 'solana', 'sui'] })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Wallet retrieved successfully',
        type: WalletResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No wallet found for this chain' })
    async getWallet(
        @CurrentUser('id') userId: string,
        @Param('chain') chain: string,
    ): Promise<WalletResponseDto | null> {
        this.logger.debug(`Getting wallet for user ${userId} on ${chain}`);
        return this.depositService.getPrivyWallet(userId, chain as DepositChain);
    }

    /**
     * Initiate a new deposit
     */
    @Post('initiate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Initiate deposit',
        description: 'Initiates a new deposit and returns a nonce and deposit address. The nonce must be used within 5 minutes.',
    })
    @ApiBody({ type: InitiateDepositDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Deposit initiated successfully',
        type: InitiateDepositResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid amount or chain' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
    async initiateDeposit(
        @CurrentUser('id') userId: string,
        @Body() dto: InitiateDepositDto,
    ): Promise<InitiateDepositResponseDto> {
        this.logger.log(`Initiating deposit for user ${userId}: ${dto.amount} ${dto.chain}`);
        return this.depositService.initiateDeposit(userId, dto);
    }

    /**
     * Verify and confirm a deposit
     */
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify deposit',
        description: 'Verifies the blockchain transaction and confirms the deposit, crediting the user\'s balance.',
    })
    @ApiBody({ type: VerifyDepositDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Deposit verified and confirmed',
        type: DepositTransactionDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid nonce or transaction' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deposit not found or expired' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
    async verifyDeposit(
        @CurrentUser('id') userId: string,
        @Body() dto: VerifyDepositDto,
    ): Promise<DepositTransactionDto> {
        this.logger.log(`Verifying deposit for user ${userId}: ${dto.nonce}`);
        return this.depositService.verifyDeposit(userId, dto);
    }

    /**
     * Get deposit history
     */
    @Get('history')
    @ApiOperation({
        summary: 'Get deposit history',
        description: 'Returns paginated deposit transaction history for the authenticated user.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'History retrieved successfully',
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
    async getHistory(
        @CurrentUser('id') userId: string,
        @Query() query: DepositHistoryQueryDto,
    ): Promise<{ data: DepositTransactionDto[]; total: number }> {
        this.logger.debug(`Getting deposit history for user ${userId}`);
        return this.depositService.getHistory(userId, query);
    }

    /**
     * Initiate a withdrawal
     */
    @Post('withdraw')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Initiate withdrawal',
        description: 'Initiates a withdrawal request, locking user funds.',
    })
    @ApiBody({ type: InitiateWithdrawalDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Withdrawal initiated successfully',
        type: WithdrawalResponseDto,
    })
    async initiateWithdrawal(
        @CurrentUser('id') userId: string,
        @Body() dto: InitiateWithdrawalDto,
    ): Promise<WithdrawalResponseDto> {
        this.logger.log(`Initiating withdrawal for user ${userId}: ${dto.amount} ${dto.chain}`);
        return this.depositService.initiateWithdrawal(userId, dto);
    }

    /**
     * Confirm a withdrawal
     */
    @Post('withdraw/confirm')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Confirm withdrawal',
        description: 'Confirms a withdrawal transaction after blockchain transfer.',
    })
    @ApiBody({ type: ConfirmWithdrawalDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Withdrawal confirmed successfully',
        type: WithdrawalResponseDto,
    })
    async confirmWithdrawal(
        @CurrentUser('id') userId: string,
        @Body() dto: ConfirmWithdrawalDto,
    ): Promise<WithdrawalResponseDto> {
        this.logger.log(`Confirming withdrawal for user ${userId}: ${dto.withdrawalId}`);
        return this.depositService.confirmWithdrawal(userId, dto);
    }
}

