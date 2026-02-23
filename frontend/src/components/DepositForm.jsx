import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { depositXlm } from '../utils/soroban';
import { formatXLM, formatHash } from '../App';

export default function DepositForm({ wallet, balance, poolStats, onSuccess, showToast }) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [txHash, setTxHash] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const maxAmount = Number(balance) > 1 ? Number(balance) - 1 : 0; // Reserve 1 XLM for fees

    // Calc preview
    const numAmt = Number(amount) || 0;
    const currentPool = Number(poolStats?.total_deposited) || 0;
    const newPoolSize = currentPool + numAmt;
    const newShare = newPoolSize > 0 ? ((numAmt / newPoolSize) * 100).toFixed(4) : 0;
    const estYield = numAmt * 0.05; // 5% APY

    useEffect(() => {
        if (numAmt > maxAmount && maxAmount > 0) {
            setErrorMsg(`Insufficient balance. You have ${formatXLM(maxAmount)} XLM available.`);
        } else if (numAmt < 1 && amount !== '') {
            setErrorMsg('Minimum deposit is 1.00 XLM');
        } else {
            setErrorMsg('');
        }
    }, [amount, maxAmount]);

    const handleQuickSelect = (percent) => {
        const val = maxAmount * percent;
        setAmount(val > 0 ? val.toFixed(2) : '');
    };

    const handleDeposit = async () => {
        if (!amount || numAmt <= 0) return;

        setIsSubmitting(true);
        setStatus('pending');
        try {
            const hash = await depositXlm(amount);
            setTxHash(hash);
            setStatus('success');
            onSuccess();
            showToast(`Deposited ${formatXLM(amount)} XLM successfully`, 'success', hash);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Deposit failed', 'error');
            setStatus('idle');
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setAmount('');
        setStatus('idle');
        setIsSubmitting(false);
    };

    if (status === 'success') {
        return (
            <div className="card text-center p-10 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-success w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-textPrimary mb-2">Deposit Successful!</h3>
                <p className="text-textSecondary mb-6">{formatXLM(amount)} XLM added to the pool.</p>

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
                    <button onClick={handleReset} className="btn-primary flex-1">
                        Deposit More
                    </button>
                    <button onClick={onSuccess} className="btn-ghost flex-1">
                        View Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-surface relative overflow-hidden">
            <div className="flex justify-between items-end mb-4 border-b border-borderCol pb-4">
                <span className="text-sm font-medium text-textSecondary">Available Balance</span>
                <span className="text-xl font-bold text-textPrimary">{formatXLM(balance)} <span className="text-sm text-textMuted font-normal">XLM</span></span>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-textSecondary">Deposit Amount</label>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className={`input text-xl font-semibold pr-16 ${errorMsg ? 'border-danger focus:ring-danger focus:border-danger' : ''} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs">
                            XLM
                        </div>
                    </div>

                    <div className="flex justify-between mt-2">
                        <p className={`text-xs ${errorMsg ? 'text-danger' : 'text-textMuted'}`}>
                            {errorMsg || `Min: 1 XLM · Max: ${formatXLM(maxAmount)} XLM`}
                        </p>

                        <div className="flex gap-2">
                            <button onClick={() => handleQuickSelect(0.25)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">25%</button>
                            <button onClick={() => handleQuickSelect(0.5)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">50%</button>
                            <button onClick={() => handleQuickSelect(0.75)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">75%</button>
                            <button onClick={() => handleQuickSelect(1)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">MAX</button>
                        </div>
                    </div>
                </div>

                <div className="bg-background rounded-xl p-5 border border-borderCol">
                    <h4 className="text-sm font-semibold text-textPrimary mb-4">After Deposit</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-textSecondary">New Pool Size</span>
                            <span className="text-textPrimary font-medium">{formatXLM(newPoolSize)} XLM</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Your Share</span>
                            <span className="text-textPrimary font-medium">{newShare}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Est. Annual Yield</span>
                            <span className="text-success font-medium">+{formatXLM(estYield)} XLM <span className="text-xs opacity-70">(5% APY)</span></span>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    {status === 'pending' && (
                        <p className="text-center text-xs text-textSecondary mb-3 animate-pulse">Waiting for Freighter confirmation...</p>
                    )}
                    <button
                        onClick={handleDeposit}
                        disabled={isSubmitting || !amount || Number(amount) < 1 || !!errorMsg}
                        className={`btn-primary w-full h-[52px] text-lg ${isSubmitting ? 'bg-primary/50 text-white/70' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Processing...
                            </>
                        ) : (
                            'Deposit XLM'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
