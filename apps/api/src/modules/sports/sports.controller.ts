import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiProduces,
} from '@nestjs/swagger';
import { SportsService } from './sports.service.js';
import { SportsResponseDto, SportDto } from './dto/index.js';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
    constructor(private readonly sportsService: SportsService) {}

    /**
     * Get all sports from Polymarket Gamma API
     * This endpoint acts as a proxy to fetch sports data from the upstream API
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiProduces('application/json')
    @ApiOperation({
        summary: 'Get all sports',
        description:
            'Fetches sports data from Polymarket Gamma API and returns it as a normalized array. This is a read-only proxy endpoint.',
    })
    @ApiResponse({
        status: 200,
        description: 'Sports data retrieved successfully',
        type: [SportDto],
        schema: {
            example: [
                {
                    id: 1,
                    sport: 'NFL',
                    image: 'https://example.com/nfl.png',
                    resolution: 'resolved',
                    ordering: '1',
                    tags: 'football,american',
                    series: '2024',
                    createdAt: '2024-01-15T10:30:00.000Z',
                },
                {
                    id: 2,
                    sport: 'NBA',
                    image: 'https://example.com/nba.png',
                    resolution: 'active',
                    ordering: '2',
                    tags: 'basketball',
                    series: '2024',
                    createdAt: '2024-01-16T12:00:00.000Z',
                },
            ],
        },
    })
    @ApiResponse({
        status: 502,
        description: 'Bad Gateway - Upstream API is unavailable or returned an error',
        schema: {
            example: {
                statusCode: 502,
                message: 'Failed to fetch sports data from upstream API',
                error: 'Bad Gateway',
                details: 'Upstream API returned status 500',
            },
        },
    })
    @ApiResponse({
        status: 502,
        description: 'Bad Gateway - Request to upstream API timed out',
        schema: {
            example: {
                statusCode: 502,
                message: 'Request to upstream API timed out',
                error: 'Bad Gateway',
            },
        },
    })
    async findAll(): Promise<SportDto[]> {
        return this.sportsService.findAll();
    }
}

