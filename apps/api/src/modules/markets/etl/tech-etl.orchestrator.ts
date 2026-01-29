/**
 * Tech ETL Orchestrator
 * 
 * ETL pipeline for technology data from HackerNews, NewsAPI.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { BaseETLOrchestrator, ETLResult, MarketDataItem } from './base-etl.orchestrator.js';
import { HackerNewsClient, NewsAPIClient } from '../clients/index.js';
import { MarketMessagingService } from '../market-messaging.service.js';

@Injectable()
export class TechETLOrchestrator extends BaseETLOrchestrator implements OnModuleInit {
    private hackerNews: HackerNewsClient;
    private newsApi: NewsAPIClient;

    constructor(
        private readonly configService: ConfigService,
        private readonly messagingService: MarketMessagingService
    ) {
        super('TechETLOrchestrator', 'tech');
        this.syncInterval = 15 * 60 * 1000; // 15 minutes

        this.hackerNews = new HackerNewsClient();
        this.newsApi = new NewsAPIClient(configService);
    }

    async onModuleInit() {
        this.logger.log('Tech ETL Orchestrator initialized');
        setTimeout(() => this.runSync(), 15000);
    }

    @Cron(CronExpression.EVERY_30_MINUTES)
    async scheduledSync() {
        await this.runSync();
    }

    async sync(): Promise<ETLResult> {
        const startedAt = new Date();
        const errors: string[] = [];
        let recordsFetched = 0;
        let recordsCreated = 0;
        let recordsUpdated = 0;
        let recordsSkipped = 0;
        let recordsFailed = 0;
        let duplicatesFound = 0;

        try {
            // 1. Fetch HackerNews stories
            this.logger.debug('Fetching HackerNews stories...');
            const hnStories = await this.fetchHackerNews();
            recordsFetched += hnStories.length;

            // Store in tech_hn_stories
            await this.storeHNStories(hnStories);

            // Transform to market items
            const hnItems = hnStories.map(s => this.transformHNToItem(s));
            const hnStats = await this.upsertItems(hnItems);
            recordsCreated += hnStats.created;
            recordsUpdated += hnStats.updated;
            duplicatesFound += hnStats.duplicates;

            // Stream updates
            await this.messagingService.publishMessage('tech', hnItems, 'news_update');

            // 2. Fetch tech news from NewsAPI
            this.logger.debug('Fetching tech news...');
            const techNews = await this.fetchTechNews();
            recordsFetched += techNews.length;

            const newsItems = techNews.map(n => this.transformNewsToItem(n));
            const newsStats = await this.upsertItems(newsItems);
            recordsCreated += newsStats.created;
            recordsUpdated += newsStats.updated;
            duplicatesFound += newsStats.duplicates;

            // Stream updates
            await this.messagingService.publishMessage('tech', newsItems, 'news_update');

        } catch (error) {
            errors.push((error as Error).message);
        }

        const completedAt = new Date();
        return {
            category: this.category,
            source: 'hackernews,newsapi',
            startedAt,
            completedAt,
            durationMs: completedAt.getTime() - startedAt.getTime(),
            recordsFetched,
            recordsCreated,
            recordsUpdated,
            recordsSkipped,
            recordsFailed,
            duplicatesFound,
            errors,
        };
    }

    private async fetchHackerNews() {
        try {
            return await this.hackerNews.getTrendingTechStories(30);
        } catch (error) {
            this.logger.warn(`Failed to fetch HN: ${(error as Error).message}`);
            return [];
        }
    }

    private async fetchTechNews() {
        try {
            return await this.newsApi.getNewsByCategory('tech', 20);
        } catch (error) {
            this.logger.warn(`Failed to fetch tech news: ${(error as Error).message}`);
            return [];
        }
    }

    private async storeHNStories(stories: any[]) {
        for (const story of stories) {
            try {
                await this.supabase.from('tech_hn_stories').upsert({
                    hn_id: story.hnId,
                    title: story.title,
                    url: story.url,
                    text: story.text,
                    author: story.author,
                    score: story.score,
                    descendants: story.commentCount,
                    story_type: story.storyType,
                    published_at: story.publishedAt.toISOString(),
                }, {
                    onConflict: 'hn_id',
                });
            } catch (error) {
                this.logger.warn(`Failed to store HN story: ${(error as Error).message}`);
            }
        }
    }

    private transformHNToItem(story: any): MarketDataItem {
        const sentiment = this.analyzeSentiment(story.title);
        return {
            externalId: story.id,
            source: 'hackernews',
            category: 'tech',
            contentType: 'news',
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.hnId}`,
            sourceName: 'Hacker News',
            author: story.author,
            publishedAt: story.publishedAt,
            impact: this.calculateImpact({ score: story.score }),
            sentiment: sentiment.sentiment,
            sentimentScore: sentiment.score,
            metadata: {
                hnId: story.hnId,
                score: story.score,
                commentCount: story.commentCount,
            },
        };
    }

    private transformNewsToItem(article: any): MarketDataItem {
        const transformed = this.newsApi.transformToMarketDataItem(article, 'tech');
        return {
            ...transformed,
            sentiment: this.analyzeSentiment(article.title).sentiment,
        };
    }
}
