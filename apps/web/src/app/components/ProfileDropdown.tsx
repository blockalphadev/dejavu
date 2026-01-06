import { User, LogOut, Wallet, Settings, ChevronDown, Plus, DollarSign, Loader2, LayoutDashboard } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from './ui/drawer';
import { Button } from './ui/button';
import { useAuth, type User as AuthUser } from './auth/AuthContext';
import { useDeposit } from './DepositContext';

interface ProfileDropdownProps {
    user: AuthUser;
    mobile?: boolean;
    triggerOnly?: boolean;
    children?: React.ReactNode;
    onNavigate?: (tab: string) => void;
}

export function ProfileDropdown({ user, mobile, triggerOnly, children, onNavigate }: ProfileDropdownProps) {
    const { logout, isLoading } = useAuth();
    const { balance, isLoadingBalance, openDepositModal } = useDeposit();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
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
                className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
            />
        ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium border-2 border-white/10">
                {initials}
            </div>
        )
    );

    if (mobile) {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    {triggerOnly && children ? children : (
                        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent/10 transition-colors">
                            <AvatarCircle />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-lg">{displayName}</span>
                                <span className="text-sm text-muted-foreground">View Profile</span>
                            </div>
                            <ChevronDown className="w-5 h-5 ml-auto text-muted-foreground" />
                        </button>
                    )}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader className="text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="scale-125">
                                <AvatarCircle />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl">{displayName}</DrawerTitle>
                                {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="px-4 pb-8 space-y-6">
                        {/* Balance Card */}
                        <div className="bg-muted/30 p-4 rounded-xl border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Available Balance</span>
                                {isLoadingBalance && <Loader2 className="w-3 h-3 animate-spin" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-6 h-6 text-green-500" />
                                    <span className="text-3xl font-bold tracking-tight">
                                        {balance ? balance.availableBalance : '0.00'}
                                    </span>
                                    <span className="text-base text-muted-foreground mt-1">USDC</span>
                                </div>
                                <Button
                                    onClick={() => openDepositModal()}
                                    className="rounded-full bg-green-500 hover:bg-green-600 text-white px-6 font-bold shadow-lg shadow-green-500/20"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Deposit
                                </Button>
                            </div>
                            {balance && parseFloat(balance.lockedBalance) > 0 && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                        Locked in orders: ${balance.lockedBalance}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal gap-3">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Profile
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal gap-3">
                                <Wallet className="w-5 h-5 text-muted-foreground" />
                                Wallets
                                {user.walletAddresses && user.walletAddresses.length > 0 && (
                                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {user.walletAddresses.length}
                                    </span>
                                )}
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal gap-3">
                                <Settings className="w-5 h-5 text-muted-foreground" />
                                Settings
                            </Button>
                        </div>

                        <DrawerFooter className="px-0">
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl text-base gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                {isLoading ? 'Logging out...' : 'Log out'}
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full h-12 rounded-xl">Cancel</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop View
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-accent/50"
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {initials}
                        </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {displayName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                {/* User Info */}
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{displayName}</p>
                        {user.email && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Balance Display */}
                <div className="px-2 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Available Balance</span>
                        {isLoadingBalance && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <span className="text-xl font-bold">
                                {balance ? balance.availableBalance : '0.00'}
                            </span>
                            <span className="text-sm text-muted-foreground">USDC</span>
                        </div>
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.preventDefault();
                                openDepositModal();
                            }}
                            className="h-7 px-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Deposit
                        </Button>
                    </div>
                    {balance && parseFloat(balance.lockedBalance) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Locked: ${balance.lockedBalance}
                        </p>
                    )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate?.('dashboards')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Portfolio</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Wallets</span>
                    {user.walletAddresses && user.walletAddresses.length > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {user.walletAddresses.length}
                        </span>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    onClick={handleLogout}
                    disabled={isLoading}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoading ? 'Logging out...' : 'Log out'}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

