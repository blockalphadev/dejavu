import { useState } from 'react';
import {
    User,
    Shield,
    Wallet,
    Code,
    Key,
    Upload,
    Check,
    X,
    Twitter,
    LogOut,
    Plus,
    ChevronDown
} from 'lucide-react';
import { useDeposit } from './DepositContext';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from './auth/AuthContext';
import { cn } from './ui/utils';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'profile' | 'account' | 'wallets' | 'trading' | 'notifications' | 'builder' | 'keys';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { balance, openDepositModal } = useDeposit();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form states
    const [email, setEmail] = useState(user?.email || '');
    const [username, setUsername] = useState(user?.fullName || '');
    const [bio, setBio] = useState('');

    const handleSave = () => {
        setIsLoading(true);
        // Simulate save
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
        }, 1000);
    };

    const navItems = [
        { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
        { id: 'account', label: 'Account', icon: <Shield className="w-4 h-4" /> },
        { id: 'builder', label: 'Builder Codes', icon: <Code className="w-4 h-4" /> },
        { id: 'keys', label: 'Export Private Key', icon: <Key className="w-4 h-4" /> },
        { id: 'wallets', label: 'Wallets', icon: <Wallet className="w-4 h-4" /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="flex items-center gap-5">
                            <div className="relative group shrink-0">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-3xl md:text-3xl text-white font-bold shadow-2xl overflow-hidden ring-4 ring-background/50">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        (username?.[0] || user?.email?.[0] || 'U').toUpperCase()
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Button
                                    variant="secondary"
                                    className="h-9 px-4 text-xs font-medium bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border/40 shadow-sm transition-all duration-200 gap-2"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-xl">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-11 px-4 rounded-lg bg-card/50 md:bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 placeholder:text-muted-foreground/40 text-sm font-medium"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full h-11 px-4 rounded-lg bg-card/50 md:bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 placeholder:text-muted-foreground/40 text-sm font-mono"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell something about yourself..."
                                    className="w-full min-h-[120px] p-4 rounded-lg bg-card/50 md:bg-muted/30 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/40 text-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Social Connections</label>
                                <div className="flex gap-3">
                                    <Button variant="secondary" className="gap-2 h-10 px-4 bg-secondary/50 border border-border/40 hover:bg-secondary/80 transition-all text-sm font-medium">
                                        <Twitter className="w-4 h-4" />
                                        Connect X
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading || isSuccess}
                                    className={cn(
                                        "h-11 px-8 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg active:scale-[0.98]",
                                        isSuccess
                                            ? "bg-green-500 hover:bg-green-600 shadow-green-500/10"
                                            : "bg-[#3b82f6] hover:bg-[#2563eb] shadow-blue-500/10 text-white"
                                    )}
                                >
                                    {isLoading ? (
                                        'Saving...'
                                    ) : isSuccess ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Saved
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return <div className="p-8 text-center text-muted-foreground">Account Settings Coming Soon</div>;
            case 'trading':
                return <div className="p-8 text-center text-muted-foreground">Trading Settings Coming Soon</div>;
            case 'wallets':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Balance</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{balance ? balance.availableBalance : '0.00'}</span>
                                        <span className="text-sm font-medium text-muted-foreground">USDC</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => openDepositModal()}
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Deposit
                                </Button>
                            </div>

                            {balance && parseFloat(balance.lockedBalance) > 0 && (
                                <div className="flex items-center gap-2 text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/10">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span>${balance.lockedBalance} locked in active orders</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium">Connected Wallets</h4>
                            {user?.walletAddresses?.map((wallet, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">{wallet.chain}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                        Unlink
                                    </Button>
                                </div>
                            ))}
                            {(!user?.walletAddresses || user.walletAddresses.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No wallets connected</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const activeItemLabel = navItems.find(n => n.id === activeTab)?.label || 'Settings';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[100vw] h-[100svh] md:max-w-4xl md:h-[700px] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-none md:border md:border-white/10 shadow-2xl flex flex-col md:flex-row gap-0">

                {/* Mobile Header / Close Button */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-xl font-bold focus:outline-none bg-transparent">
                                {activeItemLabel}
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[220px] ml-4 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl">
                            {navItems.map(item => (
                                <DropdownMenuItem
                                    key={item.id}
                                    onSelect={() => setActiveTab(item.id as SettingsTab)}
                                    className="gap-3 py-3 cursor-pointer"
                                >
                                    {item.icon}
                                    {item.label}
                                    {activeTab === item.id && <Check className="ml-auto w-4 h-4 text-primary" />}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                                className="gap-3 py-3 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-500/10 mt-2 border-t border-border/50"
                                onSelect={() => logout()}
                            >
                                <LogOut className="w-4 h-4" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        onClick={onClose}
                        className="rounded-full p-2 bg-accent/50 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Sidebar (Desktop Only) */}
                <div className="hidden md:flex w-64 bg-muted/20 border-r border-border/40 flex-col py-6">
                    <div className="px-6 mb-6 hidden md:block">
                        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                    </div>

                    <div className="flex md:flex-col px-2 md:px-3 gap-1 md:gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal flex-shrink-0 md:flex-shrink",
                                    activeTab === item.id
                                        ? "bg-primary/10 text-primary shadow-[inset_3px_0_0_0_rgba(var(--primary))]"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                            >
                                {item.icon}
                                <span className="flex-1 text-left">{item.label}</span>
                                {activeTab === item.id && <Check className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto px-6 pt-6 hidden md:block">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => logout()}
                            disabled={isAuthLoading}
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
                    {/* Desktop Close Button removed - using Dialog's default */}

                    <div className="max-w-3xl mx-auto">
                        <div className="mb-6 md:mb-8">
                            <h3 className="hidden md:block text-2xl font-bold tracking-tight mb-2 capitalize">{navItems.find(n => n.id === activeTab)?.label}</h3>
                            <p className="hidden md:block text-muted-foreground text-sm md:text-base">Manage your {activeTab} preferences</p>
                        </div>

                        {renderContent()}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
