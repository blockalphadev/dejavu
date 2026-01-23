/**
 * DeJaVu API Client
 * Handles all communication with the backend API
 */

import { API_URL } from '../config';
export { API_URL };

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface AuthResponse {
    user: {
        id: string;
        email?: string;
        fullName?: string;
        avatarUrl?: string;
        walletAddresses?: Array<{ address: string; chain: string }>;
    };
    tokens: AuthTokens;
}

// Token management
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Set access token
 */
export function setAccessToken(token: string, expiresIn: number): void {
    accessToken = token;
    tokenExpiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('dejavu_access_token', token);
    localStorage.setItem('dejavu_token_expires', tokenExpiresAt.toString());
}

/**
 * Set refresh token
 */
export function setRefreshToken(token: string): void {
    refreshTokenValue = token;
    localStorage.setItem('dejavu_refresh_token', token);
}

/**
 * Get refresh token
 */
function getRefreshToken(): string | null {
    if (refreshTokenValue) {
        return refreshTokenValue;
    }
    const stored = localStorage.getItem('dejavu_refresh_token');
    if (stored) {
        refreshTokenValue = stored;
        return refreshTokenValue;
    }
    return null;
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return accessToken;
    }

    // Try from localStorage
    const stored = localStorage.getItem('dejavu_access_token');
    const expires = localStorage.getItem('dejavu_token_expires');

    if (stored && expires && Date.now() < parseInt(expires, 10)) {
        accessToken = stored;
        tokenExpiresAt = parseInt(expires, 10);
        return accessToken;
    }

    return null;
}

/**
 * Clear tokens (logout)
 */
export function clearTokens(): void {
    accessToken = null;
    refreshTokenValue = null;
    tokenExpiresAt = null;
    localStorage.removeItem('dejavu_access_token');
    localStorage.removeItem('dejavu_refresh_token');
    localStorage.removeItem('dejavu_token_expires');
}

/**
 * Check if authenticated
 */
export function isAuthenticated(): boolean {
    return getAccessToken() !== null;
}

/**
 * Make API request
 */
/**
 * Make API request
 */
/**
 * Make API request with enhanced security and error handling
 */
export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, signal } = options;

    const token = getAccessToken();
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Security: Add CSRF token if available (cookie or meta)
    // In a real implementation, we would extract this from a cookie like 'XSRF-TOKEN'
    // const csrfToken = getCookie('XSRF-TOKEN');
    // if (csrfToken) requestHeaders['X-XSRF-TOKEN'] = csrfToken;

    // Debug logging (dev only)
    if (import.meta.env.DEV && endpoint.includes('/admin/')) {
        console.log(`[API] ${method} ${endpoint}`, body ? { body } : '');
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include', // Important for httpOnly cookies
            signal, // Support request cancellation
        });

        // Security: Rate Limit Handling
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || '60'} seconds.`);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Request failed' }));

            // Handle token expiration
            if (response.status === 401) {
                // Prevent infinite loops if refresh fails
                if (!endpoint.includes('/auth/refresh')) {
                    const refreshed = await refreshToken();
                    if (refreshed) {
                        return apiRequest(endpoint, options);
                    }
                }
                clearTokens();
                // Optional: Dispatch event or redirect
                // window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('Session expired. Please log in again.');
            }

            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            // Request was cancelled, rethrow or handle silently
            throw error;
        }
        console.error(`[API Error] ${method} ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Refresh access token
 */
async function refreshToken(): Promise<boolean> {
    try {
        const storedRefreshToken = getRefreshToken();
        if (!storedRefreshToken) {
            return false;
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        if (data.accessToken) {
            setAccessToken(data.accessToken, data.expiresIn);
            if (data.refreshToken) {
                setRefreshToken(data.refreshToken);
            }
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// ============================================
// Auth API
// ============================================

export const authApi = {
    /**
     * Sign up with email and password
     */
    async signup(email: string, password: string, fullName?: string): Promise<AuthResponse> {
        const response = await apiRequest<AuthResponse>('/auth/signup', {
            method: 'POST',
            body: { email, password, fullName },
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Send magic link
     */
    async sendMagicLink(email: string): Promise<{ message: string }> {
        return apiRequest('/auth/magic-link', {
            method: 'POST',
            body: { email },
        });
    },

    /**
     * Get wallet challenge
     */
    async getWalletChallenge(address: string, chain: string): Promise<{ message: string; nonce: string }> {
        return apiRequest('/auth/wallet/challenge', {
            method: 'POST',
            body: { address, chain },
        });
    },

    /**
     * Verify wallet signature
     */
    async verifyWallet(
        address: string,
        chain: string,
        signature: string,
        message: string,
    ): Promise<AuthResponse> {
        const response = await apiRequest<AuthResponse>('/auth/wallet/verify', {
            method: 'POST',
            body: { address, chain, signature, message },
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Get current user
     */
    async me() {
        return apiRequest('/auth/me', {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            clearTokens();
        }
    },

    /**
     * Google OAuth URL
     */
    getGoogleAuthUrl(): string {
        return `${API_URL}/auth/google`;
    },

    /**
     * Complete profile for Google OAuth users
     * @param data Profile completion data
     */
    async completeGoogleProfile(data: {
        username: string;
        fullName?: string;
        agreeToTerms: boolean;
        agreeToPrivacy: boolean;
    }): Promise<AuthResponse> {
        const response = await apiRequest<AuthResponse>('/auth/google/complete-profile', {
            method: 'POST',
            body: data,
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Check username availability
     * @param username Username to check
     */
    async checkUsernameAvailable(username: string): Promise<{
        available: boolean;
        username: string;
        message?: string;
    }> {
        return apiRequest(`/auth/check-username/${encodeURIComponent(username)}`);
    },
};

// ============================================
// Wallet Auth API (SIWE-based multi-chain)
// ============================================

export interface WalletChallengeResponse {
    message: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
    domain: string;
}

export interface WalletAuthResponse {
    user: {
        id: string;
        email?: string;
        username?: string;
        fullName?: string;
        avatarUrl?: string;
        bio?: string;
        walletAddresses?: Array<{ address: string; chain: string }>;
    };
    tokens: AuthTokens;
    profilePending: boolean;
    wallet: {
        address: string;
        chain: string;
        provider?: string;
    };
}

export interface ConnectedWallet {
    id: string;
    address: string;
    chain: string;
    provider: string;
    label?: string;
    isPrimary: boolean;
    isVerified: boolean;
    verifiedAt?: string;
    createdAt: string;
}

export const walletAuthApi = {
    /**
     * Get SIWE challenge message for wallet authentication
     */
    async getChallenge(
        address: string,
        chain: string,
        provider?: string,
    ): Promise<WalletChallengeResponse> {
        return apiRequest('/auth/wallet-connect/challenge', {
            method: 'POST',
            body: { address, chain, provider },
        });
    },

    /**
     * Verify wallet signature and authenticate
     */
    async verify(data: {
        address: string;
        chain: string;
        signature: string;
        message: string;
        nonce: string;
        provider?: string;
    }): Promise<WalletAuthResponse> {
        const response = await apiRequest<WalletAuthResponse>('/auth/wallet-connect/verify', {
            method: 'POST',
            body: data,
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Complete profile for wallet users (username + TOS)
     */
    async completeProfile(data: {
        username: string;
        fullName?: string;
        agreeToTerms: boolean;
        agreeToPrivacy: boolean;
    }): Promise<WalletAuthResponse> {
        const response = await apiRequest<WalletAuthResponse>('/auth/wallet-connect/complete-profile', {
            method: 'POST',
            body: data,
        });
        setAccessToken(response.tokens.accessToken, response.tokens.expiresIn);
        setRefreshToken(response.tokens.refreshToken);
        return response;
    },

    /**
     * Get all connected wallets for current user
     */
    async getConnectedWallets(): Promise<ConnectedWallet[]> {
        return apiRequest('/auth/wallet-connect/connected');
    },

    /**
     * Link additional wallet to current account
     */
    async linkWallet(data: {
        address: string;
        chain: string;
        signature: string;
        message: string;
        nonce: string;
        label?: string;
        isPrimary?: boolean;
        provider?: string;
    }): Promise<{ success: boolean; message: string }> {
        return apiRequest('/auth/wallet-connect/link', {
            method: 'POST',
            body: data,
        });
    },

    /**
     * Disconnect a wallet from current account
     */
    async disconnectWallet(address: string): Promise<{ success: boolean; message: string }> {
        return apiRequest(`/auth/wallet-connect/${encodeURIComponent(address)}`, {
            method: 'DELETE',
        });
    },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
    /**
     * Get dashboard overview
     */
    async getDashboard() {
        return apiRequest('/dashboard');
    },

    /**
     * Get user stats
     */
    async getStats() {
        return apiRequest('/dashboard/stats');
    },

    /**
     * Get recent activity
     */
    async getActivity() {
        return apiRequest('/dashboard/activity');
    },

    /**
     * Get portfolio
     */
    async getPortfolio() {
        return apiRequest('/dashboard/portfolio');
    },
};

// ============================================
// User API
// ============================================

export const userApi = {
    /**
     * Get current user profile
     */
    async getProfile() {
        return apiRequest('/users/me'); // Recommend using users/me if standardizing on users controller, but auth/me is also fine. logic is the same mostly.
        // Actually adhering to existing code calling auth/me. But I'll keep it as is or change to users/me?
        // Let's keep auth/me for getProfile as it is already used.
    },

    async updateProfile(data: { fullName?: string; bio?: string; preferences?: any }) {
        return apiRequest<{ id: string; full_name: string; bio: string }>('/users/profile', {
            method: 'PATCH',
            body: data,
        });
    },

    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        // Use raw fetch for FormData to avoid Content-Type header issues with apiRequest wrapper
        const token = getAccessToken();
        const response = await fetch(`${API_URL}/users/avatar`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }

        return response.json() as Promise<{ avatarUrl: string }>;
    },

    async addWallet(address: string, chain: string) {
        return apiRequest('/users/wallets', {
            method: 'POST',
            body: { address, chain },
        });
    },

    async removeWallet(address: string, chain: string) {
        return apiRequest(`/users/wallets/${address}`, {
            method: 'DELETE',
            body: { chain },
        });
    },

    async requestEmailVerification(email: string) {
        return apiRequest<{ message: string }>('/users/email/request-verification', {
            method: 'POST',
            body: { email }
        });
    },

    async verifyEmail(email: string, code: string) {
        return apiRequest<any>('/users/email/verify', {
            method: 'POST',
            body: { email, code }
        });
    },
};

// ============================================
// Deposit API
// ============================================

export const depositApi = {
    /**
     * Initiate withdrawal with optional Privy token for dual authentication
     * OWASP A07:2021 - Enhanced authentication
     */
    async initiateWithdrawal(amount: number, chain: string, toAddress: string, privyToken?: string) {
        const headers: Record<string, string> = {};
        if (privyToken) {
            headers['x-privy-token'] = privyToken;
        }
        return apiRequest<{ id: string }>('/deposits/withdraw', {
            method: 'POST',
            body: { amount, chain, toAddress },
            headers,
        });
    },

    /**
     * Confirm withdrawal with optional Privy token for dual authentication
     */
    async confirmWithdrawal(withdrawalId: string, txHash: string, privyToken?: string) {
        const headers: Record<string, string> = {};
        if (privyToken) {
            headers['x-privy-token'] = privyToken;
        }
        return apiRequest('/deposits/withdraw/confirm', {
            method: 'POST',
            body: { withdrawalId, txHash },
            headers,
        });
    },
};

// ============================================
// Notification API
// ============================================

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: any;
    action_url?: string;
}

export const notificationApi = {
    async getAll() {
        return apiRequest<Notification[]>('/notifications');
    },

    async getUnreadCount() {
        return apiRequest<{ count: number }>('/notifications/unread-count');
    },

    async markAsRead(id: string) {
        return apiRequest(`/notifications/${id}/read`, {
            method: 'PATCH',
        });
    },

    async markAllAsRead() {
        return apiRequest('/notifications/read-all', {
            method: 'PATCH',
        });
    },
};

export default {
    auth: authApi,
    dashboard: dashboardApi,
    user: userApi,
    deposit: depositApi,
    notifications: notificationApi,
    isAuthenticated,
    clearTokens,
};
