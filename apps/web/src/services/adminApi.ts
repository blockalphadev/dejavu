import { getAccessToken } from './api';

// Types mimicking the SQL schema
export interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    totalTvl: number;
    totalVolume: number;
    activeMarkets: number;
    pendingWithdrawals: number;
    openAlerts: number;
}

export interface AdminUser {
    id: string;
    email: string;
    fullName: string;
    role: 'user' | 'admin' | 'super_admin' | 'moderator';
    status: 'active' | 'suspended';
    balance_usdc: number;
    locked_usdc: number;
    lastLogin: string;
    riskScore: number;
    createdAt: string;
}

export interface WithdrawalRequest {
    id: string;
    userId: string;
    userEmail: string;
    amount: number;
    currency: string;
    chain: string;
    toAddress: string;
    status: 'pending' | 'approved' | 'rejected';
    riskScore: number;
    createdAt: string;
}

export interface SystemAlert {
    id: string;
    type: 'high_withdrawal' | 'suspicious_activity' | 'system_error' | 'security_breach';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    status: 'open' | 'resolved';
    createdAt: string;
}

export interface SuspiciousActivity {
    id: string;
    userId: string;
    userEmail?: string;
    type: string;
    description: string;
    riskScore: number;
    ipAddress: string;
    status: 'pending' | 'resolved';
    createdAt: string;
}

// Mock Data
const MOCK_STATS: DashboardStats = {
    totalUsers: 12450,
    newUsersToday: 45,
    newUsersWeek: 320,
    totalTvl: 4500000,
    totalVolume: 12500000,
    activeMarkets: 84,
    pendingWithdrawals: 12,
    openAlerts: 3,
};

const MOCK_USERS: AdminUser[] = [
    {
        id: 'u1',
        email: 'alice@example.com',
        fullName: 'Alice Wonderland',
        role: 'user',
        status: 'active',
        balance_usdc: 15420.50,
        locked_usdc: 2000.00,
        lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        riskScore: 12,
        createdAt: '2025-11-15T10:00:00Z',
    },
    {
        id: 'u2',
        email: 'bob@builder.com',
        fullName: 'Bob Builder',
        role: 'user',
        status: 'active',
        balance_usdc: 500.00,
        locked_usdc: 0,
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        riskScore: 5,
        createdAt: '2025-12-01T14:30:00Z',
    },
    {
        id: 'u3',
        email: 'charlie@hacker.net',
        fullName: 'Charlie Black',
        role: 'user',
        status: 'suspended',
        balance_usdc: 100000.00,
        locked_usdc: 100000.00,
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        riskScore: 95,
        createdAt: '2026-01-05T09:15:00Z',
    },
    {
        id: 'u4',
        email: 'admin@dejavu.pro',
        fullName: 'Super Admin',
        role: 'super_admin',
        status: 'active',
        balance_usdc: 0,
        locked_usdc: 0,
        lastLogin: new Date().toISOString(),
        riskScore: 0,
        createdAt: '2025-10-01T00:00:00Z',
    },
];

const MOCK_WITHDRAWALS: WithdrawalRequest[] = [
    {
        id: 'w1',
        userId: 'u1',
        userEmail: 'alice@example.com',
        amount: 5000,
        currency: 'USDC',
        chain: 'Ethereum',
        toAddress: '0x123...abc',
        status: 'pending',
        riskScore: 15,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: 'w2',
        userId: 'u3',
        userEmail: 'charlie@hacker.net',
        amount: 50000,
        currency: 'USDC',
        chain: 'Solana',
        toAddress: 'So111...111',
        status: 'pending',
        riskScore: 95,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
];

const MOCK_ALERTS: SystemAlert[] = [
    {
        id: 'a1',
        type: 'high_withdrawal',
        severity: 'warning',
        title: 'High Value Withdrawal',
        description: 'User Charlie requested withdrawal of 50,000 USDC',
        status: 'open',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
        id: 'a2',
        type: 'suspicious_activity',
        severity: 'critical',
        title: 'Multiple Failed Logins',
        description: 'IP 192.168.1.55 failed login 20 times in 1 minute',
        status: 'open',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
        id: 'a3',
        type: 'system_error',
        severity: 'error',
        title: 'RPC Node Latency',
        description: 'Solana RPC latency > 2000ms',
        status: 'resolved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
];

const MOCK_ACTIVITY: SuspiciousActivity[] = [
    {
        id: 'sa1',
        userId: 'u3',
        userEmail: 'charlie@hacker.net',
        type: 'velocity_exceeded',
        description: 'Withdrawal velocity limit exceeded',
        riskScore: 85,
        ipAddress: '10.0.0.1',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    }
];

export const adminApi = {
    // Check if current user is admin (mock)
    async checkIsAdmin(): Promise<boolean> {
        // In real app, check role from token or profile table
        return true;
    },

    async getStats(): Promise<DashboardStats> {
        await new Promise(r => setTimeout(r, 600)); // Simulate lag
        return MOCK_STATS;
    },

    async getUsers(search?: string): Promise<AdminUser[]> {
        await new Promise(r => setTimeout(r, 500));
        if (!search) return MOCK_USERS;
        const lowerSearch = search.toLowerCase();
        return MOCK_USERS.filter(u =>
            u.email.toLowerCase().includes(lowerSearch) ||
            u.fullName.toLowerCase().includes(lowerSearch) ||
            u.id.includes(lowerSearch)
        );
    },

    async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
        await new Promise(r => setTimeout(r, 500));
        return MOCK_WITHDRAWALS;
    },

    async getSystemAlerts(): Promise<SystemAlert[]> {
        await new Promise(r => setTimeout(r, 500));
        return MOCK_ALERTS;
    },

    async getSuspiciousActivity(): Promise<SuspiciousActivity[]> {
        await new Promise(r => setTimeout(r, 500));
        return MOCK_ACTIVITY;
    },

    async approveWithdrawal(id: string, notes?: string): Promise<boolean> {
        await new Promise(r => setTimeout(r, 800));
        const index = MOCK_WITHDRAWALS.findIndex(w => w.id === id);
        if (index !== -1) {
            MOCK_WITHDRAWALS.splice(index, 1);
            return true;
        }
        return false;
    },

    async rejectWithdrawal(id: string, reason: string): Promise<boolean> {
        await new Promise(r => setTimeout(r, 800));
        const index = MOCK_WITHDRAWALS.findIndex(w => w.id === id);
        if (index !== -1) {
            MOCK_WITHDRAWALS.splice(index, 1);
            return true;
        }
        return false;
    }
};
