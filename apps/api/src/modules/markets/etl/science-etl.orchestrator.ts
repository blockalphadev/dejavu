/**
 * Science ETL Orchestrator
 * 
 * ETL pipeline for science data from Semantic Scholar, arXiv.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseETLOrchestrator, ETLResult, MarketDataItem } from './base-etl.orchestrator.js';
import { SemanticScholarClient, ArxivClient } from '../clients/index.js';
import { MarketMessagingService } from '../market-messaging.service.js';

@Injectable()
export class ScienceETLOrchestrator extends BaseETLOrchestrator implements OnModuleInit {
    private semanticScholar: SemanticScholarClient;
    private arxiv: ArxivClient;

    constructor(private readonly messagingService: MarketMessagingService) {
        super('ScienceETLOrchestrator', 'science');
        this.syncInterval = 6 * 60 * 60 * 1000; // 6 hours

        this.semanticScholar = new SemanticScholarClient();
        this.arxiv = new ArxivClient();
    }

    async onModuleInit() {
        this.logger.log('Science ETL Orchestrator initialized');
        setTimeout(() => this.runSync(), 30000);
    }

    @Cron('0 */6 * * *') // Every 6 hours
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
            // 1. Fetch AI/ML papers from Semantic Scholar
            this.logger.debug('Fetching AI papers...');
            const aiPapers = await this.fetchAIPapers();
            recordsFetched += aiPapers.length;

            await this.storePapers(aiPapers);
            const aiItems = aiPapers.map(p => this.transformPaperToItem(p));
            const aiStats = await this.upsertItems(aiItems);
            recordsCreated += aiStats.created;
            recordsUpdated += aiStats.updated;
            duplicatesFound += aiStats.duplicates;

            // Stream updates
            await this.messagingService.publishMessage('science', aiItems, 'papers_update');

            // 2. Fetch recent arXiv papers
            this.logger.debug('Fetching arXiv papers...');
            const arxivPapers = await this.fetchArxivPapers();
            recordsFetched += arxivPapers.length;

            await this.storePapers(arxivPapers);
            const arxivItems = arxivPapers.map(p => this.transformPaperToItem(p));
            const arxivStats = await this.upsertItems(arxivItems);
            recordsCreated += arxivStats.created;
            recordsUpdated += arxivStats.updated;
            duplicatesFound += arxivStats.duplicates;

            // Stream updates
            await this.messagingService.publishMessage('science', arxivItems, 'papers_update');

        } catch (error) {
            errors.push((error as Error).message);
        }

        const completedAt = new Date();
        return {
            category: this.category,
            source: 'semantic_scholar,arxiv',
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

    private async fetchAIPapers() {
        try {
            return await this.semanticScholar.searchPapers('artificial intelligence deep learning', { limit: 20 });
        } catch (error) {
            this.logger.warn(`Failed to fetch AI papers: ${(error as Error).message}`);
            return [];
        }
    }

    private async fetchArxivPapers() {
        try {
            return await this.arxiv.getRecentPapers('cs.AI', 20);
        } catch (error) {
            this.logger.warn(`Failed to fetch arXiv papers: ${(error as Error).message}`);
            return [];
        }
    }

    private async storePapers(papers: any[]) {
        for (const paper of papers) {
            try {
                await this.supabase.from('science_papers').upsert({
                    external_id: paper.externalId,
                    source: paper.source,
                    title: paper.title,
                    abstract: paper.abstract,
                    authors: paper.authors,
                    author_count: paper.authors?.length || 0,
                    first_author: paper.authors?.[0]?.name,
                    venue: paper.venue,
                    published_date: paper.publicationDate?.toISOString()?.split('T')[0],
                    citation_count: paper.citationCount,
                    reference_count: paper.referenceCount,
                    is_open_access: paper.isOpenAccess,
                    pdf_url: paper.pdfUrl,
                    paper_url: paper.paperUrl,
                    fields_of_study: paper.fieldsOfStudy,
                    tldr: paper.tldr,
                }, {
                    onConflict: 'external_id,source',
                });
            } catch (error) {
                this.logger.warn(`Failed to store paper: ${(error as Error).message}`);
            }
        }
    }

    private transformPaperToItem(paper: any): MarketDataItem {
        return {
            externalId: paper.id,
            source: paper.source,
            category: 'science',
            contentType: 'research',
            title: paper.title,
            description: paper.tldr || paper.abstract?.substring(0, 300),
            url: paper.paperUrl,
            sourceName: paper.venue || paper.source,
            author: paper.authors?.[0]?.name,
            publishedAt: paper.publicationDate,
            tags: paper.fieldsOfStudy || [],
            impact: paper.citationCount > 100 ? 'high' : paper.citationCount > 10 ? 'medium' : 'low',
            metadata: {
                citationCount: paper.citationCount,
                referenceCount: paper.referenceCount,
            },
        };
    }
}
