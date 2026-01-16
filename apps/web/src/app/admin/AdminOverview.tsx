import { useEffect, useState } from 'react';
import { adminApi, DashboardStats, SystemAlert } from '../../services/adminApi';
import {
    Users,
    DollarSign,
    Activity,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Shield,
    Clock
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { motion } from 'motion/react';


// Mock chart data
const USER_GROWTH_DATA = [
    { name: 'Mon', users: 400 },
    { name: 'Tue', users: 300 },
    { name: 'Wed', users: 550 },
    { name: 'Thu', users: 450 },
    { name: 'Fri', users: 600 },
    { name: 'Sat', users: 750 },
    { name: 'Sun', users: 850 },
];

const VOLUME_DATA = [
    { name: 'Mon', volume: 24000 },
    { name: 'Tue', volume: 13980 },
    { name: 'Wed', volume: 98000 },
    { name: 'Thu', volume: 39080 },
    { name: 'Fri', volume: 48000 },
    { name: 'Sat', volume: 38000 },
    { name: 'Sun', volume: 43000 },
];

export function AdminOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, alertsData] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getSystemAlerts()
                ]);
                setStats(statsData);
                setAlerts(alertsData);
            } catch (error) {
                console.error('Failed to fetch admin data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-neutral-400">Real-time platform insights and critical alerts.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    System Operational
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers.toLocaleString() ?? '0'}
                    change="+12%"
                    isPositive={true}
                    icon={Users}
                    color="blue"
                />

                <StatsCard
                    title="Total Value Locked"
                    value={`$${(stats?.totalTvl ?? 0).toLocaleString()}`}
                    change="+5.2%"
                    isPositive={true}
                    icon={DollarSign}
                    color="green" // Green for money
                />

                <StatsCard
                    title="24h Volume"
                    value={`$${(stats?.totalVolume ?? 0).toLocaleString()}`}
                    change="-2.1%"
                    isPositive={false}
                    icon={Activity}
                    color="purple"
                />

                <StatsCard
                    title="Pending Withdrawals"
                    value={stats?.pendingWithdrawals.toString() ?? '0'}
                    change={stats && stats.pendingWithdrawals > 10 ? "High Load" : "Normal"}
                    isPositive={!(stats && stats.pendingWithdrawals > 10)}
                    icon={Clock}
                    color="orange"
                />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Charts Section */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Main Chart */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg">Transaction Volume</h3>
                            <select className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1 text-sm text-neutral-400 focus:outline-none">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>All Time</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={VOLUME_DATA}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                    <XAxis dataKey="name" stroke="#525252" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#525252" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Secondary Chart */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg">User Growth</h3>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={USER_GROWTH_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                                    <XAxis dataKey="name" stroke="#525252" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#262626' }}
                                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Column: Alerts & Activity */}
                <div className="space-y-6">

                    {/* System Alerts */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Shield size={18} className="text-red-500" />
                                Critical Alerts
                            </h3>
                            <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded-full">{alerts.filter(a => a.status === 'open').length} Open</span>
                        </div>

                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500">
                                    <Shield size={32} className="mx-auto mb-2 opacity-20" />
                                    No active alerts
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className={`p-4 rounded-xl border ${alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                                        alert.severity === 'warning' ? 'bg-orange-500/5 border-orange-500/20' :
                                            'bg-neutral-900 border-neutral-800'
                                        }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 mb-1">
                                                {alert.severity === 'critical' && <AlertTriangle size={14} className="text-red-500" />}
                                                <h4 className={`font-medium text-sm ${alert.severity === 'critical' ? 'text-red-400' :
                                                    alert.severity === 'warning' ? 'text-orange-400' : 'text-white'
                                                    }`}>{alert.title}</h4>
                                            </div>
                                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{alert.severity}</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 bg-black/20 p-2 rounded mt-2">{alert.description}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] text-neutral-600">
                                                {new Date(alert.createdAt).toLocaleTimeString()}
                                            </span>
                                            <button className="text-[10px] bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="w-full mt-4 py-2 text-xs font-medium text-neutral-500 hover:text-white transition-colors border-t border-neutral-800">
                            View All System Logs
                        </button>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                        <h3 className="font-semibold text-lg mb-4">Live Activity</h3>
                        <div className="space-y-3 relative">
                            <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-800"></div>
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="pl-6 relative">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                    <p className="text-sm text-neutral-300">User <span className="text-blue-400">@user_{i + 100}</span> placed a trade</p>
                                    <p className="text-xs text-neutral-500 mt-1">2 mins ago • Market #124</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Sub-component for Stats Card
function StatsCard({ title, value, change, isPositive, icon: Icon, color }: any) {
    const colorMap: any = {
        blue: "text-blue-500 bg-blue-500/10",
        green: "text-green-500 bg-green-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        orange: "text-orange-500 bg-orange-500/10",
    };

    return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-neutral-400">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">{value}</h3>
                </div>
                <div className={`p-2 rounded-xl ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                    }`}>
                    {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                    {change}
                </span>
                <span className="text-xs text-neutral-500">vs last week</span>
            </div>
        </div>
    );
}
