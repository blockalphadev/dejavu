import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO representing a sport from Polymarket Gamma API
 */
export class SportDto {
    @ApiProperty({
        description: 'Unique identifier for the sport',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Name of the sport',
        example: 'NFL',
        type: String,
    })
    sport: string;

    @ApiProperty({
        description: 'URL to the sport image',
        example: 'https://example.com/nfl.png',
        type: String,
    })
    image: string;

    @ApiProperty({
        description: 'Resolution type or status',
        example: 'resolved',
        type: String,
    })
    resolution: string;

    @ApiProperty({
        description: 'Ordering value for sorting',
        example: '1',
        type: String,
    })
    ordering: string;

    @ApiProperty({
        description: 'Tags associated with the sport',
        example: 'football,american',
        type: String,
    })
    tags: string;

    @ApiProperty({
        description: 'Series information',
        example: '2024',
        type: String,
    })
    series: string;

    @ApiProperty({
        description: 'ISO 8601 timestamp when the sport was created',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time',
    })
    createdAt: string;
}

/**
 * Response DTO for GET /sports endpoint
 */
export class SportsResponseDto {
    @ApiProperty({
        description: 'Array of sports',
        type: [SportDto],
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
        ],
    })
    data: SportDto[];
}

