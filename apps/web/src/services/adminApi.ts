import { apiRequest } from './api';

// Types mimicking the SQL schema
export interface DashboardStats {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    totalTvl: number;
    totalVolume: number;
    activeMarkets: number;
    pendingWithdrawals: number;
    pendingWithdrawalVolume: number;
    openAlerts: number;
    pendingSecurityReviews: number;
}

export interface AdminUser {
    id: string;
    email: string;
    fullName: string;
    status: string;
    balance: number;
    lockedBalance: number;
    riskScore: number;
    totalDeposits: number;
    totalWithdrawals: number;
    lastLoginAt: string;
    createdAt: string;
}

export interface WithdrawalRequest {
    id: string;
    withdrawalId: string;
    userId: string;
    userEmail: string;
    amount: number;
    currency: string;
    chain: string;
    toAddress: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';
    riskScore: number;
    riskFactors: string[];
    requiresSecondApproval: boolean;
    createdAt: string;
    expiresAt: string;
}

export interface SystemAlert {
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    createdAt: string;
}

export interface SuspiciousActivity {
    id: string;
    actorUserId: string;
    actorEmail?: string;
    action: string;
    actionCategory: string;
    resourceType?: string;
    resourceId?: string;
    status: string;
    ipAddress?: string;
    createdAt: string;
    // Extended properties for UI display
    type?: string;
    description?: string;
    userId?: string;
    riskScore?: number;
}

export interface AdminAuditLogQuery {
    actorId?: string;
    action?: string;
    category?: string;
    page?: number;
    limit?: number;
}

export const adminApi = {
    // Check if current user is admin
    async checkIsAdmin(): Promise<boolean> {
        try {
            await apiRequest('/admin/stats');
            return true;
        } catch (error) {
            return false;
        }
    },

    async getStats(): Promise<DashboardStats> {
        return apiRequest<DashboardStats>('/admin/stats');
    },

    async getUsers(search?: string, page = 1, limit = 20): Promise<{ data: AdminUser[], total: number }> {
        // Construct query parameters manually since apiRequest doesn't support params object directly in this version
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append('search', search);

        return apiRequest<{ data: AdminUser[], total: number }>(`/admin/users?${params.toString()}`);
    },

    async getUserDetail(id: string): Promise<any> {
        return apiRequest(`/admin/users/${id}`);
    },

    async updateUserStatus(id: string, status: string, reason?: string): Promise<void> {
        return apiRequest(`/admin/users/${id}/status`, {
            method: 'PATCH',
            body: { status, reason }
        });
    },

    async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
        return apiRequest<WithdrawalRequest[]>('/admin/withdrawals/pending');
    },

    async approveWithdrawal(id: string, notes?: string): Promise<boolean> {
        await apiRequest(`/admin/withdrawals/${id}/approve`, {
            method: 'POST',
            body: { notes }
        });
        return true;
    },

    async rejectWithdrawal(id: string, reason: string): Promise<boolean> {
        await apiRequest(`/admin/withdrawals/${id}/reject`, {
            method: 'POST',
            body: { reason }
        });
        return true;
    },

    async getSystemAlerts(status?: string): Promise<SystemAlert[]> {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return apiRequest<SystemAlert[]>(`/admin/alerts${queryString}`);
    },

    async updateAlertStatus(id: string, status: string, notes?: string): Promise<void> {
        return apiRequest(`/admin/alerts/${id}`, {
            method: 'PATCH',
            body: { status, notes }
        });
    },

    async getAuditLog(query: AdminAuditLogQuery): Promise<{ data: SuspiciousActivity[], total: number }> {
        const params = new URLSearchParams();
        if (query.actorId) params.append('actorId', query.actorId);
        if (query.action) params.append('action', query.action);
        if (query.category) params.append('category', query.category);
        if (query.page) params.append('page', query.page.toString());
        if (query.limit) params.append('limit', query.limit.toString());

        return apiRequest<{ data: SuspiciousActivity[], total: number }>(`/admin/audit-log?${params.toString()}`);
    },

    async getSuspiciousActivity(): Promise<SuspiciousActivity[]> {
        const result = await this.getAuditLog({ category: 'security', limit: 50 });
        return result.data.map(item => ({
            ...item,
            type: item.action,
            description: `${item.action} from ${item.ipAddress || 'unknown IP'}`,
            userId: item.actorUserId,
            riskScore: item.status === 'flagged' ? 85 : 50
        }));
    }
};
