import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service.js';
import { CreateMarketDto, MarketQueryDto, ResolveMarketDto, MarketResponseDto } from './dto/index.js';

interface Market {
    id: string;
    creator_id: string;
    title: string;
    description: string;
    category: string;
    chain: string;
    chain_id: number;
    contract_address?: string;
    collateral_token: string;
    end_time: string;
    resolution_time: string;
    resolved: boolean;
    outcome: boolean | null;
    yes_price: number;
    no_price: number;
    volume: number;
    liquidity: number;
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Markets Service
 * 
 * Handles prediction market CRUD operations
 */
@Injectable()
export class MarketsService {
    private readonly logger = new Logger(MarketsService.name);

    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    /**
     * Create a new prediction market
     */
    async create(userId: string, dto: CreateMarketDto): Promise<MarketResponseDto> {
        const supabase = this.supabaseService.getAdminClient();

        // Calculate resolution time if not provided
        const endTime = new Date(dto.endTime);
        const resolutionTime = dto.resolutionTime
            ? new Date(dto.resolutionTime)
            : new Date(endTime.getTime() + 24 * 60 * 60 * 1000); // Default: endTime + 24h

        const { data, error } = await supabase
            .from('markets')
            .insert({
                creator_id: userId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                chain: dto.chain,
                chain_id: this.getChainId(dto.chain),
                collateral_token: 'USDC',
                end_time: endTime.toISOString(),
                resolution_time: resolutionTime.toISOString(),
                resolved: false,
                outcome: null,
                yes_price: 0.5, // Initial 50/50
                no_price: 0.5,
                volume: 0,
                liquidity: dto.initialLiquidity,
                tags: dto.tags || [],
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to create market: ${error.message}`);
            throw new Error(`Failed to create market: ${error.message}`);
        }

        this.logger.log(`Market created: ${data.id} by user ${userId}`);
        return this.toResponseDto(data);
    }

    /**
     * Get market by ID
     */
    async findById(id: string): Promise<MarketResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Market not found: ${id}`);
        }

        return this.toResponseDto(data);
    }

    /**
     * Find markets with filters and pagination
     */
    async findAll(query: MarketQueryDto): Promise<PaginatedResult<MarketResponseDto>> {
        const supabase = this.supabaseService.getClient();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
            .from('markets')
            .select('*', { count: 'exact' });

        // Apply filters
        if (query.category) {
            queryBuilder = queryBuilder.eq('category', query.category);
        }
        if (query.chain) {
            queryBuilder = queryBuilder.eq('chain', query.chain);
        }
        if (query.resolved !== undefined) {
            queryBuilder = queryBuilder.eq('resolved', query.resolved);
        }
        if (query.search) {
            queryBuilder = queryBuilder.ilike('title', `%${query.search}%`);
        }

        // Apply sorting
        const sortField = this.getSortField(query.sortBy || 'created');
        const ascending = query.sortOrder === 'asc';
        queryBuilder = queryBuilder.order(sortField, { ascending });

        // Apply pagination
        queryBuilder = queryBuilder.range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to fetch markets: ${error.message}`);
            throw new Error(`Failed to fetch markets: ${error.message}`);
        }

        return {
            data: (data || []).map(this.toResponseDto),
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get featured/trending markets
     */
    async getFeatured(limit: number = 10): Promise<MarketResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('resolved', false)
            .order('volume', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to fetch featured markets: ${error.message}`);
            return [];
        }

        return (data || []).map(this.toResponseDto);
    }

    /**
     * Get markets by creator
     */
    async findByCreator(creatorId: string): Promise<MarketResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('creator_id', creatorId)
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch creator markets: ${error.message}`);
            return [];
        }

        return (data || []).map(this.toResponseDto);
    }

    /**
     * Resolve a market
     */
    async resolve(
        marketId: string,
        resolverId: string,
        dto: ResolveMarketDto,
    ): Promise<MarketResponseDto> {
        const supabase = this.supabaseService.getAdminClient();

        // Get market
        const market = await this.findById(marketId);

        if (market.resolved) {
            throw new ForbiddenException('Market is already resolved');
        }

        // Check if resolution time has passed
        const now = new Date();
        const resolutionTime = new Date(market.resolutionTime);
        if (now < resolutionTime) {
            throw new ForbiddenException('Market cannot be resolved before resolution time');
        }

        // Update market
        const { data, error } = await supabase
            .from('markets')
            .update({
                resolved: true,
                outcome: dto.outcome,
                updated_at: new Date().toISOString(),
            })
            .eq('id', marketId)
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to resolve market: ${error.message}`);
            throw new Error(`Failed to resolve market: ${error.message}`);
        }

        this.logger.log(`Market resolved: ${marketId} outcome=${dto.outcome} by ${resolverId}`);
        return this.toResponseDto(data);
    }

    /**
     * Update market prices (called by oracle/AMM)
     */
    async updatePrices(
        marketId: string,
        yesPrice: number,
        noPrice: number,
    ): Promise<void> {
        const supabase = this.supabaseService.getAdminClient();

        await supabase
            .from('markets')
            .update({
                yes_price: yesPrice,
                no_price: noPrice,
                updated_at: new Date().toISOString(),
            })
            .eq('id', marketId);
    }

    /**
     * Convert database record to response DTO
     */
    private toResponseDto(market: Market): MarketResponseDto {
        return {
            id: market.id,
            title: market.title,
            description: market.description,
            category: market.category,
            creator: market.creator_id,
            chain: market.chain,
            chainId: market.chain_id,
            collateralToken: market.collateral_token,
            endTime: market.end_time,
            resolutionTime: market.resolution_time,
            resolved: market.resolved,
            outcome: market.outcome,
            yesPrice: market.yes_price,
            noPrice: market.no_price,
            volume: market.volume,
            liquidity: market.liquidity,
            tags: market.tags || [],
            createdAt: market.created_at,
            updatedAt: market.updated_at,
        };
    }

    /**
     * Get chain ID from chain name
     */
    private getChainId(chain: string): number {
        const chainIds: Record<string, number> = {
            ethereum: 1,
            base: 8453,
            arbitrum: 42161,
            optimism: 10,
            polygon: 137,
        };
        return chainIds[chain] || 1;
    }

    /**
     * Get database field name for sorting
     */
    private getSortField(sortBy: string): string {
        const sortFields: Record<string, string> = {
            created: 'created_at',
            endTime: 'end_time',
            volume: 'volume',
            liquidity: 'liquidity',
        };
        return sortFields[sortBy] || 'created_at';
    }
}
