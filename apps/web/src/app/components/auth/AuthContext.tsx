import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, getAccessToken } from '../../../services/api';

// Types
export interface User {
    id: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    walletAddresses?: Array<{ address: string; chain: string }>;
    /** If user logged in via wallet only */
    isWalletUser?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, fullName?: string) => Promise<void>;
    loginWithWallet: (address: string, chain: string) => void;
    logout: () => Promise<void>;
    clearError: () => void;
    refreshUser: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider - Manages global authentication state
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = user !== null;

    /**
     * Fetch current user from API
     */
    const refreshUser = useCallback(async () => {
        // Check if we have any auth credentials before making API call
        const token = getAccessToken();
        const hasRefreshToken = !!localStorage.getItem('dejavu_refresh_token');

        console.log('[AuthContext] refreshUser called', { hasToken: !!token, hasRefreshToken });

        if (!token && !hasRefreshToken) {
            // No credentials at all, user is definitely logged out
            console.log('[AuthContext] No credentials found, setting user to null');
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log('[AuthContext] Fetching user data from /auth/me...');
            const userData = await authApi.me() as User;
            console.log('[AuthContext] User data received:', {
                id: userData?.id,
                email: userData?.email,
                fullName: userData?.fullName,
                hasWalletAddresses: !!userData?.walletAddresses,
            });
            setUser(userData);
            console.log('[AuthContext] User state updated successfully');
        } catch (error) {
            console.error('[AuthContext] Failed to refresh user:', error);
            // Only clear user if we actually lost the token (e.g. 401 handled by api.ts)
            if (!getAccessToken()) {
                console.log('[AuthContext] No access token found after error, clearing user');
                setUser(null);
            }
            // Otherwise, keep the stale user data rather than logging out on a 500/Network error
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Initialize auth state on mount
     */
    useEffect(() => {
        // Check for wallet user first
        const savedWalletUser = localStorage.getItem('dejavu_wallet_user');
        if (savedWalletUser) {
            try {
                const walletUser = JSON.parse(savedWalletUser) as User;
                console.log('[AuthContext] Restored wallet user:', walletUser);
                setUser(walletUser);
                setIsLoading(false);
                return;
            } catch (e) {
                console.error('[AuthContext] Failed to parse saved wallet user:', e);
                localStorage.removeItem('dejavu_wallet_user');
            }
        }
        
        // Otherwise try API auth
        refreshUser();
    }, [refreshUser]);

    /**
     * Login with email and password
     */
    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.login(email, password);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Signup with email and password
     */
    const signup = useCallback(async (email: string, password: string, fullName?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.signup(email, password, fullName);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Signup failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Login with wallet address (for Sui/Slush wallet)
     * Creates a temporary user session based on wallet address
     */
    const loginWithWallet = useCallback((address: string, chain: string) => {
        console.log('[AuthContext] Logging in with wallet:', { address, chain });
        
        // Create a wallet-based user
        const walletUser: User = {
            id: `wallet_${address.slice(0, 8)}`,
            fullName: `${address.slice(0, 6)}...${address.slice(-4)}`,
            walletAddresses: [{ address, chain }],
            isWalletUser: true,
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('dejavu_wallet_user', JSON.stringify(walletUser));
        
        setUser(walletUser);
        setError(null);
    }, []);

    /**
     * Logout and clear tokens
     */
    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            // Clear wallet user from localStorage
            localStorage.removeItem('dejavu_wallet_user');
            await authApi.logout();
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    /**
     * Clear error message
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        signup,
        loginWithWallet,
        logout,
        clearError,
        refreshUser,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
