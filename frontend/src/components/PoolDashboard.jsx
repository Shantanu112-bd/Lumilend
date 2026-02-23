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
            <div className="flex justify-between items-center mb-6 border-b border-borderCol pb-4">
                <h2 className="text-2xl font-bold text-textPrimary">
                    Pool Overview
                </h2>
                <button
                    onClick={onRefresh}
                    className="text-xs text-textSecondary hover:text-textPrimary transition-colors bg-surface/50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-borderCol/50 hover:bg-surface"
                >
                    <Loader2 size={12} className="opacity-50" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card rounded-xl border-t-[3px] border-t-primary/80 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden group">
                    <div className="text-sm text-textSecondary font-medium mb-1">Total Pool Size</div>
                    <div className="text-3xl font-bold text-textPrimary mb-3">{formatXLM(deposited)} <span className="text-xl text-textMuted font-normal">XLM</span></div>
                    <div className="flex items-center gap-1 text-xs text-success font-medium bg-success/10 w-fit px-2 py-1 rounded">
                        <TrendingUp size={12} /> +12.5% this week
                    </div>
                </div>

                <div className="card rounded-xl border-t-[3px] border-t-accent/80 bg-gradient-to-b from-accent/5 to-transparent relative overflow-hidden">
                    <div className="text-sm text-textSecondary font-medium mb-1">Currently Lent Out</div>
                    <div className="text-3xl font-bold text-textPrimary mb-3">{formatXLM(lent)} <span className="text-xl text-textMuted font-normal">XLM</span></div>
                    <div className="text-xs text-textSecondary font-medium">
                        {utilization}% utilization
                    </div>
                </div>

                <div className="card rounded-xl border-t-[3px] border-t-success/80 bg-gradient-to-b from-success/5 to-transparent relative overflow-hidden">
                    <div className="text-sm text-textSecondary font-medium mb-1">Available to Borrow</div>
                    <div className="text-3xl font-bold text-textPrimary mb-3">{formatXLM(available)} <span className="text-xl text-textMuted font-normal">XLM</span></div>
                    <div className="inline-flex text-xs text-success font-semibold px-2 py-0.5 rounded border border-success/30 bg-success/10 uppercase tracking-wider">
                        Liquidity Available
                    </div>
                </div>

                <div className="card rounded-xl border-t-[3px] border-t-primary/80 relative overflow-hidden">
                    <div className="text-sm text-textSecondary font-medium mb-1">Fixed APY</div>
                    <div className="text-3xl font-bold text-textPrimary mb-3">{rate}% </div>
                    <div className="inline-flex text-xs text-primary font-semibold px-2 py-0.5 rounded border border-primary/30 bg-primary/10 uppercase tracking-wider">
                        STABLE
                    </div>
                </div>
            </div>
        </div>
    );
}
