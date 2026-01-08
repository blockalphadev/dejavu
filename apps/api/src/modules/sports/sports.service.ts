import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SportDto } from './dto/index.js';

/**
 * Service for fetching sports data from Polymarket Gamma API
 */
@Injectable()
export class SportsService {
    private readonly logger = new Logger(SportsService.name);
    private readonly gammaApiUrl: string;
    private readonly requestTimeout: number;

    constructor(private readonly configService: ConfigService) {
        this.gammaApiUrl =
            this.configService.get<string>(
                'POLYMARKET_GAMMA_API_URL',
                'https://gamma-api.polymarket.com/sports',
            );
        this.requestTimeout =
            this.configService.get<number>('POLYMARKET_API_TIMEOUT_MS', 10000);
    }

    /**
     * Fetch all sports from Polymarket Gamma API
     * @returns Array of sports data
     * @throws HttpException if the upstream API fails
     */
    async findAll(): Promise<SportDto[]> {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.requestTimeout,
        );

        try {
            this.logger.debug(`Fetching sports from ${this.gammaApiUrl}`);

            const response = await fetch(this.gammaApiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'DeJaVu-API/1.0',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                this.logger.error(
                    `Polymarket API returned ${response.status}: ${errorText}`,
                );
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_GATEWAY,
                        message: 'Failed to fetch sports data from upstream API',
                        error: 'Bad Gateway',
                        details: `Upstream API returned status ${response.status}`,
                    },
                    HttpStatus.BAD_GATEWAY,
                );
            }

            const data = await response.json();

            // Validate and normalize the response
            if (!Array.isArray(data)) {
                this.logger.warn('Polymarket API returned non-array response');
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_GATEWAY,
                        message: 'Invalid response format from upstream API',
                        error: 'Bad Gateway',
                    },
                    HttpStatus.BAD_GATEWAY,
                );
            }

            // Normalize the data to ensure all fields are present
            const normalizedSports = data.map((sport: any) => this.normalizeSport(sport));

            this.logger.log(`Successfully fetched ${normalizedSports.length} sports`);
            return normalizedSports;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof HttpException) {
                throw error;
            }

            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.error('Request to Polymarket API timed out');
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_GATEWAY,
                        message: 'Request to upstream API timed out',
                        error: 'Bad Gateway',
                    },
                    HttpStatus.BAD_GATEWAY,
                );
            }

            this.logger.error(
                `Error fetching sports from Polymarket API: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_GATEWAY,
                    message: 'Failed to fetch sports data from upstream API',
                    error: 'Bad Gateway',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                HttpStatus.BAD_GATEWAY,
            );
        }
    }

    /**
     * Normalize sport data to ensure all required fields are present
     * @param sport Raw sport data from API
     * @returns Normalized sport DTO
     */
    private normalizeSport(sport: any): SportDto {
        return {
            id: Number(sport.id) || 0,
            sport: String(sport.sport || ''),
            image: String(sport.image || ''),
            resolution: String(sport.resolution || ''),
            ordering: String(sport.ordering || ''),
            tags: String(sport.tags || ''),
            series: String(sport.series || ''),
            createdAt: sport.createdAt
                ? new Date(sport.createdAt).toISOString()
                : new Date().toISOString(),
        };
    }
}

