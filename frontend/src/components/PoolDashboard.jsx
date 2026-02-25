import React from 'react';
import { Loader2, TrendingUp, Vault, Coins, ArrowUpFromLine } from 'lucide-react';
import { formatXLM } from '../App';

export default function PoolDashboard({ stats, onRefresh }) {
    if (!stats) {
        return (
            <div className="w-full mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-8 bg-surface/50 rounded animate-shimmer w-48"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card h-28 bg-surface/80 rounded-xl animate-shimmer"></div>
                    ))}
                </div>
            </div>
        );
    }

    const deposited = Number(stats.total_deposited) || 0;
    const lent = Number(stats.total_lent) || 0;
    const available = Number(stats.available) || 0;
    const rate = (Number(stats.interest_rate_bps) / 100).toFixed(2);

    // Derived sub-metrics
    const utilization = deposited > 0 ? ((lent / deposited) * 100).toFixed(1) : 0;

    return (
        <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Pool Statistics
                </h2>
                <button
                    onClick={onRefresh}
                    className="text-xs text-textSecondary hover:text-white transition-all bg-white/5 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(43,75,238,0.3)]"
                >
                    <Loader2 size={14} className="opacity-70" /> Refresh
                </button>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                {/* Background ambient glow for the grid */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                <div className="card border border-white/10 bg-background/60 backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(43,75,238,0.2)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all duration-500 group-hover:scale-150"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>

                    <div className="text-sm text-textSecondary font-medium mb-2 relative z-10 flex items-center justify-between">
                        Total Value Locked
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Vault size={14} />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-white mb-4 relative z-10 tracking-tight">{formatXLM(deposited)} <span className="text-xl text-primary font-medium">XLM</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium w-fit group-hover:text-white transition-colors">
                        <TrendingUp size={14} /> <span className="tracking-wide uppercase">All-time High</span>
                    </div>
                </div>

                <div className="card border border-white/10 bg-background/60 backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-accent/50 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(139,92,246,0.2)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[60px] group-hover:bg-accent/30 transition-all duration-500 group-hover:scale-150"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none"></div>

                    <div className="text-sm text-textSecondary font-medium mb-2 relative z-10 flex items-center justify-between">
                        Currently Lent Out
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                            <ArrowUpFromLine size={14} />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-white mb-4 relative z-10 tracking-tight">{formatXLM(lent)} <span className="text-xl text-accent font-medium">XLM</span></div>
                    <div className="text-xs text-accent font-medium tracking-wide uppercase">
                        {utilization}% utilization
                    </div>
                </div>

                <div className="card shadow-glass border border-white/10 bg-background/60 backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-success/50 transition-all duration-500">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-success/20 rounded-full blur-[60px] group-hover:bg-success/30 transition-all duration-500 group-hover:scale-150"></div>

                    <div className="text-sm text-textSecondary font-medium mb-2 relative z-10">Available to Borrow</div>
                    <div className="text-3xl font-bold text-white mb-3 relative z-10">{formatXLM(available)} <span className="text-xl text-success font-medium">XLM</span></div>
                    <div className="inline-flex text-[10px] text-success font-bold px-2.5 py-1 rounded-full border border-success/30 bg-success/10 uppercase tracking-widest relative z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        High Liquidity
                    </div>
                </div>

                <div className="card shadow-glass border border-white/10 bg-background/60 backdrop-blur-2xl rounded-2xl relative overflow-hidden group hover:border-warning/50 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-warning/20 rounded-full blur-[60px] group-hover:bg-warning/30 transition-all duration-500 group-hover:scale-150"></div>

                    <div className="text-sm text-textSecondary font-medium mb-2 relative z-10">Fixed APY</div>
                    <div className="text-3xl font-bold text-white mb-3 relative z-10 flex items-center gap-1">{rate}% <TrendingUp size={16} className="text-warning" /></div>
                    <div className="inline-flex text-[10px] text-warning font-bold px-2.5 py-1 rounded-full border border-warning/30 bg-warning/10 uppercase tracking-widest relative z-10 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        STABLE RATE
                    </div>
                </div>
            </div>
        </div>
    );
}
