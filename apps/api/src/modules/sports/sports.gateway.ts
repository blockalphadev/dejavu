/**
 * Sports Gateway
 * 
 * WebSocket gateway for real-time sports data streaming.
 * Subscribes to SportsMessagingService events and broadcasts updates to connected clients.
 * 
 * Events:
 * - sports.update: Real-time score/time updates
 * - market.update: Market odds/status updates
 */

import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SportsMessagingService, SPORTS_ROUTING_KEYS, SportsEventMessage, SportsMarketMessage } from './sports-messaging.service.js';
import { EventStatus } from './types/sports.types.js';

@WebSocketGateway({
    namespace: 'sports',
    cors: {
        origin: '*', // Configure appropriately for production
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class SportsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SportsGateway.name);

    constructor(
        private readonly sportsMessagingService: SportsMessagingService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Sports WebSocket Gateway initialized');
        this.setupSubscriptions();
    }

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
        client.emit('connection', { status: 'connected', message: 'Welcome to Sports Stream' });
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-sport')
    handleJoinSport(client: Socket, sport: string) {
        const room = `sport:${sport}`;
        client.join(room);
        this.logger.debug(`Client ${client.id} joined ${room}`);
        return { event: 'joined', data: room };
    }

    @SubscribeMessage('leave-sport')
    handleLeaveSport(client: Socket, sport: string) {
        const room = `sport:${sport}`;
        client.leave(room);
        this.logger.debug(`Client ${client.id} left ${room}`);
        return { event: 'left', data: room };
    }

    @SubscribeMessage('join-event')
    handleJoinEvent(client: Socket, eventId: string) {
        const room = `event:${eventId}`;
        client.join(room);
        this.logger.debug(`Client ${client.id} joined ${room}`);
        return { event: 'joined', data: room };
    }

    @SubscribeMessage('leave-event')
    handleLeaveEvent(client: Socket, eventId: string) {
        const room = `event:${eventId}`;
        client.leave(room);
        this.logger.debug(`Client ${client.id} left ${room}`);
        return { event: 'left', data: room };
    }

    /**
     * Setup subscriptions to SportsMessagingService
     */
    private setupSubscriptions() {
        // Subscribe to event updates (Live, Finished, Updated)
        this.sportsMessagingService.registerHandler<SportsEventMessage>(
            SPORTS_ROUTING_KEYS.EVENT_LIVE,
            async (msg) => this.broadcastEventUpdate(msg)
        );

        this.sportsMessagingService.registerHandler<SportsEventMessage>(
            SPORTS_ROUTING_KEYS.EVENT_UPDATED,
            async (msg) => this.broadcastEventUpdate(msg)
        );

        this.sportsMessagingService.registerHandler<SportsEventMessage>(
            SPORTS_ROUTING_KEYS.EVENT_FINISHED,
            async (msg) => this.broadcastEventUpdate(msg)
        );

        // Subscribe to market updates
        this.sportsMessagingService.registerHandler<SportsMarketMessage>(
            SPORTS_ROUTING_KEYS.ODDS_UPDATED,
            async (msg) => this.broadcastMarketUpdate(msg)
        );

        this.sportsMessagingService.registerHandler<SportsMarketMessage>(
            SPORTS_ROUTING_KEYS.MARKET_RESOLVED,
            async (msg) => this.broadcastMarketUpdate(msg)
        );
    }

    /**
     * Broadcast event update to subscribers
     */
    public broadcastEventUpdate(event: SportsEventMessage) {
        // Broadcast to specific sport room
        if (event.sport) {
            this.server.to(`sport:${event.sport}`).emit('sports.update', event);
        }

        // Broadcast to specific event room
        this.server.to(`event:${event.eventId}`).emit('sports.update', event);

        // Broadcast to global 'live' room if event is active
        if (event.status === EventStatus.LIVE || event.status === EventStatus.HALFTIME) {
            this.server.to('sport:live').emit('sports.update', event);
        }
    }

    /**
     * Broadcast market update to subscribers
     */
    public broadcastMarketUpdate(market: SportsMarketMessage) {
        // Broadcast to event room
        this.server.to(`event:${market.eventId}`).emit('market.update', market);
    }
}
