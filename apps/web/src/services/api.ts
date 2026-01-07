/**
 * DeJaVu API Client
 * Handles all communication with the backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
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
export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = getAccessToken();
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Debug logging
    if (endpoint.includes('/admin/')) {
        console.log(`[API DEBUG] ${method} ${endpoint} - Token present: ${!!token}, Token length: ${token?.length || 0}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // For cookies
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));

        // Debug logging for errors
        if (endpoint.includes('/admin/')) {
            console.log(`[API DEBUG] ${method} ${endpoint} - FAILED ${response.status}: ${error.message}`);
        }

        // Handle token expiration
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry request with new token
                console.log(`[API DEBUG] Token refreshed, retrying ${endpoint}`);
                return apiRequest(endpoint, options);
            }
            clearTokens();
            throw new Error('Session expired. Please log in again.');
        }

        throw new Error(error.message || 'Request failed');
    }

    return response.json();
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
        return apiRequest('/auth/me');
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
};

// ============================================
// Deposit API
// ============================================

export const depositApi = {
    /**
     * Initiate withdrawal
     */
    async initiateWithdrawal(amount: number, chain: string, toAddress: string) {
        return apiRequest<{ id: string }>('/deposits/withdraw', {
            method: 'POST',
            body: { amount, chain, toAddress },
        });
    },

    /**
     * Confirm withdrawal
     */
    async confirmWithdrawal(withdrawalId: string, txHash: string) {
        return apiRequest('/deposits/withdraw/confirm', {
            method: 'POST',
            body: { withdrawalId, txHash },
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
