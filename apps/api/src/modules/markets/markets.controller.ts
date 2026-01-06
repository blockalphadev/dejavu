import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketsService } from './markets.service.js';
import { JwtAuthGuard } from '../auth/guards/index.js';
import { CurrentUser, Public } from '../auth/decorators/index.js';
import { CreateMarketDto, MarketQueryDto, ResolveMarketDto } from './dto/index.js';

@ApiTags('Markets')
@Controller('markets')
export class MarketsController {
    constructor(private readonly marketsService: MarketsService) { }

    /**
     * Create a new prediction market
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new prediction market' })
    @ApiResponse({ status: 201, description: 'Market created successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateMarketDto,
    ) {
        return this.marketsService.create(userId, dto);
    }

    /**
     * Get all markets with filters
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all markets with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Markets retrieved successfully' })
    async findAll(@Query() query: MarketQueryDto) {
        return this.marketsService.findAll(query);
    }

    /**
     * Get featured/trending markets
     */
    @Get('featured')
    @Public()
    @ApiOperation({ summary: 'Get featured/trending markets' })
    @ApiResponse({ status: 200, description: 'Featured markets retrieved' })
    async getFeatured(@Query('limit') limit?: number) {
        return this.marketsService.getFeatured(limit || 10);
    }

    /**
     * Get market by ID
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get market by ID' })
    @ApiResponse({ status: 200, description: 'Market retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Market not found' })
    async findById(@Param('id') id: string) {
        return this.marketsService.findById(id);
    }

    /**
     * Get markets created by user
     */
    @Get('user/:userId')
    @Public()
    @ApiOperation({ summary: 'Get markets by creator' })
    @ApiResponse({ status: 200, description: 'Markets retrieved successfully' })
    async findByCreator(@Param('userId') userId: string) {
        return this.marketsService.findByCreator(userId);
    }

    /**
     * Resolve a market
     */
    @Patch(':id/resolve')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Resolve a prediction market' })
    @ApiResponse({ status: 200, description: 'Market resolved successfully' })
    @ApiResponse({ status: 403, description: 'Not authorized to resolve' })
    @ApiResponse({ status: 404, description: 'Market not found' })
    async resolve(
        @CurrentUser('id') userId: string,
        @Param('id') marketId: string,
        @Body() dto: ResolveMarketDto,
    ) {
        return this.marketsService.resolve(marketId, userId, dto);
    }
}
