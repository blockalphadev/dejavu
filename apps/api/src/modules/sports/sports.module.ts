/**
 * Sports Module
 * 
 * Main NestJS module for sports data scraping and prediction markets.
 * Integrates TheSportsDB and API-Football clients with sync services.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SportsController } from './sports.controller.js';
import { SportsService } from './sports.service.js';
import { SportsSyncService } from './sports-sync.service.js';
import { SportsMessagingService } from './sports-messaging.service.js';
import { SportsCleanerService } from './sports-cleaner.service.js';
import { SportsGateway } from './sports.gateway.js';
import { TheSportsDBClient } from './clients/thesportsdb.client.js';
import { APIFootballClient } from './clients/api-football.client.js';

@Module({
    imports: [ConfigModule],
    controllers: [SportsController],
    providers: [
        SportsService,
        SportsSyncService,
        SportsMessagingService,
        SportsCleanerService,
        SportsGateway,
        TheSportsDBClient,
        APIFootballClient,
    ],
    exports: [
        SportsService,
        SportsSyncService,
        SportsMessagingService,
        SportsCleanerService,
        SportsGateway,
        TheSportsDBClient,
        APIFootballClient,
    ],
})
export class SportsModule { }
