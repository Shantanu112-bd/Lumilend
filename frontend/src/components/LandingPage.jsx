import React from 'react';
import { Wallet, Coins, Vault, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatXLM } from '../App';

export default function LandingPage({ onConnect, poolStats }) {
    return (
        <div className="min-h-screen bg-background text-textPrimary font-sans">
            <header className="h-[72px] border-b border-borderCol flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-accent/20">
                        <Coins size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden sm:block">LumiLend</span>
                    <div className="px-2 py-0.5 bg-success/20 text-success text-[10px] font-bold rounded-full uppercase tracking-wider ml-2 border border-success/30">Testnet</div>
                </div>

                <button onClick={onConnect} className="btn-primary space-x-2" style={{ minHeight: '44px' }}>
                    <Wallet size={18} />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                </button>
            </header>

            <main>
                {/* Hero Section */}
                <section className="pt-[80px] pb-16 px-4 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl md:text-5xl font-bold text-textPrimary mb-6 leading-tight">
                        Micro-Lending on <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Stellar</span>
                    </h1>
                    <p className="text-xl text-textSecondary mb-10 max-w-2xl mx-auto leading-relaxed">
                        Deposit XLM to earn yield. Borrow with fixed rates. No banks. No intermediaries. Just code.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
                        <button onClick={onConnect} className="btn-primary w-full sm:w-auto px-8 py-3 text-lg h-auto">
                            Start Lending
                        </button>
                        <button onClick={onConnect} className="btn-ghost w-full sm:w-auto px-8 py-3 text-lg h-auto">
                            Borrow XLM
                        </button>
                    </div>
                    <div className="inline-flex items-center justify-center gap-2 bg-surface border border-borderCol px-4 py-2 rounded-full text-sm text-textSecondary">
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        Powered by Stellar Testnet
                    </div>
                </section>

                {/* Pool Stats */}
                <section className="px-4 max-w-[1440px] mx-auto mb-24">
                    <div className="card w-full p-8 bg-surface/80 border-t-2 border-t-primary/50 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                            <StatItem title="Total Pool Size" value={formatXLM(poolStats?.total_deposited)} />
                            <StatItem title="Total Lent Out" value={formatXLM(poolStats?.total_lent)} />
                            <StatItem title="Available to Borrow" value={formatXLM(poolStats?.available)} />
                            <StatItem title="Interest Rate" value="5.00%" badge="FIXED APY" />
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section className="px-4 max-w-6xl mx-auto pb-32">
                    <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ArrowDownToLine size={32} className="text-primary" />}
                            title="Deposit & Earn"
                            desc="Add XLM to the shared pool. Earn 5% interest paid by borrowers automatically. Withdraw anytime there is available liquidity."
                        />
                        <FeatureCard
                            icon={<Coins size={32} className="text-accent" />}
                            title="Borrow Instantly"
                            desc="Request XLM loans from 5 to 100 XLM. Fixed 5% interest. Repay on-chain before your due date."
                        />
                        <FeatureCard
                            icon={<Wallet size={32} className="text-success" />}
                            title="Built on Stellar"
                            desc="Transactions cost ~0.00001 XLM. 3–5 second finality. All logic enforced by Soroban smart contracts."
                        />
                    </div>
                </section>
            </main>

            <footer className="border-t border-borderCol py-8 text-center text-textSecondary text-sm">
                <p>LumiLend &copy; 2026 — Stellar Testnet — Antigravity Level 3</p>
            </footer>
        </div>
    );
}

function StatItem({ title, value, badge }) {
    return (
        <div className="flex flex-col">
            <span className="text-textSecondary text-sm font-medium mb-2">{title}</span>
            <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-textPrimary">{value} {badge ? '' : <span className="text-lg text-textMuted font-normal">XLM</span>}</span>
                {badge && <span className="px-2 py-1 bg-success/10 text-success border border-success/30 rounded text-xs font-bold tracking-wider">{badge}</span>}
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="card bg-surface/50 border-borderCol/50 hover:bg-surface transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-background border border-borderCol flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-textPrimary mb-3">{title}</h3>
            <p className="text-textSecondary leading-relaxed">{desc}</p>
        </div>
    );
}
