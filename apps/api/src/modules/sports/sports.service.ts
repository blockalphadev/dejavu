/**
 * Sports Service
 * 
 * Core business logic for sports data management.
 * Handles CRUD operations for leagues, teams, events, and markets.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service.js';
import {
    SportType,
    EventStatus,
    DataSource,
    SportsLeague,
    SportsTeam,
    SportsEvent,
    SportsMarket,
    SportsEventsQuery,
    SportsMarketsQuery,
    PaginatedResult,
} from './types/sports.types.js';
import { SportsMessagingService } from './sports-messaging.service.js';
import {
    SportsLeagueResponseDto,
    SportsTeamResponseDto,
    SportsEventResponseDto,
    SportsMarketResponseDto,
    SportsLeaguesQueryDto,
    SportsEventsQueryDto,
    SportsMarketsQueryDto,
    CreateSportsMarketDto,
} from './dto/index.js';

@Injectable()
export class SportsService {
    private readonly logger = new Logger(SportsService.name);

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly sportsMessagingService: SportsMessagingService,
    ) { }

    // ========================
    // Leagues
    // ========================

    /**
     * Get all leagues with filters
     */
    async getLeagues(query: SportsLeaguesQueryDto): Promise<PaginatedResult<SportsLeagueResponseDto>> {
        const supabase = this.supabaseService.getClient();
        const page = query.page || 1;
        const limit = query.limit || 50;
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
            .from('sports_leagues')
            .select('*', { count: 'exact' });

        if (query.sport) {
            queryBuilder = queryBuilder.eq('sport', query.sport);
        }
        if (query.country) {
            queryBuilder = queryBuilder.ilike('country', `%${query.country}%`);
        }
        if (query.isActive !== undefined) {
            queryBuilder = queryBuilder.eq('is_active', query.isActive);
        }
        if (query.isFeatured !== undefined) {
            queryBuilder = queryBuilder.eq('is_featured', query.isFeatured);
        }
        if (query.search) {
            queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
        }

        queryBuilder = queryBuilder
            .order('display_order', { ascending: true })
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to get leagues: ${error.message}`);
            throw new Error(`Failed to get leagues: ${error.message}`);
        }

        return {
            data: (data || []).map(item => this.toLeagueDto(item)),
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get league by ID
     */
    async getLeagueById(id: string): Promise<SportsLeagueResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('sports_leagues')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`League not found: ${id}`);
        }

        return this.toLeagueDto(data);
    }

    /**
     * Upsert leagues (create or update)
     */
    async upsertLeagues(leagues: Partial<SportsLeague>[]): Promise<{ created: number; updated: number }> {
        const supabase = this.supabaseService.getAdminClient();
        let created = 0;
        let updated = 0;

        for (const league of leagues) {
            const { data: existing } = await supabase
                .from('sports_leagues')
                .select('id')
                .eq('external_id', league.externalId)
                .eq('source', league.source)
                .single();

            if (existing) {
                await supabase
                    .from('sports_leagues')
                    .update({
                        name: league.name,
                        name_alternate: league.nameAlternate,
                        country: league.country,
                        country_code: league.countryCode,
                        logo_url: league.logoUrl,
                        banner_url: league.bannerUrl,
                        trophy_url: league.trophyUrl,
                        description: league.description,
                        website: league.website,
                        twitter: league.twitter,
                        facebook: league.facebook,
                        metadata: league.metadata,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);
                updated++;
            } else {
                await supabase.from('sports_leagues').insert({
                    external_id: league.externalId,
                    source: league.source,
                    sport: league.sport,
                    name: league.name,
                    name_alternate: league.nameAlternate,
                    country: league.country,
                    country_code: league.countryCode,
                    logo_url: league.logoUrl,
                    banner_url: league.bannerUrl,
                    trophy_url: league.trophyUrl,
                    description: league.description,
                    website: league.website,
                    twitter: league.twitter,
                    facebook: league.facebook,
                    is_active: true,
                    is_featured: false,
                    display_order: 0,
                    metadata: league.metadata || {},
                });
                created++;
            }
        }

        this.logger.log(`Upserted leagues: ${created} created, ${updated} updated`);
        return { created, updated };
    }

    // ========================
    // Teams
    // ========================

    /**
     * Get teams by league
     */
    async getTeamsByLeague(leagueId: string): Promise<SportsTeamResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('sports_teams')
            .select('*')
            .eq('league_id', leagueId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            this.logger.error(`Failed to get teams: ${error.message}`);
            return [];
        }

        return (data || []).map(item => this.toTeamDto(item));
    }

    /**
     * Get team by ID
     */
    async getTeamById(id: string): Promise<SportsTeamResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('sports_teams')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Team not found: ${id}`);
        }

        return this.toTeamDto(data);
    }

    /**
     * Search teams
     */
    async searchTeams(query: string, sport?: SportType): Promise<SportsTeamResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        let queryBuilder = supabase
            .from('sports_teams')
            .select('*')
            .ilike('name', `%${query}%`)
            .eq('is_active', true)
            .limit(20);

        if (sport) {
            queryBuilder = queryBuilder.eq('sport', sport);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to search teams: ${error.message}`);
            return [];
        }

        return (data || []).map(item => this.toTeamDto(item));
    }

    /**
     * Upsert teams
     */
    async upsertTeams(teams: Partial<SportsTeam>[]): Promise<{ created: number; updated: number }> {
        const supabase = this.supabaseService.getAdminClient();
        let created = 0;
        let updated = 0;

        for (const team of teams) {
            const { data: existing } = await supabase
                .from('sports_teams')
                .select('id')
                .eq('external_id', team.externalId)
                .eq('source', team.source)
                .single();

            if (existing) {
                await supabase
                    .from('sports_teams')
                    .update({
                        name: team.name,
                        name_short: team.nameShort,
                        name_alternate: team.nameAlternate,
                        country: team.country,
                        city: team.city,
                        stadium: team.stadium,
                        stadium_capacity: team.stadiumCapacity,
                        logo_url: team.logoUrl,
                        jersey_url: team.jerseyUrl,
                        banner_url: team.bannerUrl,
                        primary_color: team.primaryColor,
                        secondary_color: team.secondaryColor,
                        founded_year: team.foundedYear,
                        website: team.website,
                        metadata: team.metadata,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);
                updated++;
            } else {
                // Find league ID from external ID if provided
                let leagueId: string | null = null;
                if (team.leagueId) {
                    const { data: league } = await supabase
                        .from('sports_leagues')
                        .select('id')
                        .eq('external_id', team.leagueId)
                        .single();
                    leagueId = league?.id || null;
                }

                await supabase.from('sports_teams').insert({
                    external_id: team.externalId,
                    source: team.source,
                    league_id: leagueId,
                    sport: team.sport,
                    name: team.name,
                    name_short: team.nameShort,
                    name_alternate: team.nameAlternate,
                    country: team.country,
                    city: team.city,
                    stadium: team.stadium,
                    stadium_capacity: team.stadiumCapacity,
                    logo_url: team.logoUrl,
                    jersey_url: team.jerseyUrl,
                    banner_url: team.bannerUrl,
                    primary_color: team.primaryColor,
                    secondary_color: team.secondaryColor,
                    founded_year: team.foundedYear,
                    website: team.website,
                    is_active: true,
                    metadata: team.metadata || {},
                });
                created++;
            }
        }

        this.logger.log(`Upserted teams: ${created} created, ${updated} updated`);
        return { created, updated };
    }

    // ========================
    // Events
    // ========================

    /**
     * Get events with filters
     */
    async getEvents(query: SportsEventsQueryDto): Promise<PaginatedResult<SportsEventResponseDto>> {
        const supabase = this.supabaseService.getClient();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
            .from('sports_events')
            .select(`
                *,
                home_team:sports_teams!sports_events_home_team_id_fkey(*),
                away_team:sports_teams!sports_events_away_team_id_fkey(*),
                league:sports_leagues!sports_events_league_id_fkey(*)
            `, { count: 'exact' });

        if (query.sport) {
            queryBuilder = queryBuilder.eq('sport', query.sport);
        }
        if (query.leagueId) {
            queryBuilder = queryBuilder.eq('league_id', query.leagueId);
        }
        if (query.status) {
            queryBuilder = queryBuilder.eq('status', query.status);
        }
        if (query.startDate) {
            queryBuilder = queryBuilder.gte('start_time', query.startDate.toISOString());
        }
        if (query.endDate) {
            queryBuilder = queryBuilder.lte('start_time', query.endDate.toISOString());
        }
        if (query.hasMarket !== undefined) {
            queryBuilder = queryBuilder.eq('has_market', query.hasMarket);
        }
        if (query.isFeatured !== undefined) {
            queryBuilder = queryBuilder.eq('is_featured', query.isFeatured);
        }
        if (query.search) {
            queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
        }

        // Sorting
        const sortField = query.sortBy === 'createdAt' ? 'created_at' :
            query.sortBy === 'volume' ? 'has_market' : 'start_time';
        queryBuilder = queryBuilder
            .order(sortField, { ascending: query.sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to get events: ${error.message}`);
            throw new Error(`Failed to get events: ${error.message}`);
        }

        return {
            data: (data || []).map(item => this.toEventDto(item)),
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get live events
     */
    async getLiveEvents(sport?: SportType): Promise<SportsEventResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        let queryBuilder = supabase
            .from('sports_events')
            .select(`
                *,
                home_team:sports_teams!sports_events_home_team_id_fkey(*),
                away_team:sports_teams!sports_events_away_team_id_fkey(*),
                league:sports_leagues!sports_events_league_id_fkey(*)
            `)
            .eq('status', EventStatus.LIVE);

        if (sport) {
            queryBuilder = queryBuilder.eq('sport', sport);
        }

        const { data, error } = await queryBuilder.order('start_time', { ascending: false });

        if (error) {
            this.logger.error(`Failed to get live events: ${error.message}`);
            return [];
        }

        return (data || []).map(item => this.toEventDto(item));
    }

    /**
     * Get upcoming events
     */
    async getUpcomingEvents(sport?: SportType, limit: number = 20): Promise<SportsEventResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        let queryBuilder = supabase
            .from('sports_events')
            .select(`
                *,
                home_team:sports_teams!sports_events_home_team_id_fkey(*),
                away_team:sports_teams!sports_events_away_team_id_fkey(*),
                league:sports_leagues!sports_events_league_id_fkey(*)
            `)
            .eq('status', EventStatus.SCHEDULED)
            .gt('start_time', new Date().toISOString());

        if (sport) {
            queryBuilder = queryBuilder.eq('sport', sport);
        }

        const { data, error } = await queryBuilder
            .order('start_time', { ascending: true })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to get upcoming events: ${error.message}`);
            return [];
        }

        return (data || []).map(item => this.toEventDto(item));
    }

    /**
     * Get event by ID
     */
    async getEventById(id: string): Promise<SportsEventResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('sports_events')
            .select(`
                *,
                home_team:sports_teams!sports_events_home_team_id_fkey(*),
                away_team:sports_teams!sports_events_away_team_id_fkey(*),
                league:sports_leagues!sports_events_league_id_fkey(*)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Event not found: ${id}`);
        }

        return this.toEventDto(data);
    }

    /**
     * Upsert events
     */
    async upsertEvents(events: Partial<SportsEvent>[]): Promise<{ created: number; updated: number }> {
        const supabase = this.supabaseService.getAdminClient();
        let created = 0;
        let updated = 0;

        for (const event of events) {
            const { data: existing } = await supabase
                .from('sports_events')
                .select('id')
                .eq('external_id', event.externalId)
                .eq('source', event.source)
                .single();

            // Resolve league and team IDs
            let leagueId: string | null = null;
            let homeTeamId: string | null = null;
            let awayTeamId: string | null = null;

            if (event.leagueId) {
                const { data: league } = await supabase
                    .from('sports_leagues')
                    .select('id')
                    .eq('external_id', event.leagueId)
                    .single();
                leagueId = league?.id || null;
            }

            if (event.homeTeamId) {
                const { data: team } = await supabase
                    .from('sports_teams')
                    .select('id')
                    .eq('external_id', event.homeTeamId)
                    .single();
                homeTeamId = team?.id || null;
            }

            if (event.awayTeamId) {
                const { data: team } = await supabase
                    .from('sports_teams')
                    .select('id')
                    .eq('external_id', event.awayTeamId)
                    .single();
                awayTeamId = team?.id || null;
            }

            const eventData = {
                league_id: leagueId,
                home_team_id: homeTeamId,
                away_team_id: awayTeamId,
                sport: event.sport,
                season: event.season,
                round: event.round,
                match_day: event.matchDay,
                name: event.name,
                venue: event.venue,
                city: event.city,
                country: event.country,
                start_time: event.startTime?.toISOString(),
                timezone: event.timezone || 'UTC',
                status: event.status,
                status_detail: event.statusDetail,
                elapsed_time: event.elapsedTime,
                home_score: event.homeScore,
                away_score: event.awayScore,
                home_score_halftime: event.homeScoreHalftime,
                away_score_halftime: event.awayScoreHalftime,
                referee: event.referee,
                attendance: event.attendance,
                thumbnail_url: event.thumbnailUrl,
                video_url: event.videoUrl,
                banner_url: event.bannerUrl,
                stats: event.stats || {},
                metadata: event.metadata || {},
                updated_at: new Date().toISOString(),
            };

            if (existing) {
                const { data: updatedEvent } = await supabase
                    .from('sports_events')
                    .update(eventData)
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (updatedEvent) {
                    // Publish update
                    await this.sportsMessagingService.publishEventUpdate({
                        ...updatedEvent,
                        sport: event.sport,
                        startTime: new Date(updatedEvent.start_time),
                        homeScore: updatedEvent.home_score,
                        awayScore: updatedEvent.away_score,
                        status: updatedEvent.status,
                        externalId: updatedEvent.external_id,
                        metadata: {
                            homeTeamName: updatedEvent.home_team?.name, // NOTE: this might be missing if we don't join, but for basic updates it's ok
                            awayTeamName: updatedEvent.away_team?.name,
                        }
                    } as any);
                }
                updated++;
            } else {
                const { data: newEvent } = await supabase.from('sports_events').insert({
                    external_id: event.externalId,
                    source: event.source,
                    ...eventData,
                    has_market: false,
                    is_featured: false,
                })
                    .select()
                    .single();

                if (newEvent) {
                    await this.sportsMessagingService.publishEventUpdate({
                        ...newEvent,
                        sport: event.sport,
                        startTime: new Date(newEvent.start_time),
                        homeScore: newEvent.home_score,
                        awayScore: newEvent.away_score,
                        status: newEvent.status,
                        externalId: newEvent.external_id,
                    } as any);
                }
                created++;
            }
        }

        this.logger.log(`Upserted events: ${created} created, ${updated} updated`);
        return { created, updated };
    }

    /**
     * Upsert markets and outcomes from API odds
     */
    async upsertMarkets(oddsList: any[]): Promise<{ created: number; updated: number }> {
        const supabase = this.supabaseService.getClient();
        let created = 0; // We don't distinguish easily with upsert, treating all as created/updated
        let updated = 0;
        const processedMarkets = new Set<string>();

        for (const odd of oddsList) {
            // Find event
            const { data: event } = await supabase
                .from('sports_events')
                .select('id')
                .eq('external_id', odd.fixture.id.toString())
                .eq('source', 'api_football')
                .single();

            if (!event) continue;

            const bookmaker = odd.bookmakers[0];
            if (!bookmaker) continue;

            // 1 = Match Winner (1x2)
            const matchWinnerBet = bookmaker.bets.find((b: any) => b.id === 1);
            if (!matchWinnerBet) continue;

            const marketId = `${odd.fixture.id}-${matchWinnerBet.id}`;
            if (processedMarkets.has(marketId)) continue;
            processedMarkets.add(marketId);

            const outcomes = matchWinnerBet.values.map((v: any) => v.value);
            const outcomePrices = matchWinnerBet.values.map((v: any) => parseFloat(v.odd));
            const yesPrice = 0.5; // Placeholder

            const { data: market, error } = await supabase
                .from('sports_markets')
                .upsert({
                    event_id: event.id,
                    market_id: marketId,
                    market_type: '1x2',
                    title: matchWinnerBet.name,
                    question: 'Full Time Result',
                    description: `Bookmaker: ${bookmaker.name}`,
                    outcomes: outcomes,
                    outcome_prices: outcomePrices,
                    yes_price: yesPrice,
                    no_price: 1 - yesPrice,
                    volume: 0,
                    liquidity: 0,
                    resolved: false,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'market_id' })
                .select()
                .single();

            if (error) {
                this.logger.error(`Failed to upsert market ${marketId}: ${error.message}`);
            } else {
                updated++;
                await supabase.from('sports_events').update({ has_market: true }).eq('id', event.id);
            }
        }
        return { created, updated };
    }



    /**
     * Generate default markets (Simulator)
     * Creates realistic 1x2 markets for events
     */
    async generateDefaultMarkets(events: any[]): Promise<number> {
        const supabase = this.supabaseService.getClient();
        let generated = 0;
        this.logger.log(`Generating default markets for ${events.length} events...`);

        for (const event of events) {
            // Skip if market already exists
            const { count } = await supabase
                .from('sports_markets')
                .select('id', { count: 'exact', head: true })
                .eq('event_id', event.id);

            if (count && count > 0) continue;

            const homeTeamId = event.homeTeamId;
            const awayTeamId = event.awayTeamId;

            const homeTeam = homeTeamId ? await this.getTeamById(homeTeamId).catch(() => null) : null;
            const awayTeam = awayTeamId ? await this.getTeamById(awayTeamId).catch(() => null) : null;

            let homeName = homeTeam?.name;
            let awayName = awayTeam?.name;

            // Fallback: Parse from event name (e.g., "Home vs Away" or "Home v Away")
            if (!homeName || !awayName) {
                const name = event.name || '';
                const parts = name.split(/ vs | v /i);
                if (parts.length === 2) {
                    homeName = homeName || parts[0].trim();
                    awayName = awayName || parts[1].trim();
                } else {
                    homeName = homeName || 'Home Team';
                    awayName = awayName || 'Away Team';
                }
            }

            // Simulate odds
            // Favor home team slightly (random 0.4 - 0.6)
            const homeProb = 0.45 + (Math.random() * 0.2);
            const drawProb = 0.15 + (Math.random() * 0.1);

            const homePrice = Number(homeProb.toFixed(2));
            const drawPrice = Number(drawProb.toFixed(2));
            const awayPrice = Number((1 - homePrice - drawPrice).toFixed(2)); // Ensure sums to 1

            const { error } = await supabase.from('sports_markets').insert({
                event_id: event.id,
                market_type: '1x2',
                title: 'Match Winner',
                question: 'Who will win the match?',
                description: 'Full Time Result (Simulated)',
                outcomes: [homeName, 'Draw', awayName],
                outcome_prices: [homePrice, drawPrice, awayPrice],
                yes_price: 0,
                no_price: 0,
                volume: Math.floor(Math.random() * 50000) + 1000, // Random volume
                liquidity: Math.floor(Math.random() * 20000) + 500,
                resolved: false,
                is_active: true,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                this.logger.error(`Failed to create simulated market for event ${event.id}: ${error.message}`);
            } else {
                await supabase.from('sports_events').update({ has_market: true }).eq('id', event.id);
                generated++;
            }
        }

        this.logger.log(`Generated ${generated} simulated markets.`);
        return generated;
    }



    // ========================
    // Markets
    // ========================

    /**
     * Get sports markets with filters
     */
    async getMarkets(query: SportsMarketsQueryDto): Promise<PaginatedResult<SportsMarketResponseDto>> {
        const supabase = this.supabaseService.getClient();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        let queryBuilder = supabase
            .from('sports_markets')
            .select(`
                *,
                event:sports_events(
                    *,
                    home_team:sports_teams!sports_events_home_team_id_fkey(*),
                    away_team:sports_teams!sports_events_away_team_id_fkey(*)
                )
            `, { count: 'exact' });

        if (query.eventId) {
            queryBuilder = queryBuilder.eq('event_id', query.eventId);
        }
        if (query.marketType) {
            queryBuilder = queryBuilder.eq('market_type', query.marketType);
        }
        if (query.resolved !== undefined) {
            queryBuilder = queryBuilder.eq('resolved', query.resolved);
        }
        if (query.isActive !== undefined) {
            queryBuilder = queryBuilder.eq('is_active', query.isActive);
        }
        if (query.isFeatured !== undefined) {
            queryBuilder = queryBuilder.eq('is_featured', query.isFeatured);
        }

        const sortField = query.sortBy === 'volume' ? 'volume' :
            query.sortBy === 'createdAt' ? 'created_at' : 'closes_at';
        queryBuilder = queryBuilder
            .order(sortField, { ascending: query.sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder;

        if (error) {
            this.logger.error(`Failed to get markets: ${error.message}`);
            throw new Error(`Failed to get markets: ${error.message}`);
        }

        return {
            data: (data || []).map(item => this.toMarketDto(item)),
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        };
    }

    /**
     * Get market by ID
     */
    async getMarketById(id: string): Promise<SportsMarketResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('sports_markets')
            .select(`
                *,
                event:sports_events(*)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException(`Market not found: ${id}`);
        }

        return this.toMarketDto(data);
    }

    /**
     * Create a sports market
     */
    async createMarket(dto: CreateSportsMarketDto): Promise<SportsMarketResponseDto> {
        const supabase = this.supabaseService.getAdminClient();

        // Verify event exists
        await this.getEventById(dto.eventId);

        const initialPrice = 0.5;
        const { data, error } = await supabase
            .from('sports_markets')
            .insert({
                event_id: dto.eventId,
                market_type: dto.marketType,
                title: dto.title,
                description: dto.description,
                question: dto.question,
                outcomes: dto.outcomes,
                outcome_prices: dto.outcomes.map(() => initialPrice),
                yes_price: initialPrice,
                no_price: initialPrice,
                volume: 0,
                liquidity: 0,
                resolved: false,
                opens_at: dto.opensAt?.toISOString(),
                closes_at: dto.closesAt.toISOString(),
                is_active: true,
                is_featured: false,
                auto_resolve: dto.autoResolve ?? true,
                metadata: {},
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to create market: ${error.message}`);
            throw new Error(`Failed to create market: ${error.message}`);
        }

        // Update event to indicate it has a market
        await supabase
            .from('sports_events')
            .update({ has_market: true, market_created_at: new Date().toISOString() })
            .eq('id', dto.eventId);

        // Publish market created event
        await this.sportsMessagingService.publishMarketCreated({
            ...data,
            eventId: data.event_id,
            outcomePrices: data.outcome_prices,
            yesPrice: data.yes_price,
            noPrice: data.no_price,
            opensAt: data.opens_at ? new Date(data.opens_at) : undefined,
            closesAt: new Date(data.closes_at),
        } as any);

        return this.toMarketDto(data);
    }

    // ========================
    // Transformers
    // ========================

    private toLeagueDto = (data: any): SportsLeagueResponseDto => {
        return {
            id: data.id,
            externalId: data.external_id,
            sport: data.sport,
            name: data.name,
            nameAlternate: data.name_alternate,
            country: data.country,
            countryCode: data.country_code,
            logoUrl: data.logo_url,
            bannerUrl: data.banner_url,
            isActive: data.is_active,
            isFeatured: data.is_featured,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }

    private toTeamDto = (data: any): SportsTeamResponseDto => {
        return {
            id: data.id,
            externalId: data.external_id,
            leagueId: data.league_id,
            sport: data.sport,
            name: data.name,
            nameShort: data.name_short,
            country: data.country,
            city: data.city,
            stadium: data.stadium,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            isActive: data.is_active,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }

    private toEventDto = (data: any): SportsEventResponseDto => {
        return {
            id: data.id,
            externalId: data.external_id,
            leagueId: data.league_id,
            homeTeamId: data.home_team_id,
            awayTeamId: data.away_team_id,
            sport: data.sport,
            season: data.season,
            round: data.round,
            name: data.name,
            venue: data.venue,
            startTime: new Date(data.start_time),
            status: data.status,
            statusDetail: data.status_detail,
            elapsedTime: data.elapsed_time,
            homeScore: data.home_score,
            awayScore: data.away_score,
            thumbnailUrl: data.thumbnail_url,
            hasMarket: data.has_market,
            isFeatured: data.is_featured,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            homeTeam: data.home_team ? this.toTeamDto(data.home_team) : undefined,
            awayTeam: data.away_team ? this.toTeamDto(data.away_team) : undefined,
            league: data.league ? this.toLeagueDto(data.league) : undefined,
        };
    }

    private toMarketDto = (data: any): SportsMarketResponseDto => {
        return {
            id: data.id,
            eventId: data.event_id,
            marketId: data.market_id,
            marketType: data.market_type,
            title: data.title,
            description: data.description,
            question: data.question,
            outcomes: data.outcomes,
            outcomePrices: data.outcome_prices,
            yesPrice: parseFloat(data.yes_price),
            noPrice: parseFloat(data.no_price),
            volume: parseFloat(data.volume),
            liquidity: parseFloat(data.liquidity),
            resolved: data.resolved,
            outcome: data.outcome,
            opensAt: data.opens_at ? new Date(data.opens_at) : undefined,
            closesAt: data.closes_at ? new Date(data.closes_at) : undefined,
            isActive: data.is_active,
            isFeatured: data.is_featured,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            event: data.event ? this.toEventDto(data.event) : undefined,
        };
    }
}
