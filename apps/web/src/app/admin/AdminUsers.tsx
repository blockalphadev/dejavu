import { useEffect, useState } from 'react';
import { adminApi, AdminUser } from '../../services/adminApi';
import {
    MoreHorizontal,
    Search,
    Filter,
    Shield,
    CheckCircle,
    Ban,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await adminApi.getUsers(searchQuery);
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-neutral-400">View, manage, and monitor user accounts.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 w-full sm:w-64 transition-all"
                        />
                    </div>
                    <button className="p-2 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-neutral-500">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">No users found matching "{searchQuery}"</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-900/50 text-neutral-400 border-b border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Balance</th>
                                    <th className="px-6 py-4 font-medium text-center">Risk Score</th>
                                    <th className="px-6 py-4 font-medium">Joined</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`hover:bg-neutral-900/50 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-500/5' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center font-bold text-xs ring-1 ring-neutral-700">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.fullName}</div>
                                                    <div className="text-xs text-neutral-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            ${user.balance_usdc.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <RiskBadge score={user.riskScore} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-400 text-xs">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Detail Drawer (AnimatePresence) */}
            <AnimatePresence>
                {selectedUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-neutral-950 border-l border-neutral-800 z-50 overflow-y-auto p-6"
                        >
                            <div className="mb-8">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="mb-4 text-sm text-neutral-400 hover:text-white flex items-center gap-1"
                                >
                                    Close
                                </button>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">{selectedUser.fullName}</h2>
                                    <StatusBadge status={selectedUser.status} />
                                </div>
                                <p className="text-neutral-500">{selectedUser.email}</p>
                                <p className="text-xs font-mono text-neutral-600 mt-1">ID: {selectedUser.id}</p>
                            </div>

                            <div className="space-y-6">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                                        <p className="text-xs text-neutral-500 mb-1">Total Balance</p>
                                        <p className="text-xl font-mono font-bold">${selectedUser.balance_usdc.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                                        <p className="text-xs text-neutral-500 mb-1">Locked Amount</p>
                                        <p className="text-xl font-mono font-bold">${selectedUser.locked_usdc.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">Risk Assessment</h3>
                                        <RiskBadge score={selectedUser.riskScore} />
                                    </div>
                                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mt-2">
                                        <div
                                            className={`h-full ${selectedUser.riskScore > 75 ? 'bg-red-500' :
                                                    selectedUser.riskScore > 30 ? 'bg-orange-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${selectedUser.riskScore}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Based on login patterns, withdrawal velocity, and device fingerprints.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-sm mb-3">Login History</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-neutral-800">
                                            <span className="text-white">IP: 192.168.1.1</span>
                                            <span className="text-neutral-500">{new Date(selectedUser.lastLogin).toLocaleString()}</span>
                                        </div>
                                        {/* Mock */}
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-neutral-800">
                                            <span className="text-white">IP: 192.168.1.1</span>
                                            <span className="text-neutral-500">{new Date(Date.now() - 86400000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors">
                                        Reset Password / 2FA
                                    </button>
                                    {selectedUser.status === 'active' ? (
                                        <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-medium transition-colors">
                                            Suspend Account
                                        </button>
                                    ) : (
                                        <button className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/50 rounded-lg font-medium transition-colors">
                                            Reactivate Account
                                        </button>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'active') {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle size={12} /> Active</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><Ban size={12} /> Suspended</span>;
}

function RiskBadge({ score }: { score: number }) {
    if (score < 30) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><Shield size={12} /> Low Risk ({score})</span>;
    }
    if (score < 75) {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20"><AlertCircle size={12} /> Medium ({score})</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><Shield size={12} /> High Risk ({score})</span>;
}
