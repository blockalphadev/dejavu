
import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { depositApi } from '../../services/api';
import { parseUnits, encodeFunctionData, isAddress, createWalletClient, custom } from 'viem';
import { base, mainnet } from 'viem/chains';

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
    { id: 'ethereum', name: 'Ethereum', icon: '/images/coin/ethereum.png', chainId: 1 },
    { id: 'solana', name: 'Solana', icon: '/images/coin/solana.png', chainId: 900 },
    { id: 'sui', name: 'Sui', icon: '/images/coin/sui.png', chainId: 901 },
];

export function WithdrawModal({ isOpen, onClose, availableBalance, onSuccess }: WithdrawModalProps) {
    const { wallets } = useWallets();
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState(CHAINS[1]); // Default to Base
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleWithdraw = async () => {
        setError(null);
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Invalid amount');
            return;
        }
        if (parseFloat(amount) > availableBalance) {
            setError('Insufficient balance');
            return;
        }
        if (!address || !isAddress(address)) {
            setError('Invalid Wallet Address');
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
            // 1. Backend: Initiate (Lock funds)
            const initiateRes = await depositApi.initiateWithdrawal(
                parseFloat(amount),
                selectedChain.id,
                address
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

            // 3. Backend: Confirm
            await depositApi.confirmWithdrawal(withdrawalId, txHash);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#1E1F25] rounded-2xl border border-gray-800 p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-6">Withdraw Assets</h2>

                {step === 'input' && (
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Network</label>
                            <div className="flex gap-2">
                                {CHAINS.map(chain => (
                                    <button
                                        key={chain.id}
                                        onClick={() => setSelectedChain(chain)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${selectedChain.id === chain.id
                                            ? 'bg-blue-600/20 border-blue-500 text-white'
                                            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                                            }`}
                                    >
                                        <img src={chain.icon} className="w-5 h-5 rounded-full" />
                                        {chain.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                />
                                <button
                                    onClick={() => setAmount(availableBalance.toString())}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase"
                                >
                                    Max
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Available: ${availableBalance.toFixed(2)}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">To Address</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                placeholder="0x..."
                            />
                        </div>

                        <Button
                            className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                            onClick={handleWithdraw}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Withdrawal'}
                        </Button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Processing Transaction</h3>
                        <p className="text-gray-400 text-sm max-w-[200px]">Please sign the transaction in your wallet to complete the withdrawal.</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <ArrowRight className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Withdrawal Successful</h3>
                        <p className="text-gray-400 text-sm">Your funds are on the way!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
