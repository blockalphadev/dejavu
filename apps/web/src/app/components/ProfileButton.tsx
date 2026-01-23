import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { type User as AuthUser, useAuth } from './auth/AuthContext';
import { useDeposit } from '../contexts/DepositContext';
import { useSuiWallet, shortenAddress } from '../hooks/useSuiWallet';
import { cn } from './ui/utils';
import { userApi } from '../../services/api';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    LayoutDashboard,
    Wallet,
    Settings,
    LogOut,
    Unplug,
    RefreshCw,
} from 'lucide-react';

interface ProfileButtonProps {
    user: AuthUser;
    mobile?: boolean;
    triggerOnly?: boolean;
    children?: React.ReactNode;
    onNavigate?: (tab: string) => void;
}

export function ProfileButton({ user, mobile, triggerOnly, children }: ProfileButtonProps) {
    const navigate = useNavigate();
    const { logout, isAuthenticated } = useAuth();
    const { openDepositModal, balance, isLoadingBalance } = useDeposit();
    const { 
        isConnected: isSuiConnected, 
        suiBalance, 
        address: suiAddress,
        disconnect: disconnectSui,
        connectSlush,
        isBalanceLoading: isSuiBalanceLoading,
    } = useSuiWallet();

    // Get Sui asset from backend balance to show USD value
    const suiAsset = balance?.assets?.find(a => a.chain === 'sui');
    const suiBalanceUsd = suiAsset?.valueUsd || '0.00';
    const isBalanceDataLoading = isLoadingBalance || isSuiBalanceLoading;

    // External wallet state
    const [externalWallets, setExternalWallets] = useState<Array<{ address: string; chain: string }>>([]);
    const [externalWalletBalances, setExternalWalletBalances] = useState<Record<string, number>>({});
    const [isLoadingExternalBalances, setIsLoadingExternalBalances] = useState(false);

    // Fetch external wallets and their balances
    useEffect(() => {
        if (!isSuiConnected || !isAuthenticated) {
            setExternalWallets([]);
            setExternalWalletBalances({});
            return;
        }

        const fetchExternalWallets = async () => {
            try {
                const response = await userApi.getExternalWallets();
                setExternalWallets(response.wallets || []);
            } catch (err) {
                console.error('Failed to fetch external wallets:', err);
            }
        };

        fetchExternalWallets();
    }, [isSuiConnected, isAuthenticated]);

    // Fetch external wallet balances real-time
    useEffect(() => {
        if (externalWallets.length === 0) {
            setExternalWalletBalances({});
            return;
        }

        const fetchBalances = async () => {
            setIsLoadingExternalBalances(true);
            try {
                const balances: Record<string, number> = {};
                
                // For Sui external wallets, use useTokenBalances hook
                const suiExternalWallet = externalWallets.find(w => w.chain === 'sui');
                if (suiExternalWallet && suiExternalWallet.address === suiAddress) {
                    // Use existing suiBalance from useSuiWallet
                    balances[`sui-${suiExternalWallet.address}`] = suiBalance;
                }
                
                setExternalWalletBalances(balances);
            } catch (err) {
                console.error('Failed to fetch external wallet balances:', err);
            } finally {
                setIsLoadingExternalBalances(false);
            }
        };

        fetchBalances();
        
        // Refresh every 15 seconds for real-time updates
        const interval = setInterval(fetchBalances, 15000);
        return () => clearInterval(interval);
    }, [externalWallets, suiAddress, suiBalance]);

    // Handle full logout (both auth and wallet)
    const handleFullLogout = async () => {
        // Disconnect Sui wallet if connected
        if (isSuiConnected) {
            disconnectSui();
        }
        // Logout from auth system
        await logout();
    };

    // Handle wallet disconnect (for wallet-only users, this also logs out)
    const handleWalletDisconnect = () => {
        disconnectSui();
        // If user is wallet-only user, also logout from auth
        if (user.isWalletUser) {
            logout();
        }
    };

    // Handle switching to a different wallet account
    const handleSwitchAccount = async () => {
        console.log('[ProfileButton] Switching account...');
        // Disconnect first
        disconnectSui();
        // Clear auth if wallet user
        if (user.isWalletUser) {
            await logout();
        }
        // Small delay then reconnect (this should show account selector)
        setTimeout(() => {
            connectSlush();
        }, 300);
    };

    // Get initials for avatar
    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return 'U';
    };

    const initials = getInitials(user.fullName, user.email);
    const displayName = user.fullName || user.email?.split('@')[0] || 'User';

    const AvatarCircle = () => (
        user.avatarUrl ? (
            <img
                src={user.avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-border"
            />
        ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium border-2 border-border">
                {initials}
            </div>
        )
    );

    const handleOpenSettings = () => {
        navigate('/settings');
    };

    if (mobile) {
        // Mobile trigger - usually rendered inside the drawer or sidebar, but if used as a trigger button:
        return (
            <>
                {triggerOnly && children ? (
                    <div onClick={handleOpenSettings} className="cursor-pointer">
                        {children}
                    </div>
                ) : (
                    <button
                        onClick={handleOpenSettings}
                        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent/10 transition-colors"
                    >
                        <AvatarCircle />
                        <div className="flex flex-col items-start text-left">
                            <span className="font-semibold text-lg">{displayName}</span>
                            <span className="text-sm text-muted-foreground">View Profile & Settings</span>
                        </div>
                    </button>
                )}
            </>
        );
    }

    // Desktop View
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-accent/50 transition-all focus-visible:ring-0 focus-visible:ring-offset-0",
                    )}
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover shadow-sm"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            {initials}
                        </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {displayName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/portfolio')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Portfolio</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => openDepositModal()}
                    className="group relative cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white focus:text-white my-1 py-3 shadow-md hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 border border-green-500/20 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="flex items-center justify-between w-full relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                                <Wallet className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                            </div>
                            <span className="font-bold tracking-wide text-sm">Deposit</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/20 group-hover:bg-black/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border border-white/10">
                            <span className="text-white/95 tracking-wide">{balance?.availableBalance ? Number(balance.availableBalance).toFixed(2) : '0.00'}</span>
                            <span className="text-white/70 text-[10px]">USDC</span>
                        </div>
                    </div>
                </DropdownMenuItem>

                {/* Slush Wallet Balance Display (External Wallet - Tambahan) */}
                {isSuiConnected && suiAddress && (
                    <div className="mx-1 my-2 p-3 rounded-lg bg-gradient-to-r from-[#6FBCF0]/10 to-[#4DA2D9]/10 border border-[#6FBCF0]/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img 
                                    src="/images/coin/sui.png" 
                                    alt="SUI" 
                                    className="w-5 h-5 rounded-full"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Slush Wallet</span>
                                    <span className="text-xs font-mono text-[#6FBCF0]">
                                        {shortenAddress(suiAddress)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-sm">
                                        {isLoadingExternalBalances || isSuiBalanceLoading ? '...' : `${suiBalance.toFixed(4)}`}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">SUI</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwitchAccount();
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-[#6FBCF0] transition-colors py-1.5 rounded-md hover:bg-[#6FBCF0]/10"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Switch
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleWalletDisconnect();
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors py-1.5 rounded-md hover:bg-red-500/10"
                            >
                                <Unplug className="w-3 h-3" />
                                Disconnect
                            </button>
                        </div>
                    </div>
                )}

                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFullLogout} className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
