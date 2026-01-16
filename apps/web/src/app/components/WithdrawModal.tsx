
import { useState, useRef, useCallback } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { depositApi } from '../../services/api';
import { parseUnits, encodeFunctionData, isAddress, createWalletClient, custom } from 'viem';
import { base, mainnet } from 'viem/chains';

// Security: Rate limiting configuration
const RATE_LIMIT = {
    maxAttempts: 3,
    windowMs: 60000, // 1 minute
};

// Security: Minimum withdrawal amount
const MIN_WITHDRAWAL_AMOUNT = 1;
const MAX_WITHDRAWAL_AMOUNT = 100000;

// Minimal ERC20 ABI for transfer
const ERC20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

// USDC Addresses by Chain ID
const USDC_ADDRESS_MAP: Record<number, string> = {
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',    // Ethereum Mainnet
};

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
    onSuccess: () => void;
}

const CHAINS = [
    { id: 'base', name: 'Base', icon: '/images/coin/base.jpeg', chainId: 8453 },
    { id: 'ethereum', name: 'Ethereum', icon: '/images/coin/ethereum.png', chainId: 1 },
    { id: 'solana', name: 'Solana', icon: '/images/coin/solana.png', chainId: 900 },
    { id: 'sui', name: 'Sui', icon: '/images/coin/sui.png', chainId: 901 },
];

// Helper function to validate Solana address (base58)
const isValidSolanaAddress = (addr: string): boolean => {
    // Solana addresses are 32-44 characters, base58 encoded
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(addr);
};

// Helper function to validate Sui address
const isValidSuiAddress = (addr: string): boolean => {
    // Sui addresses are 66 characters (0x + 64 hex chars)
    const suiRegex = /^0x[a-fA-F0-9]{64}$/;
    return suiRegex.test(addr);
};

// Get address placeholder based on chain
const getAddressPlaceholder = (chainId: string): string => {
    switch (chainId) {
        case 'solana':
            return 'Enter Solana address...';
        case 'sui':
            return '0x... (64 characters)';
        default:
            return '0x...';
    }
};

// Validate address based on selected chain
const isValidAddress = (addr: string, chainId: string): boolean => {
    if (!addr) return false;
    switch (chainId) {
        case 'solana':
            return isValidSolanaAddress(addr);
        case 'sui':
            return isValidSuiAddress(addr);
        default:
            return isAddress(addr); // Ethereum validation
    }
};

export function WithdrawModal({ isOpen, onClose, availableBalance, onSuccess }: WithdrawModalProps) {
    const { wallets } = useWallets();
    const { getAccessToken, authenticated } = usePrivy();
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState(CHAINS[0]); // Default to Base
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [error, setError] = useState<string | null>(null);

    // Security: Rate limiting state
    const attemptCountRef = useRef(0);
    const lastAttemptTimeRef = useRef(0);

    // Security: Check rate limit before withdrawal
    const checkRateLimit = useCallback((): boolean => {
        const now = Date.now();

        // Reset counter if window has passed
        if (now - lastAttemptTimeRef.current > RATE_LIMIT.windowMs) {
            attemptCountRef.current = 0;
        }

        if (attemptCountRef.current >= RATE_LIMIT.maxAttempts) {
            const remainingTime = Math.ceil((RATE_LIMIT.windowMs - (now - lastAttemptTimeRef.current)) / 1000);
            setError(`Too many attempts. Please wait ${remainingTime} seconds.`);
            return false;
        }

        attemptCountRef.current++;
        lastAttemptTimeRef.current = now;
        return true;
    }, []);

    if (!isOpen) return null;

    const handleWithdraw = async () => {
        setError(null);

        // Security: Check authentication
        if (!authenticated) {
            setError('Please login to continue');
            return;
        }

        // Security: Rate limiting
        if (!checkRateLimit()) {
            return;
        }

        const amountValue = parseFloat(amount);

        // Security: Enhanced amount validation
        if (!amount || isNaN(amountValue) || amountValue <= 0) {
            setError('Invalid amount');
            return;
        }
        if (amountValue < MIN_WITHDRAWAL_AMOUNT) {
            setError(`Minimum withdrawal is $${MIN_WITHDRAWAL_AMOUNT}`);
            return;
        }
        if (amountValue > MAX_WITHDRAWAL_AMOUNT) {
            setError(`Maximum withdrawal is $${MAX_WITHDRAWAL_AMOUNT}`);
            return;
        }
        if (amountValue > availableBalance) {
            setError('Insufficient balance');
            return;
        }

        // Security: Address validation
        if (!isValidAddress(address, selectedChain.id)) {
            const errorMsg = selectedChain.id === 'solana'
                ? 'Invalid Solana Address (must be base58 format)'
                : selectedChain.id === 'sui'
                    ? 'Invalid Sui Address (must be 0x followed by 64 hex characters)'
                    : 'Invalid Wallet Address (must be valid EVM address)';
            setError(errorMsg);
            return;
        }

        const usdcAddress = USDC_ADDRESS_MAP[selectedChain.chainId];
        if (!usdcAddress) {
            setError('Unsupported network for USDC withdrawal');
            return;
        }

        setIsLoading(true);
        setStep('processing');

        try {
            // Security: Get Privy access token for dual authentication
            const privyToken = await getAccessToken();
            if (!privyToken) {
                throw new Error('Failed to get authentication token');
            }

            console.log('[Security] Initiating secure withdrawal with dual auth...');

            // 1. Backend: Initiate (Lock funds) - with Privy token for dual auth
            const initiateRes = await depositApi.initiateWithdrawal(
                amountValue,
                selectedChain.id,
                address,
                privyToken // Pass Privy token for backend verification
            );
            const { id: withdrawalId } = initiateRes;

            // 2. Privy: Send Transaction
            const wallet = wallets.find((w) => w.walletClientType === 'privy');
            if (!wallet) throw new Error('No embedded wallet found');

            // Switch chain if needed
            if (wallet.chainId !== `caip154:${selectedChain.chainId}`) {
                await wallet.switchChain(selectedChain.chainId);
            }

            // Get provider and create viem client
            const provider = await wallet.getEthereumProvider();
            const chainObj = selectedChain.id === 'base' ? base : mainnet;

            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: chainObj,
                transport: custom(provider)
            });

            // High Security: Use ERC-20 Transfer for USDC
            console.log(`Constructing secure USDC transaction for ${selectedChain.name}...`);

            // Construct ERC-20 Transfer Data
            const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
            const data = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [address as `0x${string}`, amountWei]
            });

            console.log('Sending transaction via viem...');

            const txHash = await walletClient.sendTransaction({
                to: usdcAddress as `0x${string}`,
                data: data,
                value: 0n,
                chain: chainObj
            });

            // 3. Backend: Confirm - with Privy token for dual auth
            await depositApi.confirmWithdrawal(withdrawalId, txHash, privyToken);

            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error('Withdrawal failed', err);
            setError(err.message || 'Withdrawal failed');
            setStep('input');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#1E1F25] rounded-3xl border border-gray-800 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1E1F25]">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Withdraw Assets</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {step === 'input' && (
                        <div className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3 ml-1">Select Network</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {CHAINS.map(chain => (
                                        <button
                                            key={chain.id}
                                            onClick={() => {
                                                setSelectedChain(chain);
                                                setAddress(''); // Clear address when chain changes
                                                setError(null);
                                            }}
                                            className={`relative group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${selectedChain.id === chain.id
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                                                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/80'
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/5 p-1.5 flex items-center justify-center">
                                                <img
                                                    src={chain.icon}
                                                    className="w-full h-full object-contain rounded-full"
                                                    alt={chain.name}
                                                />
                                            </div>
                                            <span className={`font-medium ${selectedChain.id === chain.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {chain.name}
                                            </span>
                                            {selectedChain.id === chain.id && (
                                                <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-500/50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3 ml-1">Amount</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-4 text-white text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button
                                            onClick={() => setAmount(availableBalance.toString())}
                                            className="px-3 py-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors uppercase tracking-wider"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <span className="text-xs text-gray-500">Available Balance</span>
                                    <span className="text-sm font-medium text-gray-300">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3 ml-1">Recipient Address</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                                        placeholder={getAddressPlaceholder(selectedChain.id)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 px-1">
                                    Only send on <span className="text-blue-400 font-medium">{selectedChain.name} Network</span>
                                </p>
                            </div>

                            <Button
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                onClick={handleWithdraw}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    'Confirm Withdrawal'
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                                <div className="w-20 h-20 bg-[#1E1F25] border border-blue-500/30 rounded-full flex items-center justify-center relative z-10">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Processing Transaction</h3>
                            <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed">
                                Please check your wallet and sign the transaction to complete the withdrawal.
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                                <div className="w-20 h-20 bg-[#1E1F25] border border-green-500/30 rounded-full flex items-center justify-center relative z-10">
                                    <ArrowRight className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">Withdrawal Successful</h3>
                            <p className="text-gray-400 text-sm">
                                Your funds are on the way! It may take a few minutes to appear in your wallet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
