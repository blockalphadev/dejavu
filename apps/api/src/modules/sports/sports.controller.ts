/**
 * Sports Controller
 * 
 * REST API endpoints for sports data.
 * Includes public endpoints for viewing data and admin endpoints for sync operations.
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { SportsService } from './sports.service.js';
import { SportsSyncService } from './sports-sync.service.js';
import {
    SportsLeaguesQueryDto,
    SportsEventsQueryDto,
    SportsMarketsQueryDto,
    SyncLeaguesDto,
    SyncEventsDto,
    TriggerSyncDto,
    CreateSportsMarketDto,
    SportsLeagueResponseDto,
    SportsTeamResponseDto,
    SportsEventResponseDto,
    SportsMarketResponseDto,
    SyncResultResponseDto,
    PaginatedResponseDto,
} from './dto/index.js';
import { SportType } from './types/sports.types.js';
// Note: Import your auth guard here
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
// import { AdminGuard } from '../admin/guards/admin.guard.js';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
    constructor(
        private readonly sportsService: SportsService,
        private readonly sportsSyncService: SportsSyncService,
    ) { }

    // ========================
    // Leagues
    // ========================

    @Get('leagues')
    @ApiOperation({ summary: 'Get all sports leagues' })
    @ApiResponse({ status: 200, description: 'List of leagues' })
    async getLeagues(
        @Query() query: SportsLeaguesQueryDto,
    ): Promise<PaginatedResponseDto<SportsLeagueResponseDto>> {
        return this.sportsService.getLeagues(query);
    }

    @Get('leagues/:id')
    @ApiOperation({ summary: 'Get league by ID' })
    @ApiParam({ name: 'id', description: 'League UUID' })
    @ApiResponse({ status: 200, description: 'League details' })
    @ApiResponse({ status: 404, description: 'League not found' })
    async getLeagueById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SportsLeagueResponseDto> {
        return this.sportsService.getLeagueById(id);
    }

    // ========================
    // Teams
    // ========================

    @Get('leagues/:leagueId/teams')
    @ApiOperation({ summary: 'Get teams by league' })
    @ApiParam({ name: 'leagueId', description: 'League UUID' })
    @ApiResponse({ status: 200, description: 'List of teams' })
    async getTeamsByLeague(
        @Param('leagueId', ParseUUIDPipe) leagueId: string,
    ): Promise<SportsTeamResponseDto[]> {
        return this.sportsService.getTeamsByLeague(leagueId);
    }

    @Get('teams/search')
    @ApiOperation({ summary: 'Search teams by name' })
    @ApiQuery({ name: 'q', description: 'Search query' })
    @ApiQuery({ name: 'sport', enum: SportType, required: false })
    @ApiResponse({ status: 200, description: 'Search results' })
    async searchTeams(
        @Query('q') query: string,
        @Query('sport') sport?: SportType,
    ): Promise<SportsTeamResponseDto[]> {
        return this.sportsService.searchTeams(query, sport);
    }

    @Get('teams/:id')
    @ApiOperation({ summary: 'Get team by ID' })
    @ApiParam({ name: 'id', description: 'Team UUID' })
    @ApiResponse({ status: 200, description: 'Team details' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    async getTeamById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SportsTeamResponseDto> {
        return this.sportsService.getTeamById(id);
    }

    // ========================
    // Events
    // ========================

    @Get('events')
    @ApiOperation({ summary: 'Get sports events with filters' })
    @ApiResponse({ status: 200, description: 'List of events' })
    async getEvents(
        @Query() query: SportsEventsQueryDto,
    ): Promise<PaginatedResponseDto<SportsEventResponseDto>> {
        return this.sportsService.getEvents(query);
    }

    @Get('events/live')
    @ApiOperation({ summary: 'Get live events' })
    @ApiQuery({ name: 'sport', enum: SportType, required: false })
    @ApiResponse({ status: 200, description: 'List of live events' })
    async getLiveEvents(
        @Query('sport') sport?: SportType,
    ): Promise<SportsEventResponseDto[]> {
        return this.sportsService.getLiveEvents(sport);
    }

    @Get('events/upcoming')
    @ApiOperation({ summary: 'Get upcoming events' })
    @ApiQuery({ name: 'sport', enum: SportType, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiResponse({ status: 200, description: 'List of upcoming events' })
    async getUpcomingEvents(
        @Query('sport') sport?: SportType,
        @Query('limit') limit?: number,
    ): Promise<SportsEventResponseDto[]> {
        return this.sportsService.getUpcomingEvents(sport, limit || 20);
    }

    @Get('events/:id')
    @ApiOperation({ summary: 'Get event by ID' })
    @ApiParam({ name: 'id', description: 'Event UUID' })
    @ApiResponse({ status: 200, description: 'Event details' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async getEventById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SportsEventResponseDto> {
        return this.sportsService.getEventById(id);
    }

    // ========================
    // Markets
    // ========================

    @Get('markets')
    @ApiOperation({ summary: 'Get sports prediction markets' })
    @ApiResponse({ status: 200, description: 'List of markets' })
    async getMarkets(
        @Query() query: SportsMarketsQueryDto,
    ): Promise<PaginatedResponseDto<SportsMarketResponseDto>> {
        return this.sportsService.getMarkets(query);
    }

    @Get('markets/:id')
    @ApiOperation({ summary: 'Get market by ID' })
    @ApiParam({ name: 'id', description: 'Market UUID' })
    @ApiResponse({ status: 200, description: 'Market details' })
    @ApiResponse({ status: 404, description: 'Market not found' })
    async getMarketById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SportsMarketResponseDto> {
        return this.sportsService.getMarketById(id);
    }

    @Post('markets')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a sports prediction market' })
    @ApiBearerAuth()
    @ApiResponse({ status: 201, description: 'Market created' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    // @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
    async createMarket(
        @Body() dto: CreateSportsMarketDto,
    ): Promise<SportsMarketResponseDto> {
        return this.sportsService.createMarket(dto);
    }

    // ========================
    // Sync Operations (Admin)
    // ========================

    @Post('sync/leagues')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger leagues sync (Admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Sync completed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when auth is ready
    async syncLeagues(
        @Body() dto: SyncLeaguesDto,
    ): Promise<SyncResultResponseDto> {
        return this.sportsSyncService.syncAllLeagues(dto.sport);
    }

    @Post('sync/events')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger events sync (Admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Sync completed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when auth is ready
    async syncEvents(
        @Body() dto: SyncEventsDto,
    ): Promise<SyncResultResponseDto> {
        return this.sportsSyncService.syncUpcomingEvents(dto.sport, dto.date);
    }

    @Post('sync/live')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger live scores sync (Admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Sync completed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when auth is ready
    async syncLive(
        @Body() dto: TriggerSyncDto,
    ): Promise<SyncResultResponseDto> {
        return this.sportsSyncService.syncLiveScores(dto.sport);
    }

    @Post('sync/odds')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger odds sync (Admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Sync completed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when auth is ready
    async syncOdds(
        @Body() dto: SyncEventsDto,
    ): Promise<SyncResultResponseDto> {
        return this.sportsSyncService.syncOdds(dto.date?.toISOString());
    }

    @Post('sync/all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger full sync (Admin)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Full sync completed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    // @UseGuards(JwtAuthGuard, AdminGuard) // Uncomment when auth is ready
    async fullSync(
        @Body() dto: TriggerSyncDto,
    ): Promise<{ leagues: SyncResultResponseDto; events: SyncResultResponseDto; live: SyncResultResponseDto }> {
        return this.sportsSyncService.fullSync(dto.sport);
    }

    // ========================
    // Sport Categories
    // ========================

    @Get('categories')
    @ApiOperation({ summary: 'Get available sport categories' })
    @ApiResponse({ status: 200, description: 'List of sport categories' })
    async getSportCategories(): Promise<Array<{ id: string; name: string; icon: string }>> {
        return [
            { id: 'afl', name: 'AFL', icon: '🏉' },
            { id: 'baseball', name: 'Baseball', icon: '⚾' },
            { id: 'basketball', name: 'Basketball', icon: '🏀' },
            { id: 'football', name: 'Football', icon: '⚽' },
            { id: 'formula1', name: 'Formula 1', icon: '🏎️' },
            { id: 'handball', name: 'Handball', icon: '🤾' },
            { id: 'hockey', name: 'Hockey', icon: '🏒' },
            { id: 'mma', name: 'MMA', icon: '🥊' },
            { id: 'nba', name: 'NBA', icon: '🏀' },
            { id: 'nfl', name: 'NFL', icon: '🏈' },
            { id: 'rugby', name: 'Rugby', icon: '🏉' },
            { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
        ];
    }
}
