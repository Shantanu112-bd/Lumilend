import React, { useState, useEffect } from 'react';
import { Loader2, Coins, CheckCircle, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { requestLoan } from '../utils/soroban';
import { formatXLM, formatHash } from '../App';

export default function BorrowForm({ wallet, poolStats, onSuccess, showToast, hasActiveLoan }) {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState(14);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [txHash, setTxHash] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const availableLiquidity = Number(poolStats?.available) || 0;
    const isAmountTooHigh = Number(amount) > availableLiquidity;

    useEffect(() => {
        const numAmt = Number(amount) || 0;
        if (numAmt > availableLiquidity && availableLiquidity > 0) {
            setErrorMsg(`Pool only has ${formatXLM(availableLiquidity)} XLM available.`);
        } else if (numAmt !== 0 && (numAmt < 5 || numAmt > 100)) {
            setErrorMsg('Loan must be between 5 XLM and 100 XLM.');
        } else {
            setErrorMsg('');
        }
    }, [amount, availableLiquidity]);

    const numAmt = Number(amount) || 0;
    // According to contract: interest is Principal * RATE * Duration / 3650000 
    // Wait, the PRD says 5% fixed interest. The contract uses `(principal * rate_bps * duration_days) / (10000 * 365)`.
    // Actually the Figma prompt just says "Interest (5%)" without prorating visibly in the prompt summary text, 
    // but typically it means APY or Fixed 5%. The math from Figma prompt: Principal 20, Interest 1.00 XLM.
    // 1 XLM is exactly 5% of 20 XLM. So the Figma logic calculates 5% flat fee on the principal.
    const interest = numAmt * 0.05;
    const totalRepay = numAmt + interest;

    const dueTime = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    const dueString = dueTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const handleBorrow = async () => {
        if (!amount || Number(amount) < 5 || Number(amount) > 100 || errorMsg || hasActiveLoan) return;

        setIsSubmitting(true);
        setStatus('pending');
        try {
            const hash = await requestLoan(amount, duration);
            setTxHash(hash);
            setStatus('success');
            onSuccess();
            showToast(`Borrowed ${formatXLM(amount)} XLM successfully!`, 'success', hash);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Loan request failed', 'error');
            setStatus('idle');
            setIsSubmitting(false);
        }
    };

    if (hasActiveLoan && status !== 'success') {
        return (
            <div className="card text-center py-10">
                <div className="bg-danger/10 text-danger border border-danger/20 rounded-xl p-4 mb-6">
                    <AlertTriangle className="mx-auto text-danger w-8 h-8 mb-2" />
                    <h3 className="font-semibold mb-1">Active Loan Exists</h3>
                    <p className="text-sm">You already have an active loan. Repay it before borrowing again.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="card text-center p-10 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-success w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-textPrimary mb-2">Loan Approved!</h3>
                <p className="text-textSecondary mb-6">{formatXLM(amount)} XLM has been sent to your wallet.</p>

                <div className="bg-background rounded-xl p-4 mb-8 border border-borderCol">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-textSecondary">Transaction</span>
                        <a
                            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent font-mono flex items-center gap-1 hover:underline"
                        >
                            {formatHash(txHash)} <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onSuccess} className="btn-primary flex-1">
                        View My Loan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl relative overflow-hidden card p-8">
            <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-4 flex items-center gap-3 mb-6 font-medium">
                <Info size={20} className="w-6 shrink-0" />
                <div className="flex-1 text-sm">
                    {formatXLM(availableLiquidity)} XLM available to borrow
                </div>
                <div className="text-xs bg-primary text-white px-2 py-1 rounded font-bold tracking-wider uppercase border border-primary">
                    5% Fixed APR
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium text-textSecondary mb-2 block">Loan Amount</label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className={`input text-xl font-semibold pr-16 ${errorMsg ? 'border-danger focus:ring-danger focus:border-danger' : ''} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                            XLM
                        </div>
                    </div>

                    <div className="flex justify-between mt-2">
                        <p className={`text-xs ${errorMsg ? 'text-danger' : 'text-textMuted'}`}>
                            {errorMsg || 'Min: 5 XLM · Max: 100 XLM'}
                        </p>

                        <div className="flex gap-2">
                            <button onClick={() => setAmount(10)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">10 XLM</button>
                            <button onClick={() => setAmount(25)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">25 XLM</button>
                            <button onClick={() => setAmount(50)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">50 XLM</button>
                            <button onClick={() => setAmount(100)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">100 XLM</button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-textSecondary mb-4 block">Repayment Period</label>
                    <div className="px-2">
                        <input
                            type="range"
                            min="7"
                            max="30"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-textSecondary font-medium px-1">
                        <span>7 days</span>
                        <span className="text-base text-textPrimary font-bold">{duration} days</span>
                        <span>30 days</span>
                    </div>
                </div>

                <div className="bg-background rounded-xl p-6 border border-borderCol shadow-inner mt-4">
                    <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Loan Summary</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Principal</span>
                            <span className="text-textPrimary font-medium">{formatXLM(numAmt)} XLM</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Interest (5%)</span>
                            <span className="text-warning font-medium">{formatXLM(interest)} XLM</span>
                        </div>
                        <div className="h-px bg-borderCol w-full my-2"></div>
                        <div className="flex justify-between items-center bg-surface/50 p-2 rounded -mx-2 px-3">
                            <span className="text-textSecondary">Total Repayment</span>
                            <span className="text-xl font-bold text-textPrimary">{formatXLM(totalRepay)} XLM</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-textSecondary">Due Date</span>
                            <span className="text-primary font-bold">{dueString}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-3 mt-4 text-warning">
                    <AlertTriangle size={18} className="shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">
                        Ensure you can repay by the due date. Defaulted loans are recorded on-chain.
                    </p>
                </div>

                <div className="pt-2">
                    {status === 'pending' && (
                        <p className="text-center text-xs text-textSecondary mb-3 animate-pulse">Waiting for Freighter confirmation...</p>
                    )}
                    <button
                        onClick={handleBorrow}
                        disabled={isSubmitting || !amount || Number(amount) < 5 || Number(amount) > 100 || !!errorMsg}
                        className={`btn-primary w-full h-[52px] text-lg ${isSubmitting ? 'bg-primary/50 text-white/70' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Processing...
                            </>
                        ) : (
                            'Request Loan'
                        )}
                    </button>
                    {errorMsg && !isAmountTooHigh && (
                        <p className="text-center text-danger text-xs mt-3 font-medium">{errorMsg}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
