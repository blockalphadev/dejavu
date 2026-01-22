import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { AuthIcons } from './AuthIcons';
import { SocialButton } from './SocialButton';
import { WalletOption } from './WalletOption';
import { EmailForm } from './EmailForm';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

type AuthView = 'MAIN' | 'EMAIL' | 'WALLET_CONNECTING';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const [view, setView] = useState<AuthView>('MAIN');
    const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('MAIN');
                setConnectingWallet(null);
            }, 300); // Wait for exit animation
        }
    }, [isOpen]);

    const handleWalletConnect = (walletName: string) => {
        setConnectingWallet(walletName);
        setView('WALLET_CONNECTING');

        // Simulate connection
        setTimeout(() => {
            onClose();
            // Here you would trigger actual global login success
        }, 2000);
    };

    const renderContent = () => {
        if (view === 'EMAIL') {
            return <EmailForm initialMode={initialMode} onBack={() => setView('MAIN')} onSuccess={onClose} />;
        }

        if (view === 'WALLET_CONNECTING') {
            return (
                <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-300">
                    <div className="relative w-20 h-20 mb-6">
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
                    </div>
                    <h3 className="text-lg font-bold">Connecting to {connectingWallet}...</h3>
                    <p className="text-muted-foreground text-sm mt-2">Please approve the request in your wallet.</p>
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
                            // Redirect to backend Google OAuth endpoint
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
                            window.location.href = `${apiUrl}/auth/google`;
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

                <p className="text-[11px] text-muted-foreground/80 text-center leading-tight mx-auto max-w-[280px] mt-4">
                    By continuing, you agree to our <a href="#" className="underline hover:text-foreground relative z-10" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and <a href="#" className="underline hover:text-foreground relative z-10" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
                </p>
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
