import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Wallet,
    ShieldAlert,
    LogOut,
    Menu,
    X,
    Bell,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
}

export function AdminLayout({ children, activePage, onNavigate, onLogout }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'finance', label: 'Finance & Withdrawals', icon: Wallet },
        { id: 'security', label: 'Security Center', icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex font-sans">
            {/* Sidebar - Desktop */}
            <motion.div
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="hidden lg:flex flex-col border-r border-neutral-800 bg-neutral-950 sticky top-0 h-screen z-20"
            >
                <div className="p-6 flex items-center justify-between">
                    <AnimatePresence mode='wait'>
                        {isSidebarOpen ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-xl tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                            >
                                DEJAVU ADMIN
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-xl text-blue-500"
                            >
                                D
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-1 py-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${activePage === item.id
                                    ? 'bg-blue-600/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-600/20'
                                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                                }`}
                        >
                            {activePage === item.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-50"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon size={20} className={activePage === item.id ? "text-blue-400" : "group-hover:text-blue-400 transition-colors"} />
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-medium"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isSidebarOpen && 'justify-center'
                            }`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-900">
                {/* Top Header */}
                <header className="h-16 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-10 px-4 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-neutral-400 hover:text-white"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg">Admin</span>
                    </div>

                    <div className="hidden lg:flex items-center text-sm text-neutral-400">
                        <span className="text-neutral-500">Dashboard</span>
                        <span className="mx-2">/</span>
                        <span className="text-white font-medium capitalize">{activePage.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="bg-neutral-900 border border-neutral-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 w-64 transition-all"
                            />
                        </div>

                        <button className="relative p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-neutral-950"></span>
                        </button>

                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-neutral-800">
                            S
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-neutral-950 border-r border-neutral-800 z-50 lg:hidden flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-neutral-800">
                                <span className="font-bold text-xl tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    DEJAVU ADMIN
                                </span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 -mr-2 text-neutral-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onNavigate(item.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activePage === item.id
                                                ? 'bg-blue-600/10 text-blue-400 shadow-lg shadow-blue-900/10'
                                                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                                            }`}
                                    >
                                        <item.icon size={20} />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="p-4 border-t border-neutral-800">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
