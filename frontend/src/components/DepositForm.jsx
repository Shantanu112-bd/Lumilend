import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, ExternalLink, ArrowLeft, AlertCircle } from 'lucide-react';
import { depositXlm } from '../utils/soroban';
import { formatXLM, formatHash } from '../App';
import ConfirmationModal from './ConfirmationModal';

function FieldError({ error }) {
    if (!error) return null;
    return (
        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
        </p>
    );
}

export default function DepositForm({ wallet, balance, poolStats, onSuccess, showToast }) {
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');

    // Modal & status state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [txHash, setTxHash] = useState('');

    // Validation state
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({ amount: '', memo: '' });

    const maxAmount = Number(balance) > 1 ? Number(balance) - 1 : 0; // Reserve 1 XLM for fees

    // Calc preview
    const numAmt = Number(amount) || 0;
    const currentPool = Number(poolStats?.total_deposited) || 0;
    const newPoolSize = currentPool + numAmt;
    const newShare = newPoolSize > 0 ? ((numAmt / newPoolSize) * 100).toFixed(4) : 0;
    const estYield = numAmt * 0.05; // 5% APY
    const newWalletBalance = parseFloat(balance) - numAmt;

    const validateAmount = (val) => {
        const num = parseFloat(val);
        if (!val) return 'Amount is required.';
        if (isNaN(num) || num <= 0) return 'Enter a valid positive amount.';
        if (num < 1) return 'Minimum deposit is 1 XLM.';
        if (num > parseFloat(balance)) return `Insufficient balance. You have ${parseFloat(balance).toFixed(2)} XLM.`;
        return '';
    };

    const validateMemo = (val) => {
        if (val.length > 28) return 'Memo must be 28 characters or less.';
        return '';
    };

    const validateDepositForm = () => {
        const newErrors = {
            amount: validateAmount(amount),
            memo: validateMemo(memo)
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(e => e === '');
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === 'amount') setErrors(prev => ({ ...prev, amount: validateAmount(amount) }));
        if (field === 'memo') setErrors(prev => ({ ...prev, memo: validateMemo(memo) }));
    };

    const handleChange = (field, value) => {
        if (field === 'amount') setAmount(value);
        if (field === 'memo') setMemo(value);
        if (touched[field]) {
            if (field === 'amount') setErrors(prev => ({ ...prev, amount: validateAmount(value) }));
            if (field === 'memo') setErrors(prev => ({ ...prev, memo: validateMemo(value) }));
        }
    };

    const handleQuickSelect = (percent) => {
        const val = maxAmount * percent;
        const newAmt = val > 0 ? val.toFixed(2) : '';
        handleChange('amount', newAmt);
    };

    const handleConfirmClick = () => {
        setTouched({ amount: true, memo: true });
        if (validateDepositForm()) {
            setShowConfirmModal(true);
        }
    };

    const handleConfirmedDeposit = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setStatus('pending');
        try {
            // memo not currently passed to depositXlm from soroban.js, so we invoke it as usual
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
        setMemo('');
        setTouched({});
        setErrors({ amount: '', memo: '' });
        setStatus('idle');
        setIsSubmitting(false);
    };

    const getBorderClass = (field, value) => {
        if (touched[field] && errors[field]) return 'border-danger focus:ring-danger';
        if (touched[field] && !errors[field] && value !== '') return 'border-success focus:ring-success/50';
        return 'border-borderCol focus:border-primary focus:ring-primary/50';
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

                {/* Amount Input */}
                <div className="space-y-1">
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-textSecondary">Deposit Amount <span className="text-danger">*</span></label>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className={`input text-xl font-semibold pr-16 w-full ${getBorderClass('amount', amount)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            onBlur={() => handleBlur('amount')}
                            disabled={isSubmitting}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs">
                            XLM
                        </div>
                    </div>

                    <div className="flex justify-between mt-2 items-start">
                        <div className="flex-1">
                            {touched.amount && errors.amount ? (
                                <FieldError error={errors.amount} />
                            ) : (
                                <p className="text-xs text-textMuted mt-1">
                                    Min: 1 XLM · Max: {formatXLM(maxAmount)} XLM
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => handleQuickSelect(0.25)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">25%</button>
                            <button onClick={() => handleQuickSelect(0.5)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">50%</button>
                            <button onClick={() => handleQuickSelect(0.75)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">75%</button>
                            <button onClick={() => handleQuickSelect(1)} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">MAX</button>
                        </div>
                    </div>
                </div>

                {/* Memo Input */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-textSecondary mb-2 block">Memo (optional)</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. Saving for goal..."
                            className={`input w-full ${getBorderClass('memo', memo)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={memo}
                            onChange={(e) => handleChange('memo', e.target.value)}
                            onBlur={() => handleBlur('memo')}
                            disabled={isSubmitting}
                            maxLength={30}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <FieldError error={touched.memo ? errors.memo : ''} />
                        <span className={`text-xs ml-auto ${memo.length > 28 ? 'text-danger' : 'text-textMuted'}`}>{memo.length}/28</span>
                    </div>
                </div>

                {numAmt > 0 && (
                    <div className="bg-background rounded-xl p-5 border border-borderCol">
                        <h4 className="text-sm font-semibold text-textPrimary mb-4 flex items-center gap-2"><span>📊</span> After Deposit</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-textSecondary">New Pool Size</span>
                                <div className="text-right">
                                    <span className="text-textPrimary font-medium">{formatXLM(newPoolSize)} XLM</span>
                                    <span className="text-xs text-textMuted ml-2">
                                        (was {formatXLM(currentPool)} XLM)
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary">Your Pool Share</span>
                                <span className="text-textPrimary font-medium">{newShare}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary flex items-center gap-1">Est. Annual Yield <span title="Based on 5% fixed APY on your deposit amount" className="cursor-help text-textMuted">ⓘ</span></span>
                                <span className="text-success font-medium">+{formatXLM(estYield)} XLM <span className="text-xs opacity-70">(5% APY)</span></span>
                            </div>

                            <div className="flex justify-between items-center border-t border-borderCol pt-3 mt-3">
                                <span className="text-sm text-textSecondary">Your New Wallet Balance</span>
                                <span className={`font-semibold ${newWalletBalance < 1
                                        ? 'text-danger'   // warn if going below minimum
                                        : 'text-textPrimary'
                                    }`}>
                                    {formatXLM(newWalletBalance)} XLM
                                </span>
                            </div>

                            {newWalletBalance < 1 && (
                                <p className="text-xs text-warning flex items-center gap-1 mt-2">
                                    ⚠️ Keep at least 1 XLM in wallet for Stellar minimum balance.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    {status === 'pending' && (
                        <p className="text-center text-xs text-textSecondary mb-3 animate-pulse">Waiting for Freighter confirmation...</p>
                    )}
                    <button
                        onClick={handleConfirmClick}
                        disabled={isSubmitting || (Object.keys(touched).length > 0 && Object.values(errors).some(e => e !== ''))}
                        className={`btn-primary w-full h-[52px] text-lg ${isSubmitting ? 'bg-primary/50 text-white/70' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Processing...
                            </>
                        ) : (
                            'Review & Deposit'
                        )}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmedDeposit}
                onCancel={() => setShowConfirmModal(false)}
                title="Confirm Deposit"
                confirmLabel={`Deposit ${amount} XLM`}
                confirmColor="blue"
                details={[
                    { label: 'Action', value: 'Add to lending pool' },
                    { label: 'Amount', value: `${amount} XLM` },
                    { label: 'Memo', value: memo || 'None' },
                    { label: 'Pool', value: 'LumiLend Testnet Pool' },
                    { label: 'APY', value: '5% Fixed' },
                ]}
                warning="Your XLM will be locked in the pool until you withdraw. Ensure sufficient liquidity exists to withdraw later."
            />
        </div>
    );
}
