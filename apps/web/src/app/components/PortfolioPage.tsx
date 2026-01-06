
import { useState } from "react";
import { Settings, Download, Upload, Search, Filter, EyeOff, Eye } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import { useDeposit } from "./DepositContext";
import { ProfileDropdown } from "./ProfileDropdown";
import { WithdrawModal } from "./WithdrawModal";
import { Button } from "./ui/button";

export function PortfolioPage() {
    const { user, isAuthenticated } = useAuth();
    const { balance, openDepositModal } = useDeposit();
    const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
    const [hideValues, setHideValues] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    if (!isAuthenticated || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                <h2 className="text-xl font-bold mb-2">Portfolio</h2>
                <p className="text-muted-foreground mb-4">Sign in to view your portfolio</p>
            </div>
        );
    }

    return (
        <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                                {user.fullName?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <span className="font-semibold text-lg">Portfolio</span>
                    <button
                        onClick={() => setHideValues(!hideValues)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                    >
                        {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                <ProfileDropdown user={user} mobile triggerOnly>
                    <button className="p-2 hover:bg-accent rounded-full transition-colors">
                        <Settings className="w-6 h-6 text-muted-foreground" />
                    </button>
                </ProfileDropdown>
            </div>

            {/* Total Value Card */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm text-muted-foreground">Portfolio Value</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold tracking-tight">
                        {hideValues ? '****' : `$${balance?.availableBalance || '0.00'}`}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">USDC</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-green-500 font-medium">+$0.00</span>
                    <span className="text-green-500/80 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">0.00%</span>
                    <span className="text-muted-foreground ml-1">Today</span>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <Button
                    className="h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => openDepositModal()}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Deposit
                </Button>
                <Button
                    variant="outline"
                    className="h-12 text-base font-semibold border-border/50 hover:bg-accent rounded-xl"
                    onClick={() => setShowWithdrawModal(true)}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Withdraw
                </Button>
            </div>

            {/* PnL Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border border-border/50 rounded-2xl p-5 mb-8">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm text-muted-foreground font-medium">Profit/Loss</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {hideValues ? '****' : '$0.00'}
                        </div>
                        <span className="text-xs text-muted-foreground">Past Month</span>
                    </div>
                    {/* Timeframe Toggles */}
                    <div className="flex bg-background/50 backdrop-blur rounded-lg p-1 gap-1 border border-border/20">
                        {['1D', '1W', '1M', 'ALL'].map((tf) => (
                            <button
                                key={tf}
                                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${tf === '1M' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fake Chart Line */}
                <div className="h-16 w-full flex items-end opacity-50 relative z-10">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    {/* Just a placeholder for visual effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-primary/5 to-transparent" />
                </div>
            </div>

            {/* Content Tabs */}
            <div className="flex items-center border-b border-border/50 mb-4">
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`pb-3 px-1 mr-6 text-sm font-medium transition-all relative ${activeTab === 'positions' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    Positions
                    {activeTab === 'positions' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 px-1 mr-6 text-sm font-medium transition-all relative ${activeTab === 'orders' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    Open orders
                    {activeTab === 'orders' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-1 text-sm font-medium transition-all relative ${activeTab === 'history' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    History
                    {activeTab === 'history' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Filter/Search Bar */}
            <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-accent/30 border border-border/30 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/30 bg-accent/30 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Current value</span>
                </button>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <span className="text-sm">No {activeTab} found.</span>
            </div>

            <WithdrawModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                availableBalance={parseFloat(balance?.availableBalance || '0')}
                onSuccess={() => {
                    // Refresh balance if context exposes a refresh method, or just wait for next poll
                    // Assuming useDeposit context might verify balance internally or we can trigger it
                    // balance.refetch() ?
                }}
            />
        </div >
    );
}
