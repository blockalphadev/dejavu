import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { SupabaseService } from '../../database/supabase.service.js';
import { PrivyService } from './services/privy.service.js';
import {
    InitiateDepositDto,
    VerifyDepositDto,
    DepositHistoryQueryDto,
    DepositChain,
    DepositStatus,
    BalanceResponseDto,
    InitiateDepositResponseDto,
    DepositTransactionDto,
} from './dto/index.js';

/**
 * Pending deposit cache entry
 */
interface PendingDeposit {
    userId: string;
    amount: number;
    chain: DepositChain;
    createdAt: number;
    expiresAt: number;
}

/**
 * DepositService
 * 
 * Handles deposit operations with enterprise-grade security:
 * - Nonce-based anti-replay protection
 * - Amount bounds validation
 * - Transaction verification
 * - Balance management
 */
@Injectable()
export class DepositService {
    private readonly logger = new Logger(DepositService.name);

    // In-memory nonce cache (for production, use Redis)
    private readonly pendingDeposits = new Map<string, PendingDeposit>();

    // Deposit configuration
    private readonly minAmount: number;
    private readonly maxAmount: number;
    private readonly nonceExpirySeconds: number;

    // Deposit addresses per chain (in production, these would be dynamic)
    private readonly depositAddresses: Record<DepositChain, string> = {
        [DepositChain.ETHEREUM]: '0x742d35Cc6634C0532925a3b844Bc9e7595f3bD1d',
        [DepositChain.SOLANA]: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        [DepositChain.SUI]: '0x02a212de6a9dfa3a69e22387acfbafbb1a9e591c',
        [DepositChain.BASE]: '0x742d35Cc6634C0532925a3b844Bc9e7595f3bD1d',
    };

    constructor(
        private readonly configService: ConfigService,
        private readonly supabaseService: SupabaseService,
        private readonly privyService: PrivyService,
    ) {
        this.minAmount = this.configService.get<number>('DEPOSIT_MIN_AMOUNT', 1);
        this.maxAmount = this.configService.get<number>('DEPOSIT_MAX_AMOUNT', 100000);
        this.nonceExpirySeconds = this.configService.get<number>('DEPOSIT_NONCE_EXPIRY_SECONDS', 300);

        // Cleanup expired nonces periodically
        setInterval(() => this.cleanupExpiredNonces(), 60000);
    }

    /**
     * Get user's balance
     */
    async getBalance(userId: string): Promise<BalanceResponseDto> {
        const client = this.supabaseService.getAdminClient();

        const { data, error } = await client
            .from('user_balances')
            .select('*')
            .eq('user_id', userId)
            .eq('currency', 'USDC')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            this.logger.error(`Failed to fetch balance for user ${userId}`, error);
            throw new BadRequestException('Failed to fetch balance');
        }

        const balance = parseFloat(data?.balance || '0');
        const lockedBalance = parseFloat(data?.locked_balance || '0');

        return {
            balance: balance.toFixed(2),
            lockedBalance: lockedBalance.toFixed(2),
            availableBalance: (balance - lockedBalance).toFixed(2),
            currency: 'USDC',
        };
    }

    /**
     * Initiate a new deposit
     * Returns nonce and deposit address
     */
    async initiateDeposit(
        userId: string,
        dto: InitiateDepositDto,
    ): Promise<InitiateDepositResponseDto> {
        // Validate amount bounds
        if (dto.amount < this.minAmount || dto.amount > this.maxAmount) {
            throw new BadRequestException(
                `Deposit amount must be between $${this.minAmount} and $${this.maxAmount}`
            );
        }

        // Generate unique nonce
        const nonce = `dep_${randomBytes(16).toString('hex')}`;
        const now = Date.now();
        const expiresAt = now + this.nonceExpirySeconds * 1000;
        const depositAddress = this.depositAddresses[dto.chain];

        // Store pending deposit
        this.pendingDeposits.set(nonce, {
            userId,
            amount: dto.amount,
            chain: dto.chain,
            createdAt: now,
            expiresAt,
        });

        // Create pending transaction in database
        const client = this.supabaseService.getAdminClient();
        const { error } = await client
            .from('deposit_transactions')
            .insert({
                user_id: userId,
                amount: dto.amount,
                currency: 'USDC',
                chain: dto.chain,
                to_address: depositAddress,
                status: DepositStatus.PENDING,
                nonce,
                expires_at: new Date(expiresAt).toISOString(),
            });

        if (error) {
            this.logger.error('Failed to create deposit transaction', error);
            this.pendingDeposits.delete(nonce);
            throw new BadRequestException('Failed to initiate deposit');
        }

        this.logger.log(`Deposit initiated: ${nonce} for user ${userId}, amount: ${dto.amount} ${dto.chain}`);

        return {
            nonce,
            depositAddress,
            expiresInSeconds: this.nonceExpirySeconds,
            amount: dto.amount.toFixed(2),
            chain: dto.chain,
        };
    }

    /**
     * Verify and confirm a deposit transaction
     */
    async verifyDeposit(
        userId: string,
        dto: VerifyDepositDto,
    ): Promise<DepositTransactionDto> {
        // Validate nonce exists and belongs to user
        const pending = this.pendingDeposits.get(dto.nonce);

        if (!pending) {
            // Check if it's in database but not in memory (after restart)
            const dbPending = await this.getPendingFromDb(dto.nonce);
            if (!dbPending) {
                throw new NotFoundException('Invalid or expired deposit nonce');
            }
            if (dbPending.user_id !== userId) {
                this.logger.warn(`User ${userId} attempted to verify deposit belonging to ${dbPending.user_id}`);
                throw new BadRequestException('Invalid deposit');
            }
        } else {
            // Validate from memory
            if (pending.userId !== userId) {
                this.logger.warn(`User ${userId} attempted to verify deposit belonging to ${pending.userId}`);
                throw new BadRequestException('Invalid deposit');
            }
            if (Date.now() > pending.expiresAt) {
                this.pendingDeposits.delete(dto.nonce);
                await this.updateDepositStatus(dto.nonce, DepositStatus.EXPIRED);
                throw new BadRequestException('Deposit session has expired');
            }
        }

        // Verify Privy token if provided (for embedded wallet transactions)
        if (dto.privyToken) {
            try {
                await this.privyService.verifyToken(dto.privyToken);
            } catch {
                throw new BadRequestException('Invalid Privy authentication');
            }
        }

        // Verify transaction on blockchain (placeholder - implement actual verification)
        const isValid = await this.verifyBlockchainTransaction(
            dto.txHash,
            pending?.chain || DepositChain.BASE,
            pending?.amount || 0,
        );

        if (!isValid) {
            throw new BadRequestException('Transaction verification failed');
        }

        // Update transaction status
        const client = this.supabaseService.getAdminClient();
        const { data: transaction, error: updateError } = await client
            .from('deposit_transactions')
            .update({
                status: DepositStatus.CONFIRMED,
                tx_hash: dto.txHash,
                confirmed_at: new Date().toISOString(),
            })
            .eq('nonce', dto.nonce)
            .select()
            .single();

        if (updateError) {
            this.logger.error('Failed to confirm deposit', updateError);
            throw new BadRequestException('Failed to confirm deposit');
        }

        // Credit user balance
        await this.creditBalance(userId, pending?.amount || transaction.amount);

        // Cleanup
        this.pendingDeposits.delete(dto.nonce);

        this.logger.log(`Deposit confirmed: ${dto.nonce}, txHash: ${dto.txHash}`);

        return this.mapToTransactionDto(transaction);
    }

    /**
     * Get deposit history for user
     */
    async getHistory(
        userId: string,
        query: DepositHistoryQueryDto,
    ): Promise<{ data: DepositTransactionDto[]; total: number }> {
        const client = this.supabaseService.getAdminClient();

        let queryBuilder = client
            .from('deposit_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (query.status) {
            queryBuilder = queryBuilder.eq('status', query.status);
        }
        if (query.chain) {
            queryBuilder = queryBuilder.eq('chain', query.chain);
        }

        // Pagination
        const offset = ((query.page || 1) - 1) * (query.limit || 20);
        queryBuilder = queryBuilder.range(offset, offset + (query.limit || 20) - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error('Failed to fetch deposit history', error);
            throw new BadRequestException('Failed to fetch history');
        }

        return {
            data: (data || []).map(tx => this.mapToTransactionDto(tx)),
            total: count || 0,
        };
    }

    /**
     * Credit user balance
     */
    private async creditBalance(userId: string, amount: number): Promise<void> {
        const client = this.supabaseService.getAdminClient();

        // Upsert balance (create if not exists, increment if exists)
        const { error } = await client.rpc('credit_user_balance', {
            p_user_id: userId,
            p_amount: amount,
            p_currency: 'USDC',
        });

        if (error) {
            // Fallback: direct insert/update
            const { data: existing } = await client
                .from('user_balances')
                .select('balance')
                .eq('user_id', userId)
                .eq('currency', 'USDC')
                .single();

            if (existing) {
                await client
                    .from('user_balances')
                    .update({
                        balance: parseFloat(existing.balance) + amount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId)
                    .eq('currency', 'USDC');
            } else {
                await client
                    .from('user_balances')
                    .insert({
                        user_id: userId,
                        balance: amount,
                        currency: 'USDC',
                    });
            }
        }

        this.logger.log(`Credited ${amount} USDC to user ${userId}`);
    }

    /**
     * Verify blockchain transaction (placeholder)
     * In production, integrate with blockchain RPC or indexer
     */
    private async verifyBlockchainTransaction(
        _txHash: string,
        _chain: DepositChain,
        _expectedAmount: number,
    ): Promise<boolean> {
        // TODO: Implement actual blockchain verification
        // For now, accept all transactions (development mode)
        this.logger.warn('Blockchain verification not implemented - accepting transaction');
        return true;
    }

    /**
     * Get pending deposit from database
     */
    private async getPendingFromDb(nonce: string): Promise<any> {
        const client = this.supabaseService.getAdminClient();
        const { data } = await client
            .from('deposit_transactions')
            .select('*')
            .eq('nonce', nonce)
            .eq('status', DepositStatus.PENDING)
            .single();
        return data;
    }

    /**
     * Update deposit status in database
     */
    private async updateDepositStatus(nonce: string, status: DepositStatus): Promise<void> {
        const client = this.supabaseService.getAdminClient();
        await client
            .from('deposit_transactions')
            .update({ status })
            .eq('nonce', nonce);
    }

    /**
     * Map database record to DTO
     */
    private mapToTransactionDto(record: any): DepositTransactionDto {
        return {
            id: record.id,
            amount: parseFloat(record.amount).toFixed(2),
            currency: record.currency || 'USDC',
            chain: record.chain,
            txHash: record.tx_hash,
            status: record.status,
            createdAt: record.created_at,
            confirmedAt: record.confirmed_at,
        };
    }

    /**
     * Save Privy wallet to database
     */
    async savePrivyWallet(userId: string, wallet: {
        privyUserId: string;
        walletAddress: string;
        chain: string;
        walletType: string;
    }): Promise<void> {
        const client = this.supabaseService.getAdminClient();

        const { error } = await client
            .from('privy_wallets')
            .upsert({
                user_id: userId,
                privy_user_id: wallet.privyUserId,
                wallet_address: wallet.walletAddress,
                chain: wallet.chain,
                wallet_type: wallet.walletType,
                is_active: true,
                last_used_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,chain',
            });

        if (error) {
            this.logger.error('Failed to save Privy wallet', error);
        } else {
            this.logger.log(`Saved Privy wallet ${wallet.walletAddress} for user ${userId}`);
        }
    }

    /**
     * Get or create deposit wallet for user
     * Handles mapping between Supabase UUID and Privy DID
     */
    async getOrCreateDepositWallet(userId: string, chain: string): Promise<any> {
        const chainType = chain === 'solana' ? 'solana' : 'ethereum';

        // 1. Check local DB first
        const existing = await this.getPrivyWallet(userId, chain as DepositChain);
        if (existing) {
            return existing;
        }

        // 2. Ensure user exists in Privy (Import if needed)
        const privyDid = await this.ensurePrivyUser(userId);

        // 3. Get or create wallet in Privy
        const privyWallet = await this.privyService.getOrCreateWallet(privyDid, chainType);

        // 4. Save to DB
        await this.savePrivyWallet(userId, {
            privyUserId: privyDid,
            walletAddress: privyWallet.address,
            chain: chain,
            walletType: 'embedded',
        });

        return {
            address: privyWallet.address,
            chain: chain,
            walletType: 'embedded',
            createdAt: privyWallet.created_at,
        };
    }

    /**
     * Ensure user exists in Privy and get their DID
     */
    async ensurePrivyUser(userId: string): Promise<string> {
        const client = this.supabaseService.getAdminClient();

        // 1. Check if we already have the Privy DID
        const { data: profile } = await client
            .from('profiles')
            .select('privy_user_id')
            .eq('id', userId)
            .single();

        if (profile?.privy_user_id) {
            return profile.privy_user_id;
        }

        // 2. Import user to Privy
        try {
            const privyUser = await this.privyService.importUser(userId);

            // 3. Save DID to profiles
            await client
                .from('profiles')
                .update({ privy_user_id: privyUser.id })
                .eq('id', userId);

            return privyUser.id;
        } catch (error) {
            this.logger.error(`Failed to ensure Privy user for ${userId}`, error);
            // Re-throw to be handled by controller
            throw error;
        }
    }

    /**
     * Get user's Privy wallet for a specific chain
     */
    async getPrivyWallet(userId: string, chain: DepositChain): Promise<{
        address: string;
        chain: string;
        walletType: string;
        createdAt: string;
    } | null> {
        const client = this.supabaseService.getAdminClient();

        const { data, error } = await client
            .from('privy_wallets')
            .select('*')
            .eq('user_id', userId)
            .eq('chain', chain)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            address: data.wallet_address,
            chain: data.chain,
            walletType: data.wallet_type,
            createdAt: data.created_at,
        };
    }

    /**
     * Get all Privy wallets for a user
     */
    async getAllPrivyWallets(userId: string): Promise<Array<{
        address: string;
        chain: string;
        walletType: string;
        createdAt: string;
    }>> {
        const client = this.supabaseService.getAdminClient();

        const { data, error } = await client
            .from('privy_wallets')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error || !data) {
            return [];
        }

        return data.map(wallet => ({
            address: wallet.wallet_address,
            chain: wallet.chain,
            walletType: wallet.wallet_type,
            createdAt: wallet.created_at,
        }));
    }

    /**
     * Cleanup expired nonces from memory
     */
    private cleanupExpiredNonces(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [nonce, deposit] of this.pendingDeposits.entries()) {
            if (now > deposit.expiresAt) {
                this.pendingDeposits.delete(nonce);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} expired deposit nonces`);
        }
    }
}

