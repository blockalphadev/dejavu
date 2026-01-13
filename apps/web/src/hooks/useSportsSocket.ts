import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../app/components/auth/AuthContext';

// Configure URL based on environment
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SportsEventUpdate {
    eventId: string;
    sport: string;
    status: string;
    homeScore?: number;
    awayScore?: number;
    elapsedTime?: string;
    timestamp: string;
}

export interface MarketUpdate {
    marketId: string;
    eventId: string;
    outcomePrices: number[];
    timestamp: string;
}

interface UseSportsSocketProps {
    sport?: string;
    eventId?: string;
    onEventUpdate?: (update: SportsEventUpdate) => void;
    onMarketUpdate?: (update: MarketUpdate) => void;
}

export const useSportsSocket = ({
    sport,
    eventId,
    onEventUpdate,
    onMarketUpdate,
}: UseSportsSocketProps = {}) => {
    const { } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Connect to WebSocket
    useEffect(() => {
        if (socketRef.current?.connected) return;

        // Create socket connection
        const socket = io(`${SOCKET_URL}/sports`, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
        });

        socketRef.current = socket;

        // Event listeners
        socket.on('connect', () => {
            console.log('Connected to Sports Gateway');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Sports Gateway');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setIsConnected(false);
        });

        socket.on('sports.update', (data: SportsEventUpdate) => {
            if (onEventUpdate) onEventUpdate(data);
        });

        socket.on('market.update', (data: MarketUpdate) => {
            if (onMarketUpdate) onMarketUpdate(data);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []); // Run once on mount to establish connection

    // Handle subscriptions when sport/eventId changes
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;

        if (sport) {
            socket.emit('join-sport', sport);
            console.log(`Subscribed to sport: ${sport}`);

            // Subscribe to live events for this sport
            socket.emit('subscribe_live', { sport });
        }

        if (eventId) {
            socket.emit('join-event', eventId);
            console.log(`Subscribed to event: ${eventId}`);
        }

        return () => {
            if (isConnected) {
                if (sport) {
                    socket.emit('leave-sport', sport);
                }
                if (eventId) {
                    socket.emit('leave-event', eventId);
                }
            }
        };
    }, [sport, eventId, isConnected]);

    // Manual join/leave methods if needed
    const joinRoom = useCallback((room: string) => {
        socketRef.current?.emit('join', room);
    }, []);

    const leaveRoom = useCallback((room: string) => {
        socketRef.current?.emit('leave', room);
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        joinRoom,
        leaveRoom,
    };
};
