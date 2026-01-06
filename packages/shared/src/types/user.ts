/**
 * User Types
 *
 * Type definitions for user management
 */

import type { WalletAddress } from './chain';
import type { Auditable, UserId, UUID, SoftDeletable } from './common';

/**
 * User authentication provider
 */
export type AuthProvider =
    | 'email'
    | 'google'
    | 'wallet'
    | 'magic_link';

/**
 * User role
 */
export type UserRole =
    | 'user'
    | 'creator'     // Can create markets
    | 'moderator'   // Can moderate content
    | 'resolver'    // Can resolve markets
    | 'admin';      // Full access

/**
 * User status
 */
export type UserStatus =
    | 'pending'     // Email not verified
    | 'active'      // Normal active user
    | 'suspended'   // Temporarily suspended
    | 'banned';     // Permanently banned

/**
 * User preferences
 */
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: {
        email: boolean;
        push: boolean;
        marketUpdates: boolean;
        priceAlerts: boolean;
    };
    privacy: {
        showProfile: boolean;
        showPositions: boolean;
        showActivity: boolean;
    };
}

/**
 * User profile information
 */
export interface UserProfile {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    website?: string;
    twitter?: string;
    discord?: string;
}

/**
 * User statistics
 */
export interface UserStats {
    totalTrades: number;
    winRate: number;
    totalVolume: string;
    profitLoss: string;
    marketsCreated: number;
    marketsParticipated: number;
}

/**
 * Core User entity
 */
export interface User extends Auditable, SoftDeletable {
    id: UserId;
    email?: string;
    emailVerified: boolean;
    username?: string;
    role: UserRole;
    status: UserStatus;
    authProviders: AuthProvider[];
    wallets: WalletAddress[];
    profile: UserProfile;
    preferences: UserPreferences;
    stats?: UserStats;
    lastLoginAt?: Date;
    lastActiveAt?: Date;
}

/**
 * User session
 */
export interface UserSession {
    id: UUID;
    userId: UserId;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    deviceInfo?: {
        userAgent?: string;
        ip?: string;
        platform?: string;
    };
    createdAt: Date;
}

/**
 * User position in a market
 */
export interface UserPosition {
    id: UUID;
    userId: UserId;
    marketId: string;
    outcomeId: string;
    shares: string;
    averagePrice: string;
    totalCost: string;
    currentValue: string;
    unrealizedPnl: string;
    realizedPnl: string;
    lastUpdatedAt: Date;
}

/**
 * User signup request
 */
export interface SignupRequest {
    email: string;
    password: string;
    username?: string;
}

/**
 * User login request
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
    user: Omit<User, 'deletedAt' | 'isDeleted'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
