import { getAccessToken } from './api';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1';

/**
 * Deposit chain types
 */
export type DepositChain = 'ethereum' | 'solana' | 'sui' | 'base';

/**
 * Deposit status types
 */
export type DepositStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

/**
 * Balance response from API
 */
export interface BalanceResponse {
    balance: string;
    lockedBalance: string;
    availableBalance: string;
    currency: string;
}

/**
 * Wallet response from API
 */
export interface WalletResponse {
    address: string;
    chain: string;
    walletType: string;
    createdAt: string;
}

/**
 * Initiate deposit response
 */
export interface InitiateDepositResponse {
    nonce: string;
    depositAddress: string;
    expiresInSeconds: number;
    amount: string;
    chain: string;
}

/**
 * Deposit transaction
 */
export interface DepositTransaction {
    id: string;
    amount: string;
    currency: string;
    chain: string;
    txHash: string | null;
    status: DepositStatus;
    createdAt: string;
    confirmedAt: string | null;
}

/**
 * Deposit history response
 */
export interface DepositHistoryResponse {
    data: DepositTransaction[];
    total: number;
}

/**
 * Helper to make authenticated requests
 */
async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Deposit API Service
 */
export const depositApi = {
    /**
     * Get user's current balance
     */
    async getBalance(): Promise<BalanceResponse> {
        return authFetch<BalanceResponse>('/deposits/balance');
    },

    /**
     * Generate or get wallet address for a chain
     */
    async generateWallet(chain: DepositChain, privyUserId: string): Promise<WalletResponse> {
        return authFetch<WalletResponse>('/deposits/wallet/generate', {
            method: 'POST',
            body: JSON.stringify({ chain, privyUserId }),
        });
    },

    /**
     * Get wallet for a specific chain
     */
    async getWallet(chain: DepositChain): Promise<WalletResponse | null> {
        try {
            return await authFetch<WalletResponse>(`/deposits/wallet/${chain}`);
        } catch {
            return null;
        }
    },

    /**
     * Initiate a new deposit
     */
    async initiateDeposit(amount: number, chain: DepositChain): Promise<InitiateDepositResponse> {
        return authFetch<InitiateDepositResponse>('/deposits/initiate', {
            method: 'POST',
            body: JSON.stringify({ amount, chain }),
        });
    },

    /**
     * Verify/confirm a deposit with transaction hash
     */
    async verifyDeposit(nonce: string, txHash: string, privyToken?: string): Promise<DepositTransaction> {
        return authFetch<DepositTransaction>('/deposits/verify', {
            method: 'POST',
            body: JSON.stringify({ nonce, txHash, privyToken }),
        });
    },

    /**
     * Get deposit history
     */
    async getHistory(params?: {
        page?: number;
        limit?: number;
        status?: DepositStatus;
        chain?: DepositChain;
    }): Promise<DepositHistoryResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.status) queryParams.set('status', params.status);
        if (params?.chain) queryParams.set('chain', params.chain);

        const query = queryParams.toString();
        return authFetch<DepositHistoryResponse>(`/deposits/history${query ? `?${query}` : ''}`);
    },
};

export default depositApi;

