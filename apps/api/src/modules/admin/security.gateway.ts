import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';

@WebSocketGateway({
    cors: {
        origin: '*', // Configure this appropriately for production
    },
    namespace: 'security',
})
export class SecurityGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SecurityGateway.name);
    // Track connected clients count for the dashboard
    private activeConnections = 0;

    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Simplified Auth Check - in prod use a proper Guard or Middleware
            // Extract token from query or headers
            const token = client.handshake.query.token as string ||
                client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                // Allow unauthenticated connection for now during dev/test if needed
                // But generally should disconnect:
                // throw new UnauthorizedException('No token provided');
                this.logger.debug(`Client connected without token: ${client.id}`);
            } else {
                // Verify token if present
                // const payload = this.jwtService.verify(token);
                this.logger.debug(`Client connected with token: ${client.id}`);
            }

            this.activeConnections++;
            this.emitSystemStatus();

            // Join default room
            client.join('admin-dashboard');

        } catch (err) {
            this.logger.error(`Connection failed: ${err.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.activeConnections--;
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    // ========================================================================
    // EMISSION METHODS
    // ========================================================================

    /**
     * Emits a high-frequency "pulse" for traffic charts.
     * This is called by a scheduler or service interval.
     */
    emitTrafficStats(stats: any) {
        this.server.to('admin-dashboard').emit('traffic_update', stats);
    }

    /**
     * Emits a new threat alert when detected.
     */
    emitThreatAlert(alert: any) {
        this.server.to('admin-dashboard').emit('threat_detected', alert);
    }

    /**
     * Emits system health status
     */
    emitSystemStatus() {
        this.server.to('admin-dashboard').emit('system_status', {
            online: true,
            connections: this.activeConnections,
            timestamp: new Date().toISOString(),
        });
    }
}
