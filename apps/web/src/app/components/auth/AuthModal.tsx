import { useState, useEffect, useRef } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { AuthIcons } from './AuthIcons';
import { SocialButton } from './SocialButton';
import { WalletOption } from './WalletOption';
import { EmailForm } from './EmailForm';
import { useSuiWallet, shortenAddress } from '../../hooks/useSuiWallet';
import { useAuth, User } from './AuthContext';
import { useCurrentWallet, useCurrentAccount } from '../../contexts/SuiWalletContext';
import { authApi, getAccessToken } from '../../../services/api';
import bs58 from 'bs58';

// MetaMask, Coinbase Wallet, and Phantom type definitions
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            isMetaMask?: boolean;
            isCoinbaseWallet?: boolean;
            on?: (event: string, handler: (...args: any[]) => void) => void;
            removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        } | Array<{
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            isMetaMask?: boolean;
            isCoinbaseWallet?: boolean;
            on?: (event: string, handler: (...args: any[]) => void) => void;
            removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        }>;
        coinbaseWalletExtension?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on?: (event: string, handler: (...args: any[]) => void) => void;
            removeListener?: (event: string, handler: (...args: any[]) => void) => void;
        };
        solana?: {
            isPhantom?: boolean;
            connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
            disconnect: () => Promise<void>;
            signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
            on: (event: string, handler: (...args: any[]) => void) => void;
            removeListener?: (event: string, handler: (...args: any[]) => void) => void;
            publicKey?: { toString: () => string };
        };
    }
}

/**
 * Get MetaMask provider, handling multiple wallet extensions
 */
function getMetaMaskProvider() {
    if (typeof window === 'undefined') return null;
    
    // Check if window.ethereum exists
    if (!window.ethereum) return null;
    
    const ethereum = window.ethereum as any;
    
    // If window.ethereum is an array (multiple providers), find MetaMask
    if (Array.isArray(ethereum)) {
        return ethereum.find((provider: any) => provider.isMetaMask) || ethereum[0];
    }
    
    // If it's explicitly MetaMask, use it
    if (ethereum.isMetaMask) {
        return ethereum;
    }
    
    // Otherwise, try to use it (might be MetaMask or another wallet)
    return ethereum;
}

/**
 * Get Coinbase Wallet provider
 */
function getCoinbaseProvider() {
    if (typeof window === 'undefined') return null;
    
    // Coinbase Wallet can be detected via window.ethereum or window.coinbaseWalletExtension
    if (window.ethereum) {
        // Check if it's Coinbase Wallet
        if ((window.ethereum as any).isCoinbaseWallet) {
            return window.ethereum;
        }
        
        // If window.ethereum is an array, find Coinbase
        if (Array.isArray(window.ethereum)) {
            return window.ethereum.find((provider: any) => provider.isCoinbaseWallet) || null;
        }
    }
    
    // Try coinbaseWalletExtension (for mobile)
    if ((window as any).coinbaseWalletExtension) {
        return (window as any).coinbaseWalletExtension;
    }
    
    return null;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

type AuthView = 'MAIN' | 'EMAIL' | 'WALLET_CONNECTING' | 'WALLET_SELECT_ACCOUNT';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const [view, setView] = useState<AuthView>('MAIN');
    const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);

    // Auth context
    const { refreshUser, setUser } = useAuth();
    
    // Track if we've already logged in to prevent duplicate calls
    const hasLoggedIn = useRef(false);

    // Sui wallet hook
    const {
        isConnected: isSuiConnected,
        connectSlush,
        availableWallets,
        error: suiError,
        address: suiAddress,
    } = useSuiWallet();
    
    // Current wallet for signing
    const { currentWallet } = useCurrentWallet();
    const currentAccount = useCurrentAccount();

    // MetaMask state
    const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
    const [metaMaskError, setMetaMaskError] = useState<string | null>(null);
    const [isMetaMaskConnecting, setIsMetaMaskConnecting] = useState(false);

    // Phantom state
    const [phantomAddress, setPhantomAddress] = useState<string | null>(null);
    const [phantomError, setPhantomError] = useState<string | null>(null);
    const [isPhantomConnecting, setIsPhantomConnecting] = useState(false);

    // Coinbase Wallet state
    const [coinbaseAddress, setCoinbaseAddress] = useState<string | null>(null);
    const [coinbaseError, setCoinbaseError] = useState<string | null>(null);
    const [isCoinbaseConnecting, setIsCoinbaseConnecting] = useState(false);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('MAIN');
                setConnectingWallet(null);
                hasLoggedIn.current = false;
                setMetaMaskAddress(null);
                setMetaMaskError(null);
                setIsMetaMaskConnecting(false);
                setPhantomAddress(null);
                setPhantomError(null);
                setIsPhantomConnecting(false);
                setCoinbaseAddress(null);
                setCoinbaseError(null);
                setIsCoinbaseConnecting(false);
            }, 300); // Wait for exit animation
        }
    }, [isOpen]);

    // Handle successful Sui wallet connection - login and close modal
    useEffect(() => {
        // Early return if conditions not met
        if (
            !isSuiConnected || 
            !suiAddress || 
            connectingWallet !== 'Slush' || 
            view !== 'WALLET_CONNECTING' ||
            hasLoggedIn.current
        ) {
            return;
        }

        console.log('[AuthModal] Wallet connected, starting authentication flow:', suiAddress);
        hasLoggedIn.current = true;
        
        let isCancelled = false;
        
        // Small delay to let user see connection success, then proceed to signing
        // This prevents double approval popup confusion
        const authenticateWallet = async () => {
            // Wait a bit before signing to avoid immediate popup after connect
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Check if cancelled (component unmounted or modal closed)
            if (isCancelled || !hasLoggedIn.current) {
                console.log('[AuthModal] Authentication cancelled or already completed');
                return;
            }
            
            try {
                if (!currentWallet) {
                    throw new Error('No wallet available');
                }
                
                // 1. Get challenge from backend
                const challenge = await authApi.getWalletChallenge(suiAddress, 'sui');
                
                // Check again after async call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 2. Sign message with wallet
                if (!currentAccount) {
                    throw new Error('No account available');
                }
                
                const signFeature = currentWallet.features['sui:signPersonalMessage'];
                if (!signFeature || typeof signFeature.signPersonalMessage !== 'function') {
                    throw new Error('Wallet does not support message signing');
                }
                
                const signResult = await signFeature.signPersonalMessage({
                    message: new TextEncoder().encode(challenge.message),
                    account: currentAccount,
                });
                
                console.log('[AuthModal] Full signature result:', signResult);
                console.log('[AuthModal] Signature result:', {
                    signatureType: typeof signResult.signature,
                    signatureLength: typeof signResult.signature === 'string' ? signResult.signature.length : 'N/A',
                    signaturePreview: typeof signResult.signature === 'string' 
                        ? signResult.signature.substring(0, 100) + '...' 
                        : 'Not a string',
                    hasBytes: 'bytes' in signResult,
                    bytesLength: 'bytes' in signResult && signResult.bytes ? signResult.bytes.length : 'N/A'
                });
                
                // Convert signature to base64 format expected by backend
                // Sui wallet returns: { signature: string, bytes: string (message) }
                // - signature: the actual signature (base64)
                // - bytes: the message that was signed (base64)
                let signatureBase64: string;
                
                // Use signature field (the actual signature)
                const sig = signResult.signature;
                
                if (typeof sig === 'string') {
                    // Sui signature is typically base64 encoded
                    // If it's a hex string (starts with 0x), convert to base64
                    if (sig.startsWith('0x')) {
                        const hex = sig.slice(2);
                        signatureBase64 = Buffer.from(hex, 'hex').toString('base64');
                    } else {
                        // Assume it's already base64 (Sui wallet returns base64)
                        signatureBase64 = sig;
                    }
                } else if (sig && typeof sig === 'object' && 'length' in sig) {
                    // Uint8Array or similar - convert to number array first
                    const bytes = Array.from(sig as ArrayLike<number>);
                    signatureBase64 = Buffer.from(bytes).toString('base64');
                } else {
                    throw new Error('Invalid signature format from wallet');
                }
                
                console.log('[AuthModal] Final signature to send:', {
                    length: signatureBase64.length,
                    preview: signatureBase64.substring(0, 100) + '...'
                });
                
                // Check again before API call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 3. Verify with backend (this will save external wallet and generate Privy wallet)
                const authResponse = await authApi.verifyWallet(
                    suiAddress,
                    'sui',
                    signatureBase64,
                    challenge.message
                );
                
                console.log('[AuthModal] Auth response received:', {
                    hasUser: !!authResponse.user,
                    userId: authResponse.user?.id,
                    email: authResponse.user?.email,
                    fullName: authResponse.user?.fullName,
                    hasTokens: !!authResponse.tokens,
                });
                
                // Final check before updating state
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 4. Update auth context - use user data from response directly (like login/signup do)
                // Then refresh to get complete profile data including wallet addresses
                console.log('[AuthModal] Setting user from response and refreshing...');
                
                // First, try to refresh user to get complete data
                // Add small delay to ensure token is fully saved in localStorage
                await new Promise(resolve => setTimeout(resolve, 100));
                
                try {
                    await refreshUser();
                    console.log('[AuthModal] User refreshed successfully');
                } catch (refreshError) {
                    console.error('[AuthModal] Failed to refresh user, but tokens are saved:', refreshError);
                    // Even if refresh fails, tokens are saved, so user will be logged in on next page load
                    // The refreshUser will be called again when component mounts
                }
                
                // Small delay to show success state, then close
                setTimeout(() => {
                    if (!isCancelled) {
                        onClose();
                    }
                }, 800);
            } catch (err) {
                console.error('[AuthModal] Authentication failed:', err);
                hasLoggedIn.current = false; // Reset on error to allow retry
                // Show error and allow retry
            }
        };
        
        authenticateWallet();
        
        // Cleanup function to cancel if component unmounts or dependencies change
        return () => {
            isCancelled = true;
        };
    }, [isSuiConnected, suiAddress, connectingWallet, view, refreshUser, currentWallet, currentAccount, onClose]);

    // Handle Sui connection error
    useEffect(() => {
        if (suiError && connectingWallet === 'Slush') {
            // Go back to main view on error
            setTimeout(() => {
                setView('MAIN');
                setConnectingWallet(null);
            }, 2000);
        }
    }, [suiError, connectingWallet]);

    // Handle MetaMask authentication flow
    useEffect(() => {
        console.log('[AuthModal] MetaMask auth useEffect triggered:', {
            metaMaskAddress,
            connectingWallet,
            view,
            hasLoggedIn: hasLoggedIn.current,
        });
        
        // Early return if conditions not met
        if (
            !metaMaskAddress ||
            connectingWallet !== 'Metamask' ||
            view !== 'WALLET_CONNECTING' ||
            hasLoggedIn.current
        ) {
            console.log('[AuthModal] MetaMask auth useEffect early return');
            return;
        }

        console.log('[AuthModal] MetaMask connected, starting authentication flow:', metaMaskAddress);
        hasLoggedIn.current = true;
        setIsMetaMaskConnecting(true); // Set to true to show we're authenticating
        
        let isCancelled = false;
        
        const authenticateMetaMask = async () => {
            // Wait a bit before signing to avoid immediate popup after connect
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Check if cancelled
            if (isCancelled || !hasLoggedIn.current) {
                console.log('[AuthModal] MetaMask authentication cancelled');
                return;
            }
            
            try {
                // 1. Get challenge from backend
                const challenge = await authApi.getWalletChallenge(metaMaskAddress, 'ethereum');
                
                // Check again after async call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 2. Sign message with MetaMask
                const provider = getMetaMaskProvider();
                if (!provider) {
                    throw new Error('MetaMask not available');
                }
                
                const signature = await provider.request({
                    method: 'personal_sign',
                    params: [challenge.message, metaMaskAddress],
                }) as string;
                
                console.log('[AuthModal] MetaMask signature received');
                
                // Check again before API call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 3. Verify with backend (this will save external wallet and generate Privy wallet)
                const authResponse = await authApi.verifyWallet(
                    metaMaskAddress,
                    'ethereum',
                    signature as string,
                    challenge.message
                );
                
                console.log('[AuthModal] MetaMask auth response received:', {
                    hasUser: !!authResponse.user,
                    userId: authResponse.user?.id,
                    hasTokens: !!authResponse.tokens,
                });
                
                // Final check before updating state
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 4. Update auth context
                console.log('[AuthModal] Setting user from auth response...');
                
                // Set user immediately from response to show logged in state
                if (authResponse.user) {
                    console.log('[AuthModal] Setting user directly from auth response:', {
                        id: authResponse.user.id,
                        email: authResponse.user.email,
                        fullName: authResponse.user.fullName,
                    });
                    setUser(authResponse.user as User);
                }
                
                // Wait a bit for tokens to be fully saved to localStorage
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verify tokens are saved
                const tokenCheck = getAccessToken();
                console.log('[AuthModal] Token check after save:', { hasToken: !!tokenCheck });
                
                // Refresh user from API to get complete user data (with wallet addresses, etc.)
                try {
                    console.log('[AuthModal] Calling refreshUser to get complete user data...');
                    await refreshUser();
                    console.log('[AuthModal] User refreshed successfully from API');
                } catch (refreshError) {
                    console.error('[AuthModal] Failed to refresh user from API:', refreshError);
                    // User is already set from authResponse, so UI should show logged in state
                    console.log('[AuthModal] User state maintained from auth response');
                }
                
                // Small delay to show success state, then close
                setTimeout(() => {
                    if (!isCancelled) {
                        onClose();
                    }
                }, 800);
            } catch (err) {
                console.error('[AuthModal] MetaMask authentication failed:', err);
                hasLoggedIn.current = false; // Reset on error to allow retry
                setIsMetaMaskConnecting(false);
                setMetaMaskError(err instanceof Error ? err.message : 'Authentication failed');
                
                // Show error and allow retry
                setTimeout(() => {
                    if (!isCancelled) {
                        setView('MAIN');
                        setConnectingWallet(null);
                        setMetaMaskAddress(null);
                    }
                }, 3000);
            }
        };
        
        authenticateMetaMask();
        
        // Cleanup function
        return () => {
            isCancelled = true;
        };
    }, [metaMaskAddress, connectingWallet, view, refreshUser, onClose, setUser]);

    // Handle Phantom authentication flow
    useEffect(() => {
        console.log('[AuthModal] Phantom auth useEffect triggered:', {
            phantomAddress,
            connectingWallet,
            view,
            hasLoggedIn: hasLoggedIn.current,
        });
        
        // Early return if conditions not met
        if (
            !phantomAddress ||
            connectingWallet !== 'Phantom' ||
            view !== 'WALLET_CONNECTING' ||
            hasLoggedIn.current
        ) {
            console.log('[AuthModal] Phantom auth useEffect early return');
            return;
        }

        console.log('[AuthModal] Phantom connected, starting authentication flow:', phantomAddress);
        hasLoggedIn.current = true;
        setIsPhantomConnecting(true); // Set to true to show we're authenticating
        
        let isCancelled = false;
        
        const authenticatePhantom = async () => {
            // Wait a bit before signing to avoid immediate popup after connect
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Check if cancelled
            if (isCancelled || !hasLoggedIn.current) {
                console.log('[AuthModal] Phantom authentication cancelled');
                return;
            }
            
            try {
                // 1. Get challenge from backend
                const challenge = await authApi.getWalletChallenge(phantomAddress, 'solana');
                
                // Check again after async call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 2. Sign message with Phantom
                const provider = window.solana;
                if (!provider || !provider.isPhantom) {
                    throw new Error('Phantom wallet not available');
                }
                
                // Encode message to Uint8Array
                const encodedMessage = new TextEncoder().encode(challenge.message);
                
                // Sign message with Phantom
                const signedMessage = await provider.signMessage(encodedMessage, 'utf8');
                
                // Convert signature to base58 (Solana standard format)
                // Phantom returns signature as Uint8Array
                // Backend expects base58 encoded signature for Solana
                const signatureBase58 = bs58.encode(signedMessage.signature);
                
                console.log('[AuthModal] Phantom signature received');
                
                // Check again before API call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 3. Verify with backend (this will save external wallet and generate Privy wallet)
                const authResponse = await authApi.verifyWallet(
                    phantomAddress,
                    'solana',
                    signatureBase58,
                    challenge.message
                );
                
                console.log('[AuthModal] Phantom auth response received:', {
                    hasUser: !!authResponse.user,
                    userId: authResponse.user?.id,
                    hasTokens: !!authResponse.tokens,
                });
                
                // Final check before updating state
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 4. Update auth context
                console.log('[AuthModal] Setting user from auth response...');
                
                // Set user immediately from response to show logged in state
                if (authResponse.user) {
                    console.log('[AuthModal] Setting user directly from auth response:', {
                        id: authResponse.user.id,
                        email: authResponse.user.email,
                        fullName: authResponse.user.fullName,
                    });
                    setUser(authResponse.user as User);
                }
                
                // Wait a bit for tokens to be fully saved to localStorage
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verify tokens are saved
                const tokenCheck = getAccessToken();
                console.log('[AuthModal] Token check after save:', { hasToken: !!tokenCheck });
                
                // Refresh user from API to get complete user data (with wallet addresses, etc.)
                try {
                    console.log('[AuthModal] Calling refreshUser to get complete user data...');
                    await refreshUser();
                    console.log('[AuthModal] User refreshed successfully from API');
                } catch (refreshError) {
                    console.error('[AuthModal] Failed to refresh user from API:', refreshError);
                    // User is already set from authResponse, so UI should show logged in state
                    console.log('[AuthModal] User state maintained from auth response');
                }
                
                // Small delay to show success state, then close
                setTimeout(() => {
                    if (!isCancelled) {
                        onClose();
                    }
                }, 800);
            } catch (err) {
                console.error('[AuthModal] Phantom authentication failed:', err);
                hasLoggedIn.current = false; // Reset on error to allow retry
                setIsPhantomConnecting(false);
                setPhantomError(err instanceof Error ? err.message : 'Authentication failed');
                
                // Show error and allow retry
                setTimeout(() => {
                    if (!isCancelled) {
                        setView('MAIN');
                        setConnectingWallet(null);
                        setPhantomAddress(null);
                    }
                }, 3000);
            }
        };
        
        authenticatePhantom();
        
        // Cleanup function
        return () => {
            isCancelled = true;
        };
    }, [phantomAddress, connectingWallet, view, refreshUser, onClose, setUser]);

    // Listen for Phantom wallet account changes and disconnect
    useEffect(() => {
        const provider = window.solana;
        if (!provider || !provider.isPhantom) {
            return;
        }

        const handleAccountChange = (publicKey: { toString: () => string } | null) => {
            if (publicKey) {
                const newAddress = publicKey.toString();
                console.log('[AuthModal] Phantom account changed:', newAddress);
                // If user switches account while connected, update address
                if (phantomAddress && phantomAddress !== newAddress) {
                    setPhantomAddress(newAddress);
                    // Optionally: show notification or prompt re-authentication
                }
            } else {
                console.log('[AuthModal] Phantom disconnected');
                setPhantomAddress(null);
                setPhantomError(null);
            }
        };

        const handleDisconnect = () => {
            console.log('[AuthModal] Phantom wallet disconnected');
            setPhantomAddress(null);
            setPhantomError(null);
        };

        // Listen for account changes
        provider.on('accountChanged', handleAccountChange);
        provider.on('disconnect', handleDisconnect);

        return () => {
            if (provider.removeListener) {
                provider.removeListener('accountChanged', handleAccountChange);
                provider.removeListener('disconnect', handleDisconnect);
            }
        };
    }, [phantomAddress]);

    // Handle Coinbase Wallet authentication flow
    useEffect(() => {
        console.log('[AuthModal] Coinbase auth useEffect triggered:', {
            coinbaseAddress,
            connectingWallet,
            view,
            hasLoggedIn: hasLoggedIn.current,
        });
        
        // Early return if conditions not met
        if (
            !coinbaseAddress ||
            connectingWallet !== 'Coinbase' ||
            view !== 'WALLET_CONNECTING' ||
            hasLoggedIn.current
        ) {
            console.log('[AuthModal] Coinbase auth useEffect early return');
            return;
        }

        console.log('[AuthModal] Coinbase Wallet connected, starting authentication flow:', coinbaseAddress);
        hasLoggedIn.current = true;
        setIsCoinbaseConnecting(true); // Set to true to show we're authenticating
        
        let isCancelled = false;
        
        const authenticateCoinbase = async () => {
            // Wait a bit before signing to avoid immediate popup after connect
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Check if cancelled
            if (isCancelled || !hasLoggedIn.current) {
                console.log('[AuthModal] Coinbase authentication cancelled');
                return;
            }
            
            try {
                // 1. Get challenge from backend
                const challenge = await authApi.getWalletChallenge(coinbaseAddress, 'ethereum');
                
                // Check again after async call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 2. Sign message with Coinbase Wallet
                const provider = getCoinbaseProvider();
                if (!provider) {
                    throw new Error('Coinbase Wallet not available');
                }
                
                const signature = await provider.request({
                    method: 'personal_sign',
                    params: [challenge.message, coinbaseAddress],
                }) as string;
                
                console.log('[AuthModal] Coinbase Wallet signature received');
                
                // Check again before API call
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 3. Verify with backend (this will save external wallet and generate Privy wallet)
                const authResponse = await authApi.verifyWallet(
                    coinbaseAddress,
                    'ethereum',
                    signature as string,
                    challenge.message
                );
                
                console.log('[AuthModal] Coinbase Wallet auth response received:', {
                    hasUser: !!authResponse.user,
                    userId: authResponse.user?.id,
                    hasTokens: !!authResponse.tokens,
                });
                
                // Final check before updating state
                if (isCancelled || !hasLoggedIn.current) {
                    return;
                }
                
                // 4. Update auth context
                console.log('[AuthModal] Setting user from auth response...');
                
                // Set user immediately from response to show logged in state
                if (authResponse.user) {
                    console.log('[AuthModal] Setting user directly from auth response:', {
                        id: authResponse.user.id,
                        email: authResponse.user.email,
                        fullName: authResponse.user.fullName,
                    });
                    setUser(authResponse.user as User);
                }
                
                // Wait a bit for tokens to be fully saved to localStorage
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verify tokens are saved
                const tokenCheck = getAccessToken();
                console.log('[AuthModal] Token check after save:', { hasToken: !!tokenCheck });
                
                // Refresh user from API to get complete user data (with wallet addresses, etc.)
                try {
                    console.log('[AuthModal] Calling refreshUser to get complete user data...');
                    await refreshUser();
                    console.log('[AuthModal] User refreshed successfully from API');
                } catch (refreshError) {
                    console.error('[AuthModal] Failed to refresh user from API:', refreshError);
                    // User is already set from authResponse, so UI should show logged in state
                    console.log('[AuthModal] User state maintained from auth response');
                }
                
                // Small delay to show success state, then close
                setTimeout(() => {
                    if (!isCancelled) {
                        onClose();
                    }
                }, 800);
            } catch (err) {
                console.error('[AuthModal] Coinbase Wallet authentication failed:', err);
                hasLoggedIn.current = false; // Reset on error to allow retry
                setIsCoinbaseConnecting(false);
                setCoinbaseError(err instanceof Error ? err.message : 'Authentication failed');
                
                // Show error and allow retry
                setTimeout(() => {
                    if (!isCancelled) {
                        setView('MAIN');
                        setConnectingWallet(null);
                        setCoinbaseAddress(null);
                    }
                }, 3000);
            }
        };
        
        authenticateCoinbase();
        
        // Cleanup function
        return () => {
            isCancelled = true;
        };
    }, [coinbaseAddress, connectingWallet, view, refreshUser, onClose, setUser]);

    // Listen for Coinbase Wallet account changes
    useEffect(() => {
        const provider = getCoinbaseProvider();
        if (provider && typeof provider.on === 'function') {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setCoinbaseAddress(accounts[0]);
                } else {
                    setCoinbaseAddress(null);
                }
            };

            provider.on('accountsChanged', handleAccountsChanged);

            return () => {
                if (typeof provider.removeListener === 'function') {
                    provider.removeListener('accountsChanged', handleAccountsChanged);
                }
            };
        }
    }, []);

    const handleWalletConnect = async (walletName: string) => {
        console.log('[AuthModal] Wallet clicked:', walletName);
        console.log('[AuthModal] Available wallets:', availableWallets.map(w => w.name));
        
        setConnectingWallet(walletName);

        // For Slush, show account selection screen first
        if (walletName === 'Slush') {
            setView('WALLET_SELECT_ACCOUNT');
            return;
        }

        // For MetaMask, connect directly
        if (walletName === 'Metamask') {
            setView('WALLET_CONNECTING');
            setMetaMaskError(null);
            hasLoggedIn.current = false; // Reset login flag for new attempt
            setIsMetaMaskConnecting(true);
            
            try {
                // Get MetaMask provider (handles multiple wallet extensions)
                const provider = getMetaMaskProvider();
                
                if (!provider) {
                    throw new Error('MetaMask not installed. Please install MetaMask extension.');
                }

                // Request account access
                const accounts = await provider.request({
                    method: 'eth_requestAccounts',
                });

                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found. Please unlock MetaMask.');
                }

                const address = accounts[0];
                console.log('[AuthModal] MetaMask connected:', address);
                
                // Set address and reset connecting state to trigger authentication flow
                setIsMetaMaskConnecting(false); // Reset first so useEffect can run
                setMetaMaskAddress(address); // This will trigger the authentication useEffect
            } catch (err) {
                console.error('[AuthModal] MetaMask connection failed:', err);
                setMetaMaskError(err instanceof Error ? err.message : 'Failed to connect MetaMask');
                setIsMetaMaskConnecting(false);
                hasLoggedIn.current = false; // Reset on error
                
                // Go back to main view on error
                setTimeout(() => {
                    setView('MAIN');
                    setConnectingWallet(null);
                    setMetaMaskAddress(null);
                }, 2000);
            }
            return;
        }

        // For Phantom (Solana wallet), connect directly
        if (walletName === 'Phantom') {
            setView('WALLET_CONNECTING');
            setPhantomError(null);
            hasLoggedIn.current = false; // Reset login flag for new attempt
            setIsPhantomConnecting(true);
            
            try {
                // Check if Phantom is installed
                const provider = window.solana;
                
                if (!provider || !provider.isPhantom) {
                    throw new Error('Phantom wallet not installed. Please install Phantom extension.');
                }

                // Request connection
                const response = await provider.connect();
                
                if (!response || !response.publicKey) {
                    throw new Error('Failed to connect to Phantom wallet');
                }

                const address = response.publicKey.toString();
                console.log('[AuthModal] Phantom connected:', address);
                
                // Set address and reset connecting state to trigger authentication flow
                setIsPhantomConnecting(false); // Reset first so useEffect can run
                setPhantomAddress(address); // This will trigger the authentication useEffect
            } catch (err) {
                console.error('[AuthModal] Phantom connection failed:', err);
                setPhantomError(err instanceof Error ? err.message : 'Failed to connect Phantom wallet');
                setIsPhantomConnecting(false);
                hasLoggedIn.current = false; // Reset on error
                
                // Go back to main view on error
                setTimeout(() => {
                    setView('MAIN');
                    setConnectingWallet(null);
                    setPhantomAddress(null);
                }, 2000);
            }
            return;
        }

        // For Coinbase Wallet, connect directly
        if (walletName === 'Coinbase') {
            setView('WALLET_CONNECTING');
            setCoinbaseError(null);
            hasLoggedIn.current = false; // Reset login flag for new attempt
            setIsCoinbaseConnecting(true);
            
            try {
                // Get Coinbase Wallet provider
                const provider = getCoinbaseProvider();
                
                if (!provider) {
                    throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension or use Coinbase Wallet mobile app.');
                }

                // Request account access
                const accounts = await provider.request({
                    method: 'eth_requestAccounts',
                });

                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found. Please unlock Coinbase Wallet.');
                }

                const address = accounts[0];
                console.log('[AuthModal] Coinbase Wallet connected:', address);
                
                // Set address and reset connecting state to trigger authentication flow
                setIsCoinbaseConnecting(false); // Reset first so useEffect can run
                setCoinbaseAddress(address); // This will trigger the authentication useEffect
            } catch (err) {
                console.error('[AuthModal] Coinbase Wallet connection failed:', err);
                setCoinbaseError(err instanceof Error ? err.message : 'Failed to connect Coinbase Wallet');
                setIsCoinbaseConnecting(false);
                hasLoggedIn.current = false; // Reset on error
                
                // Go back to main view on error
                setTimeout(() => {
                    setView('MAIN');
                    setConnectingWallet(null);
                    setCoinbaseAddress(null);
                }, 2000);
            }
            return;
        }

        // For other wallets, go directly to connecting (placeholder)
        setView('WALLET_CONNECTING');
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    // Actually initiate Slush connection after user confirms
    const handleConfirmSlushConnect = () => {
        console.log('[AuthModal] User confirmed, connecting to Slush...');
        setView('WALLET_CONNECTING');
        setTimeout(() => {
            connectSlush();
        }, 100);
    };

    const renderContent = () => {
        if (view === 'EMAIL') {
            return <EmailForm initialMode={initialMode} onBack={() => setView('MAIN')} onSuccess={onClose} />;
        }

        // Account Selection Screen for Slush Wallet
        if (view === 'WALLET_SELECT_ACCOUNT') {
            return (
                <div className="flex flex-col items-center py-8 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[#6FBCF0] to-[#4DA2D9] flex items-center justify-center">
                        <AuthIcons.Slush className="w-10 h-10" />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2">Connect Slush Wallet</h3>
                    
                    <div className="w-full max-w-[300px] p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
                        <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-2">
                            ⚠️ Penting: Pilih Account Dulu!
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Slush Wallet akan otomatis menggunakan <strong>account yang sedang aktif</strong>.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Untuk menggunakan account lain:
                        </p>
                        <ol className="text-xs text-muted-foreground mt-1 list-decimal list-inside space-y-1">
                            <li>Klik icon <strong>Slush Wallet</strong> di browser</li>
                            <li>Pilih account yang ingin digunakan</li>
                            <li>Kembali ke sini dan klik "Connect"</li>
                        </ol>
                    </div>

                    <div className="flex gap-3 w-full max-w-[300px]">
                        <button
                            onClick={() => {
                                setView('MAIN');
                                setConnectingWallet(null);
                            }}
                            className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleConfirmSlushConnect}
                            className="flex-1 px-4 py-2.5 text-sm bg-[#6FBCF0] text-white rounded-lg hover:bg-[#5DACDF] transition-colors font-medium"
                        >
                            Connect
                        </button>
                    </div>
                </div>
            );
        }

        if (view === 'WALLET_CONNECTING') {
            // Determine connection state for different wallets
            const isSlushConnecting = connectingWallet === 'Slush';
            const isMetaMaskWallet = connectingWallet === 'Metamask';
            const isPhantomWallet = connectingWallet === 'Phantom';
            const isCoinbaseWallet = connectingWallet === 'Coinbase';
            
            // Sui wallet states
            const showSlushSuccess = isSlushConnecting && isSuiConnected;
            const showSlushError = isSlushConnecting && suiError;
            
            // MetaMask states
            const showMetaMaskSuccess = isMetaMaskWallet && metaMaskAddress && !metaMaskError && isMetaMaskConnecting;
            const showMetaMaskError = isMetaMaskWallet && metaMaskError;
            
            // Phantom states
            const showPhantomSuccess = isPhantomWallet && phantomAddress && !phantomError && isPhantomConnecting;
            const showPhantomError = isPhantomWallet && phantomError;
            
            // Coinbase Wallet states
            const showCoinbaseSuccess = isCoinbaseWallet && coinbaseAddress && !coinbaseError && isCoinbaseConnecting;
            const showCoinbaseError = isCoinbaseWallet && coinbaseError;

            return (
                <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-300">
                    <div className="relative w-20 h-20 mb-6">
                        {/* Success State */}
                        {(showSlushSuccess || showMetaMaskSuccess || showPhantomSuccess || showCoinbaseSuccess) ? (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-green-500/50" />
                                <div className="absolute inset-2 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <Check className="w-10 h-10 text-green-500" />
                                </div>
                            </>
                        ) : (showSlushError || showMetaMaskError || showPhantomError || showCoinbaseError) ? (
                            /* Error State */
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-red-500/50" />
                                <div className="absolute inset-2 bg-red-500/10 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                            </>
                        ) : (
                            /* Loading State */
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-accent/30 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                                <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center p-3">
                                    {connectingWallet === 'Metamask' && <AuthIcons.Metamask className="w-full h-full" />}
                                    {connectingWallet === 'Phantom' && <AuthIcons.Phantom className="w-full h-full" />}
                                    {connectingWallet === 'Slush' && <AuthIcons.Slush className="w-full h-full" />}
                                    {connectingWallet === 'Solflare' && <AuthIcons.Solflare className="w-full h-full" />}
                                    {connectingWallet === 'Coinbase' && <AuthIcons.Coinbase className="w-full h-full" />}
                                    {connectingWallet === 'WalletConnect' && <AuthIcons.WalletConnect className="w-full h-full" />}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status Text */}
                    {(showSlushSuccess || showMetaMaskSuccess || showPhantomSuccess || showCoinbaseSuccess) ? (
                        <>
                            <h3 className="text-lg font-bold text-green-500">Connected!</h3>
                            <p className="text-muted-foreground text-sm mt-2">
                                {isSlushConnecting && suiAddress 
                                    ? shortenAddress(suiAddress) 
                                    : isMetaMaskWallet && metaMaskAddress
                                    ? `${metaMaskAddress.slice(0, 6)}...${metaMaskAddress.slice(-4)}`
                                    : isPhantomWallet && phantomAddress
                                    ? `${phantomAddress.slice(0, 6)}...${phantomAddress.slice(-4)}`
                                    : isCoinbaseWallet && coinbaseAddress
                                    ? `${coinbaseAddress.slice(0, 6)}...${coinbaseAddress.slice(-4)}`
                                    : 'Wallet connected successfully'}
                            </p>
                            <p className="text-muted-foreground text-xs mt-3 animate-pulse">
                                Please approve the signature request in your wallet...
                            </p>
                        </>
                    ) : (showSlushError || showMetaMaskError || showPhantomError || showCoinbaseError) ? (
                        <>
                            <h3 className="text-lg font-bold text-red-500">Connection Failed</h3>
                            <p className="text-muted-foreground text-sm mt-2 text-center max-w-[280px]">
                                {suiError || metaMaskError || phantomError || coinbaseError || 'Failed to connect wallet. Please try again.'}
                            </p>
                            <button
                                onClick={() => {
                                    setView('MAIN');
                                    setConnectingWallet(null);
                                    setMetaMaskAddress(null);
                                    setMetaMaskError(null);
                                    setPhantomAddress(null);
                                    setPhantomError(null);
                                    setCoinbaseAddress(null);
                                    setCoinbaseError(null);
                                }}
                                className="mt-4 px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold">Connecting to {connectingWallet}...</h3>
                            <p className="text-muted-foreground text-sm mt-2">Please approve the request in your wallet.</p>
                            
                            {/* Instructions for Sui wallet */}
                            {isSlushConnecting && availableWallets.length > 0 && (
                                <div className="mt-4 p-3 bg-accent/20 rounded-lg text-center space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        💡 <strong>Want to use a different account?</strong>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        1. Click the Slush Wallet extension icon<br/>
                                        2. Switch to your preferred account<br/>
                                        3. Then approve the connection request
                                    </p>
                                    <button
                                        onClick={() => {
                                            setView('MAIN');
                                            setConnectingWallet(null);
                                        }}
                                        className="mt-2 text-xs text-primary hover:underline"
                                    >
                                        Cancel & Try Again
                                    </button>
                                </div>
                            )}
                            
                            {/* No wallet detected for Slush */}
                            {isSlushConnecting && availableWallets.length === 0 && (
                                <div className="mt-4 text-center">
                                    <p className="text-amber-500 text-xs max-w-[280px]">
                                        No Sui wallet detected. Please install Slush Wallet extension.
                                    </p>
                                    <a 
                                        href="https://slush.app" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block px-4 py-2 text-xs bg-[#6FBCF0] text-white rounded-lg hover:bg-[#5DACDF] transition-colors"
                                    >
                                        Install Slush Wallet
                                    </a>
                                    <button
                                        onClick={() => {
                                            setView('MAIN');
                                            setConnectingWallet(null);
                                        }}
                                        className="mt-2 block mx-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}

                            {/* No MetaMask detected */}
                            {isMetaMaskWallet && !getMetaMaskProvider() && (
                                <div className="mt-4 text-center">
                                    <p className="text-amber-500 text-xs max-w-[280px]">
                                        MetaMask not detected. Please install MetaMask extension.
                                    </p>
                                    <a 
                                        href="https://metamask.io/download/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block px-4 py-2 text-xs bg-[#F6851B] text-white rounded-lg hover:bg-[#E2761B] transition-colors"
                                    >
                                        Install MetaMask
                                    </a>
                                    <button
                                        onClick={() => {
                                            setView('MAIN');
                                            setConnectingWallet(null);
                                            setMetaMaskAddress(null);
                                        }}
                                        className="mt-2 block mx-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}

                            {/* No Phantom detected */}
                            {isPhantomWallet && (!window.solana || !window.solana.isPhantom) && (
                                <div className="mt-4 text-center">
                                    <p className="text-amber-500 text-xs max-w-[280px]">
                                        Phantom wallet not detected. Please install Phantom extension.
                                    </p>
                                    <a 
                                        href="https://phantom.app/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block px-4 py-2 text-xs bg-[#AB9FF2] text-white rounded-lg hover:bg-[#9B8FE2] transition-colors"
                                    >
                                        Install Phantom
                                    </a>
                                    <button
                                        onClick={() => {
                                            setView('MAIN');
                                            setConnectingWallet(null);
                                            setPhantomAddress(null);
                                        }}
                                        className="mt-2 block mx-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}

                            {/* No Coinbase Wallet detected */}
                            {isCoinbaseWallet && !getCoinbaseProvider() && (
                                <div className="mt-4 text-center">
                                    <p className="text-amber-500 text-xs max-w-[280px]">
                                        Coinbase Wallet not detected. Please install Coinbase Wallet extension or use Coinbase Wallet mobile app.
                                    </p>
                                    <a 
                                        href="https://www.coinbase.com/wallet" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block px-4 py-2 text-xs bg-[#0052FF] text-white rounded-lg hover:bg-[#0040CC] transition-colors"
                                    >
                                        Get Coinbase Wallet
                                    </a>
                                    <button
                                        onClick={() => {
                                            setView('MAIN');
                                            setConnectingWallet(null);
                                            setCoinbaseAddress(null);
                                        }}
                                        className="mt-2 block mx-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }

        // MAIN VIEW
        return (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {initialMode === 'signup' ? 'Create an Account' : 'Welcome to DeJaVu'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {initialMode === 'signup'
                            ? 'Sign up to trade, predict, and win.'
                            : 'Sign in to trade, predict, and win.'}
                    </p>
                </div>

                <div className="space-y-3">
                    <SocialButton
                        icon={<AuthIcons.Google />}
                        variant="solid"
                        className="bg-white text-black hover:bg-gray-100 border-none shadow-md shadow-gray-200/10 dark:shadow-none"
                        onClick={() => {
                            // Simulate Google Logic
                            handleWalletConnect("Google");
                        }}
                    >
                        Continue with Google
                    </SocialButton>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/40" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <WalletOption
                            icon={<AuthIcons.Metamask />}
                            name="Metamask"
                            recommended
                            onClick={() => handleWalletConnect('Metamask')}
                        />
                        <WalletOption
                            icon={<AuthIcons.Phantom />}
                            name="Phantom"
                            onClick={() => handleWalletConnect('Phantom')}
                        />
                        <WalletOption
                            icon={<AuthIcons.Coinbase />}
                            name="Coinbase"
                            onClick={() => handleWalletConnect('Coinbase')}
                        />
                        <WalletOption
                            icon={<AuthIcons.Slush />}
                            name="Slush"
                            onClick={() => handleWalletConnect('Slush')}
                        />
                        <WalletOption
                            icon={<AuthIcons.WalletConnect />}
                            name="WalletConnect"
                            className="col-span-2"
                            onClick={() => handleWalletConnect('WalletConnect')}
                        />
                    </div>

                    <SocialButton
                        icon={<AuthIcons.Email className="w-5 h-5" />}
                        className="mt-2"
                        onClick={() => setView('EMAIL')}
                    >
                        Continue with Email
                    </SocialButton>
                </div>

                <div className="flex items-start gap-3 px-4 py-2 mt-2 group cursor-pointer" onClick={() => setAgreed(!agreed)}>
                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${agreed ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-accent/10 group-hover:border-primary/50'}`}>
                        {agreed && <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3px]" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 leading-tight flex-1 select-none">
                        By continuing, you agree to our <a href="#" className="underline hover:text-foreground relative z-10" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="#" className="underline hover:text-foreground relative z-10" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl duration-300 [&>button]:hidden ring-1 ring-white/5">
                {/* Close button - absolute for styling */}
                {/* Close button - absolute for styling */}
                <div className="absolute right-4 top-4 z-50">
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground cursor-pointer ring-1 ring-inset ring-black/5 dark:ring-white/5"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Animated Gradient Background Effect */}
                <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent pointer-events-none" />
                <div className="absolute -top-[100px] -left-[100px] w-[200px] h-[200px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

                <div className="p-8 pb-10 relative">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
