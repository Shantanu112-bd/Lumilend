import React, { useState } from 'react';
import { Loader2, Coins, CheckCircle, ExternalLink, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { requestLoan } from '../utils/soroban';
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

export default function BorrowForm({ wallet, poolStats, onSuccess, showToast, hasActiveLoan }) {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState(14);

    // Modal & status state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [txHash, setTxHash] = useState('');

    // Validation state
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({ amount: '', duration: '' });

    const availableLiquidity = Number(poolStats?.available) || 0;

    const validateBorrowForm = () => {
        const newErrors = {};
        const num = parseFloat(amount);
        const days = parseInt(duration);

        if (!amount)
            newErrors.amount = 'Loan amount is required.';
        else if (num < 5)
            newErrors.amount = 'Minimum loan amount is 5 XLM.';
        else if (num > 100)
            newErrors.amount = 'Maximum loan amount is 100 XLM.';
        else if (num > parseFloat(availableLiquidity))
            newErrors.amount = `Pool only has ${availableLiquidity} XLM available.`;

        if (!duration)
            newErrors.duration = 'Loan duration is required.';
        else if (days < 7)
            newErrors.duration = 'Minimum duration is 7 days.';
        else if (days > 90)
            newErrors.duration = 'Maximum duration is 90 days.';

        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        // re-validate all to keep it simple, or validate individual
        const newErrors = {};
        const num = parseFloat(amount);
        if (field === 'amount') {
            if (!amount) newErrors.amount = 'Loan amount is required.';
            else if (num < 5) newErrors.amount = 'Minimum loan amount is 5 XLM.';
            else if (num > 100) newErrors.amount = 'Maximum loan amount is 100 XLM.';
            else if (num > availableLiquidity) newErrors.amount = `Pool only has ${availableLiquidity} XLM available.`;
            else newErrors.amount = '';
        }
        setErrors(prev => ({ ...prev, ...newErrors }));
    };

    const handleChange = (field, value) => {
        if (field === 'amount') setAmount(value);
        if (field === 'duration') setDuration(Number(value));

        if (touched[field]) {
            let error = '';
            if (field === 'amount') {
                const num = parseFloat(value);
                if (!value) error = 'Loan amount is required.';
                else if (num < 5) error = 'Minimum loan amount is 5 XLM.';
                else if (num > 100) error = 'Maximum loan amount is 100 XLM.';
                else if (num > availableLiquidity) error = `Pool only has ${availableLiquidity} XLM available.`;
            }
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const numAmt = parseFloat(amount) || 0;
    const interest = numAmt * 0.05;
    const totalRepay = numAmt + interest;

    const dueTime = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    const dueString = dueTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getBorderClass = (field, value) => {
        if (touched[field] && errors[field]) return 'border-danger focus:ring-danger';
        if (touched[field] && !errors[field] && value) return 'border-success focus:ring-success/50';
        return 'border-borderCol focus:border-primary focus:ring-primary/50';
    };

    const handleConfirmClick = () => {
        setTouched({ amount: true, duration: true });
        if (validateBorrowForm()) {
            setShowConfirmModal(true);
        }
    };

    const handleConfirmedBorrow = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);
        setStatus('pending');
        try {
            const { hash, result: loanId } = await requestLoan(amount, duration);
            setTxHash(hash);

            // Save loan_id to localStorage so it persists across refresh
            localStorage.setItem(`lumilend_loan_${wallet}`, loanId);

            // Calculate loan details
            const interestOwed = parseFloat(amount) * 0.05;
            const dueDate = new Date(Date.now() + duration * 86400 * 1000);

            // Trigger parent event
            if (onSuccess) {
                onSuccess({
                    loan_id: loanId,
                    principal: parseFloat(amount),
                    interest_owed: interestOwed,
                    total_due: parseFloat(amount) + interestOwed,
                    due_timestamp: Math.floor(dueDate.getTime() / 1000),
                    due_date: dueDate.toLocaleDateString(
                        'en-US', { month: 'short', day: 'numeric', year: 'numeric' }
                    ),
                    status: 'Active',
                    days_remaining: duration
                });
            }

            setStatus('success');
            setAmount('');
            setDuration(14);
            showToast(`Borrowed ${formatXLM(amount)} XLM successfully!`, 'success', hash);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Loan request failed', 'error');
            setStatus('idle');
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setAmount('');
        setDuration(14);
        setTouched({});
        setErrors({ amount: '', duration: '' });
        setStatus('idle');
        setIsSubmitting(false);
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
                    <button onClick={handleReset} className="btn-ghost flex-1 opacity-0 pointer-events-none hidden">
                        Reset
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

                {/* Amount Input */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-textSecondary mb-2 block">
                        Loan Amount <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className={`input text-xl font-semibold w-full pr-16 ${getBorderClass('amount', amount)} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            onBlur={() => handleBlur('amount')}
                            disabled={isSubmitting}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                            XLM
                        </div>
                    </div>

                    <div className="flex justify-between mt-2 items-start">
                        <div className="flex-1">
                            {touched.amount && errors.amount ? (
                                <FieldError error={errors.amount} />
                            ) : (
                                <p className="text-xs text-textMuted mt-1">
                                    Min: 5 XLM · Max: 100 XLM
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => handleChange('amount', '10')} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">10 XLM</button>
                            <button onClick={() => handleChange('amount', '25')} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">25 XLM</button>
                            <button onClick={() => handleChange('amount', '50')} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">50 XLM</button>
                            <button onClick={() => handleChange('amount', '100')} disabled={isSubmitting} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors disabled:opacity-50">100 XLM</button>
                        </div>
                    </div>
                </div>

                {/* Duration Range Input */}
                <div className="space-y-1 mt-4">
                    <label className="text-sm font-medium text-textSecondary mb-4 block">
                        Repayment Period <span className="text-danger">*</span>
                    </label>
                    <div className="px-2">
                        <input
                            type="range"
                            min="7"
                            max="90"
                            value={duration}
                            onChange={(e) => handleChange('duration', e.target.value)}
                            onBlur={() => handleBlur('duration')}
                            className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-xs text-textSecondary font-medium px-1">
                        <span>7 days</span>
                        <span className="text-base text-textPrimary font-bold">{duration} days</span>
                        <span>90 days</span>
                    </div>
                    {touched.duration && errors.duration && <FieldError error={errors.duration} />}
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
                            'Review Loan Request'
                        )}
                    </button>
                    {errors.amount && (!touched.amount) && numAmt > availableLiquidity && (
                        <p className="text-center text-danger text-xs mt-3 font-medium">Pool does not have enough liquidity.</p>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmedBorrow}
                onCancel={() => setShowConfirmModal(false)}
                title="Confirm Loan Request"
                confirmLabel={`Borrow ${amount} XLM`}
                confirmColor="green"
                details={[
                    { label: 'Principal', value: `${amount} XLM` },
                    { label: 'Interest (5%)', value: `${formatXLM(interest)} XLM` },
                    { label: 'Total Repayment', value: `${formatXLM(totalRepay)} XLM` },
                    { label: 'Duration', value: `${duration} days` },
                    { label: 'Due Date', value: dueString },
                ]}
                warning="You must repay this loan by the due date. Failure to repay will mark your loan as defaulted on-chain."
            />
        </div>
    );
}
