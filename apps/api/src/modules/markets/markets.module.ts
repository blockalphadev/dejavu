import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketsController } from './markets.controller.js';
import { MarketsService } from './markets.service.js';
import { SignalsController } from './signals.controller.js';
import { SignalsService } from './signals.service.js';
import { MarketDataController } from './market-data.controller.js';
import { MarketDataService } from './market-data.service.js';
import { MarketDataGateway } from './market-data.gateway.js';
import { MarketMessagingService } from './market-messaging.service.js';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';

// API Clients
import {
    NewsAPIClient,
    GDELTClient,
    AlphaVantageClient,
    CoinGeckoClient,
    CoinMarketCapClient,
    CryptoPanicClient,
    CryptoClient,
    HackerNewsClient,
    SemanticScholarClient,
    ArxivClient,
    ScienceClient,
    WorldBankClient,
    IMFClient,
    OECDClient,
    RSSClient,
} from './clients/index.js';

// ETL Orchestrators
import {
    CryptoETLOrchestrator,
    TechETLOrchestrator,
    PoliticsETLOrchestrator,
    FinanceETLOrchestrator,
    ScienceETLOrchestrator,
    EconomyETLOrchestrator,
    SignalsETLOrchestrator,
} from './etl/index.js';

@Module({
    imports: [ConfigModule, ScheduleModule.forRoot()],
    controllers: [MarketsController, MarketDataController, SignalsController, RecommendationsController],
    providers: [
        // Services
        MarketsService,
        SignalsService,
        MarketDataService,
        MarketMessagingService,
        RecommendationsService,

        // Gateway
        MarketDataGateway,

        // API Clients
        NewsAPIClient,
        GDELTClient,
        AlphaVantageClient,
        CoinGeckoClient,
        CoinMarketCapClient,
        CryptoPanicClient,
        CryptoClient,
        HackerNewsClient,
        SemanticScholarClient,
        ArxivClient,
        ScienceClient,
        WorldBankClient,
        IMFClient,
        WorldBankClient,
        IMFClient,
        OECDClient,
        RSSClient, // Added RSSClient

        // ETL Orchestrators
        CryptoETLOrchestrator,
        TechETLOrchestrator,
        PoliticsETLOrchestrator,
        FinanceETLOrchestrator,
        ScienceETLOrchestrator,
        EconomyETLOrchestrator,
        SignalsETLOrchestrator,
    ],
    exports: [
        MarketsService,
        SignalsService,
        MarketDataService,
        MarketDataGateway,
        MarketMessagingService,
        CryptoClient,
    ],
})
export class MarketsModule { }

