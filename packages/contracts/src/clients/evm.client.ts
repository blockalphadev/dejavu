/**
 * EVM Prediction Market Client
 * 
 * Type-safe client wrapper for interacting with EVM prediction markets
 * using viem.
 */

import type { PublicClient, WalletClient, Address, Hash, TransactionReceipt } from 'viem';
import { PredictionMarketABI, ERC20ABI } from '../abis/index.js';
import type { OnChainMarket, Position, PriceQuote, LiquidityInfo } from '../types/chains.js';

export interface EVMClientConfig {
    publicClient: PublicClient;
    walletClient?: WalletClient;
    contractAddress: Address;
}

/**
 * EVM Prediction Market Client
 */
export class EVMPredictionMarketClient {
    private readonly publicClient: PublicClient;
    private readonly walletClient?: WalletClient;
    private readonly contractAddress: Address;

    constructor(config: EVMClientConfig) {
        this.publicClient = config.publicClient;
        this.walletClient = config.walletClient;
        this.contractAddress = config.contractAddress;
    }

    // ==================
    // Read Operations
    // ==================

    /**
     * Get market details
     */
    async getMarket(marketId: `0x${string}`): Promise<OnChainMarket | null> {
        try {
            const result = await this.publicClient.readContract({
                address: this.contractAddress,
                abi: PredictionMarketABI,
                functionName: 'getMarket',
                args: [marketId],
            });

            const market = result as any;
            return {
                id: market.id,
                creator: market.creator,
                title: market.title,
                description: market.description,
                endTime: market.endTime,
                resolutionTime: market.resolutionTime,
                totalYesShares: market.totalYesShares,
                totalNoShares: market.totalNoShares,
                resolved: market.resolved,
                outcome: market.resolved ? market.outcome : null,
                collateralToken: market.collateralToken,
                chain: 'evm',
                chainId: String(await this.publicClient.getChainId()),
            };
        } catch {
            return null;
        }
    }

    /**
     * Get user position in a market
     */
    async getPosition(marketId: `0x${string}`, user: Address): Promise<Position> {
        const [yesShares, noShares] = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'getPosition',
            args: [marketId, user],
        }) as [bigint, bigint];

        return {
            marketId,
            user,
            yesShares,
            noShares,
            chain: 'evm',
        };
    }

    /**
     * Get current price quote
     */
    async getPrice(marketId: `0x${string}`): Promise<PriceQuote> {
        const [yesPrice, noPrice] = await Promise.all([
            this.publicClient.readContract({
                address: this.contractAddress,
                abi: PredictionMarketABI,
                functionName: 'getPrice',
                args: [marketId, true],
            }) as Promise<bigint>,
            this.publicClient.readContract({
                address: this.contractAddress,
                abi: PredictionMarketABI,
                functionName: 'getPrice',
                args: [marketId, false],
            }) as Promise<bigint>,
        ]);

        // Prices are in basis points (0-10000)
        return {
            marketId,
            yesPrice: Number(yesPrice) / 10000,
            noPrice: Number(noPrice) / 10000,
            timestamp: Date.now(),
            source: 'chain',
        };
    }

    /**
     * Get liquidity info
     */
    async getLiquidity(marketId: `0x${string}`): Promise<LiquidityInfo> {
        const liquidity = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'getLiquidity',
            args: [marketId],
        }) as bigint;

        return {
            marketId,
            totalLiquidity: liquidity,
        };
    }

    // ==================
    // Write Operations
    // ==================

    /**
     * Create a new market
     */
    async createMarket(params: {
        title: string;
        description: string;
        endTime: bigint;
        collateralToken: Address;
        initialLiquidity: bigint;
    }): Promise<{ hash: Hash; marketId?: `0x${string}` }> {
        this.requireWalletClient();

        const hash = await this.walletClient!.writeContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'createMarket',
            args: [
                params.title,
                params.description,
                params.endTime,
                params.collateralToken,
                params.initialLiquidity,
            ],
        });

        return { hash };
    }

    /**
     * Buy shares in a market
     */
    async buyShares(params: {
        marketId: `0x${string}`;
        isYes: boolean;
        amount: bigint;
        maxCost: bigint;
    }): Promise<{ hash: Hash }> {
        this.requireWalletClient();

        const hash = await this.walletClient!.writeContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'buyShares',
            args: [params.marketId, params.isYes, params.amount, params.maxCost],
        });

        return { hash };
    }

    /**
     * Sell shares in a market
     */
    async sellShares(params: {
        marketId: `0x${string}`;
        isYes: boolean;
        amount: bigint;
        minReturn: bigint;
    }): Promise<{ hash: Hash }> {
        this.requireWalletClient();

        const hash = await this.walletClient!.writeContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'sellShares',
            args: [params.marketId, params.isYes, params.amount, params.minReturn],
        });

        return { hash };
    }

    /**
     * Claim winnings from a resolved market
     */
    async claimWinnings(marketId: `0x${string}`): Promise<{ hash: Hash }> {
        this.requireWalletClient();

        const hash = await this.walletClient!.writeContract({
            address: this.contractAddress,
            abi: PredictionMarketABI,
            functionName: 'claimWinnings',
            args: [marketId],
        });

        return { hash };
    }

    // ==================
    // Token Operations
    // ==================

    /**
     * Approve tokens for spending
     */
    async approveToken(
        tokenAddress: Address,
        amount: bigint,
    ): Promise<{ hash: Hash }> {
        this.requireWalletClient();

        const hash = await this.walletClient!.writeContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [this.contractAddress, amount],
        });

        return { hash };
    }

    /**
     * Get token allowance
     */
    async getTokenAllowance(
        tokenAddress: Address,
        owner: Address,
    ): Promise<bigint> {
        return this.publicClient.readContract({
            address: tokenAddress,
            abi: ERC20ABI,
            functionName: 'allowance',
            args: [owner, this.contractAddress],
        }) as Promise<bigint>;
    }

    // ==================
    // Transaction Helpers
    // ==================

    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(hash: Hash): Promise<TransactionReceipt> {
        return this.publicClient.waitForTransactionReceipt({ hash });
    }

    /**
     * Ensure wallet client is connected
     */
    private requireWalletClient(): void {
        if (!this.walletClient) {
            throw new Error('Wallet client not connected. Please connect a wallet to perform transactions.');
        }
    }
}
