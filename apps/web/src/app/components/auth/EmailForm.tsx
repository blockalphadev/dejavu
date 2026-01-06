import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from './AuthContext';

interface EmailFormProps {
    onBack: () => void;
    onSuccess: () => void;
}

type FormMode = 'login' | 'signup';

export function EmailForm({ onBack, onSuccess }: EmailFormProps) {
    const [mode, setMode] = useState<FormMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { login, signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await signup(email, password, fullName || undefined);
            }
            setSuccess(true);
            setTimeout(onSuccess, 1000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError(null);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                    {mode === 'login' ? 'Welcome back!' : 'Account created!'}
                </h3>
                <p className="text-muted-foreground text-sm">
                    Redirecting you now...
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-1 -ml-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold">
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                </span>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {mode === 'signup' && (
                    <div className="group">
                        <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-accent/20 border border-border/50 focus:border-primary/50 focus:bg-accent/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                        />
                    </div>
                )}

                <div className="group">
                    <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">Email address</label>
                    <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-accent/20 border border-border/50 focus:border-primary/50 focus:bg-accent/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                        autoFocus
                    />
                </div>

                <div className="group">
                    <label className="text-xs font-medium text-muted-foreground ml-1 mb-1.5 block">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-accent/20 border border-border/50 focus:border-primary/50 focus:bg-accent/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {mode === 'signup' && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 ml-1">
                            Min 8 chars, 1 uppercase, 1 lowercase, 1 number
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className={cn(
                        "w-full h-12 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all",
                        loading && "opacity-80"
                    )}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-2">
                {mode === 'login' ? (
                    <>
                        Don't have an account?{' '}
                        <button type="button" onClick={toggleMode} className="text-primary hover:underline font-medium">
                            Sign up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{' '}
                        <button type="button" onClick={toggleMode} className="text-primary hover:underline font-medium">
                            Log in
                        </button>
                    </>
                )}
            </p>
        </form>
    );
}

