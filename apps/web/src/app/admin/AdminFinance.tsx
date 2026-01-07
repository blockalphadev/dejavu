import { useEffect, useState } from 'react';
import { adminApi, WithdrawalRequest } from '../../services/adminApi';
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminFinance() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);

    const fetchWithdrawals = async () => {
        try {
            const data = await adminApi.getPendingWithdrawals();
            setWithdrawals(data);
        } catch (error) {
            console.error('Failed to fetch withdrawals', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleApprove = async () => {
        if (!selectedWithdrawal) return;
        await adminApi.approveWithdrawal(selectedWithdrawal.id);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
    };

    const handleReject = async () => {
        if (!selectedWithdrawal) return;
        await adminApi.rejectWithdrawal(selectedWithdrawal.id, "Admin rejected");
        setSelectedWithdrawal(null);
        fetchWithdrawals();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <h1 className="text-2xl font-bold tracking-tight">Financial & Withdrawals</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-sm text-neutral-400">Total Pending</p>
                    <div className="text-2xl font-bold mt-1 text-white">${withdrawals.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-sm text-neutral-400">Pending Requests</p>
                    <div className="text-2xl font-bold mt-1 text-white">{withdrawals.length}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <p className="text-sm text-neutral-400">System Balance</p>
                    <div className="text-2xl font-bold mt-1 text-green-500">$4,500,000</div>
                </div>
            </div>

            {/* Pending Withdrawals */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Clock size={18} className="text-orange-500" />
                        Pending Adjustments & Withdrawals
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-neutral-500">Loading withdrawals...</div>
                ) : withdrawals.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        <CheckCircle size={32} className="mx-auto mb-2 text-green-500/50" />
                        No pending withdrawals. All caught up!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-900/50 text-neutral-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Request Date</th>
                                    <th className="px-6 py-3 font-medium">User</th>
                                    <th className="px-6 py-3 font-medium">Amount</th>
                                    <th className="px-6 py-3 font-medium">Chain</th>
                                    <th className="px-6 py-3 font-medium text-center">Risk Score</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-neutral-900/50 transition-colors">
                                        <td className="px-6 py-3 text-neutral-400">
                                            {new Date(w.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-white">{w.userEmail}</div>
                                            <div className="text-xs text-neutral-500">ID: {w.userId}</div>
                                        </td>
                                        <td className="px-6 py-3 font-mono">
                                            ${w.amount.toLocaleString()} {w.currency}
                                        </td>
                                        <td className="px-6 py-3 flex items-center gap-2">
                                            <span className="bg-neutral-800 text-xs px-2 py-1 rounded">{w.chain}</span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${w.riskScore > 75 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {w.riskScore} / 100
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => setSelectedWithdrawal(w)}
                                                className="text-blue-400 hover:text-blue-300 font-medium text-xs bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedWithdrawal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedWithdrawal(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-1">Review Withdrawal</h3>
                                <p className="text-neutral-400 text-sm">Please verify details before approving.</p>

                                <div className="mt-6 space-y-4">

                                    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-neutral-400">Amount</span>
                                            <span className="text-xl font-bold font-mono">${selectedWithdrawal.amount.toLocaleString()} <span className="text-sm font-normal text-neutral-500">{selectedWithdrawal.currency}</span></span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-800">
                                            <div className="text-xs">
                                                <span className="text-neutral-500 block mb-1">Destination Chain</span>
                                                <span className="bg-neutral-800 px-2 py-1 rounded text-white">{selectedWithdrawal.chain}</span>
                                            </div>
                                            <ArrowRight size={16} className="text-neutral-600 mt-4" />
                                            <div className="flex-1 text-xs">
                                                <span className="text-neutral-500 block mb-1">To Address</span>
                                                <span className="font-mono text-white break-all">{selectedWithdrawal.toAddress}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedWithdrawal.riskScore > 50 && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <h4 className="text-red-500 font-medium text-sm">High Risk Transaction</h4>
                                                <p className="text-red-400/70 text-xs mt-1">
                                                    This user has a risk score of {selectedWithdrawal.riskScore}. Check for suspicious login activity or recent password changes.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <button
                                            onClick={handleReject}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 text-red-500 hover:bg-neutral-800 hover:text-red-400 font-medium transition-colors"
                                        >
                                            <XCircle size={18} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-medium shadow-lg shadow-blue-500/20 transition-colors"
                                        >
                                            <CheckCircle size={18} />
                                            Approve Transfer
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
