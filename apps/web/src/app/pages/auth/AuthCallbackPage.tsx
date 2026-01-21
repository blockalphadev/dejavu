import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../../../services/api';
import { useAuth } from '../../components/auth/AuthContext';

/**
 * AuthCallbackPage - Handles OAuth callback from backend
 * 
 * Receives tokens from URL params and stores them, then redirects appropriately.
 * If profile_pending is true, navigates to settings for profile completion.
 */
export function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Extract params from URL
                const accessToken = searchParams.get('access_token');
                const expiresIn = searchParams.get('expires_in');
                const profilePendingParam = searchParams.get('profile_pending');
                const errorMessage = searchParams.get('message');

                // Check for error
                if (errorMessage) {
                    setError(errorMessage);
                    return;
                }

                // Validate required params
                if (!accessToken || !expiresIn) {
                    setError('Invalid callback - missing authentication tokens');
                    return;
                }

                // Store access token
                const expiresInSeconds = parseInt(expiresIn, 10);
                setAccessToken(accessToken, expiresInSeconds);

                // Clear URL params for security
                window.history.replaceState({}, '', '/auth/callback');

                // Refresh user context
                await refreshUser();

                // Check if profile completion is needed
                if (profilePendingParam === 'true') {
                    // Navigate to settings with profile completion flag
                    navigate('/settings?complete_profile=true', { replace: true });
                    return;
                }

                // Redirect to home/dashboard after short delay
                setTimeout(() => {
                    navigate('/markets', { replace: true });
                }, 500);

            } catch (err) {
                console.error('[AuthCallback] Error processing callback:', err);
                setError('Failed to complete authentication');
            }
        };

        processCallback();
    }, [searchParams, navigate, refreshUser]);

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Failed</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Loading state with premium animation
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                {/* Animated Logo/Spinner */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    {/* Spinning ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Completing Sign In...
                </h2>
                <p className="text-muted-foreground text-sm">
                    Please wait while we set up your account
                </p>

                {/* Progress dots animation */}
                <div className="flex justify-center gap-1.5 mt-6">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
}

export default AuthCallbackPage;
