import { useEffect, useState } from 'react';
import { adminApi, SuspiciousActivity, SystemAlert } from '../../services/adminApi';
import {
    ShieldAlert,
    MapPin,
    Lock,
    AlertOctagon,
    CheckCircle,
    Activity
} from 'lucide-react';

export function AdminSecurity() {
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [suspicious, setSuspicious] = useState<SuspiciousActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [alertsData, suspiciousData] = await Promise.all([
                    adminApi.getSystemAlerts(),
                    adminApi.getSuspiciousActivity()
                ]);
                setAlerts(alertsData);
                setSuspicious(suspiciousData);
            } catch (error) {
                console.error('Failed to fetch security data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Security Center</h1>
                    <p className="text-neutral-400">Monitor threats, manage access, and review logs.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm hover:bg-neutral-800 transition-colors">
                    <Lock size={16} />
                    Audit Logs
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Suspicious Activity Feed */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Activity size={18} className="text-orange-500" />
                            Suspicious Activity
                        </h2>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full font-bold">
                            {suspicious.length} Pending
                        </span>
                    </div>

                    <div className="divide-y divide-neutral-800">
                        {suspicious.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-neutral-900/50 transition-colors group cursor-pointer">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-500/10 p-1.5 rounded-lg text-red-500">
                                            <AlertOctagon size={16} />
                                        </span>
                                        <span className="font-mono text-sm text-red-400">{item.type}</span>
                                    </div>
                                    <span className="text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString()}</span>
                                </div>

                                <p className="text-sm text-neutral-300 mb-3">{item.description}</p>

                                <div className="flex items-center gap-4 text-xs text-neutral-500 bg-black/20 p-2 rounded">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        {item.ipAddress}
                                    </div>
                                    <div className="w-px h-3 bg-neutral-700"></div>
                                    <div>User ID: {item.userId}</div>
                                    <div className="ml-auto font-bold text-orange-500">Risk Score: {item.riskScore}</div>
                                </div>

                                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="flex-1 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-200">
                                        Investigate
                                    </button>
                                    <button className="flex-1 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded">
                                        Block IP
                                    </button>
                                </div>
                            </div>
                        ))}
                        {suspicious.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">No suspicious activity detected.</div>
                        )}
                    </div>
                </div>

                {/* System Alerts */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ShieldAlert size={18} className="text-blue-500" />
                            System Alerts
                        </h2>
                    </div>
                    <div className="divide-y divide-neutral-800">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="p-4 hover:bg-neutral-900/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <h3 className={`font-medium text-sm ${alert.severity === 'critical' ? 'text-red-400' :
                                        alert.severity === 'warning' ? 'text-orange-400' : 'text-white'
                                        }`}>
                                        {alert.title}
                                    </h3>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                        alert.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-1 mb-2">{alert.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-600">{new Date(alert.createdAt).toLocaleString()}</span>
                                    {alert.status === 'open' ? (
                                        <button className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                            <CheckCircle size={10} /> Mark Resolved
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-green-500 flex items-center gap-1">
                                            <CheckCircle size={10} /> Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">No system alerts.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* IP Blacklist Preview */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-4">Blacklisted IPs</h3>
                <div className="flex flex-wrap gap-2">
                    {/* Mock */}
                    {['192.168.1.55', '10.20.30.40', '172.16.0.1'].map(ip => (
                        <div key={ip} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {ip}
                            <button className="hover:text-white ml-1">x</button>
                        </div>
                    ))}
                    <button className="text-xs text-blue-500 hover:text-blue-400 font-medium px-2">+ Add IP</button>
                </div>
            </div>

        </div>
    );
}
