import React, { useState } from 'react';
import { Clock, RefreshCw, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { repayLoan } from '../utils/soroban';
import { formatXLM, formatHash } from '../App';
import ConfirmationModal from './ConfirmationModal';

export default function ActiveLoanCard({ loan, wallet, onSuccess, showToast }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, pending, success
    const [txHash, setTxHash] = useState('');
    const [showRepayModal, setShowRepayModal] = useState(false);

    const principal = Number(loan.amount) / 10 ** 7 || 0;
    const durationDays = Number(loan.duration_days) || 14;
    // Standard approximation: 5% flat fee calculation 
    const interest = principal * 0.05;
    const totalDueObj = loan.total_due ? (Number(loan.total_due) / 10 ** 7) : (principal + interest);

    const borrowTimeMs = Number(loan.borrow_timestamp) * 1000 || Date.now();
    const dueTimeMs = Number(loan.due_timestamp) * 1000 || borrowTimeMs + (durationDays * 24 * 60 * 60 * 1000);

    const now = Date.now();
    const isOverdue = now > dueTimeMs;
    const daysRemaining = Math.max(0, Math.ceil((dueTimeMs - now) / (1000 * 60 * 60 * 24)));
    const percentagePassed = Math.min(100, Math.max(0, ((now - borrowTimeMs) / (dueTimeMs - borrowTimeMs)) * 100));

    const borrowDateStr = new Date(borrowTimeMs).toLocaleDateString();
    const dueDateStr = new Date(dueTimeMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const handleConfirmedRepay = async () => {
        setShowRepayModal(false);
        setIsSubmitting(true);
        setStatus('pending');
        try {
            const hash = await repayLoan(loan.loan_id);
            setTxHash(hash);
            setStatus('success');
            onSuccess();
            showToast(`Loan #${loan.loan_id} repaid successfully!`, 'success', hash);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Repayment failed', 'error');
            setStatus('idle');
            setIsSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="card text-center p-10 animate-in fade-in zoom-in duration-300 border-l-4 border-l-success">
                <div className="flex justify-between items-center mb-6 border-b border-borderCol pb-4 font-semibold">
                    <span className="flex items-center gap-2 bg-success/20 text-success px-3 py-1 rounded-full"><CheckCircle size={16} /> REPAID</span>
                </div>

                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-success w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-textPrimary mb-2">Loan repaid successfully!</h3>
                <p className="text-textSecondary mb-6">Pool balance updated.</p>

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
                    <button onClick={onSuccess} className="btn-ghost flex-1">
                        Borrow Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`card overflow-hidden transition-all duration-300 ${isSubmitting ? 'opacity-80' : ''} ${isOverdue ? 'border-danger/50 shadow-[0_0_15px_rgba(220,38,38,0.2)] border-l-4 border-l-danger animate-pulse border-2' : 'border-l-4 border-l-warning'}`}>

            {/* Status Banner */}
            <div className={`p-4 flex items-center justify-between mb-4 rounded-xl ${isOverdue ? 'bg-danger/10 border border-danger/20' : 'bg-warning/10 border border-warning/20'}`}>
                <div className={`flex items-center gap-2 px-3 py-1 font-bold text-xs rounded-full uppercase tracking-wider ${isOverdue ? 'bg-danger text-white' : 'bg-[#D97706] text-white'}`}>
                    {isOverdue ? 'OVERDUE' : 'ACTIVE LOAN'}
                </div>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isOverdue ? 'text-danger' : 'text-textPrimary'}`}>
                    <Clock size={16} />
                    {isOverdue ? '0 days remaining' : `Due in ${daysRemaining} days — ${dueDateStr}`}
                </div>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 mb-6 text-sm">
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Loan ID</span>
                        <span className="text-textPrimary font-mono">#{Number(loan.loan_id)}</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Principal</span>
                        <span className="text-textPrimary font-medium">{formatXLM(principal)} XLM</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Interest</span>
                        <span className="text-warning font-medium">{formatXLM(interest)} XLM</span>
                    </div>
                    <div className="flex justify-between py-2 bg-surface/50 rounded -mx-3 px-3">
                        <span className="text-textSecondary font-medium text-base">Total Due</span>
                        <span className="text-xl font-bold text-textPrimary">{formatXLM(totalDueObj)} XLM</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Status</span>
                        <div className={`flex items-center gap-1 font-bold text-xs uppercase tracking-wider ${isOverdue ? 'text-danger' : 'text-warning'}`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                        </div>
                    </div>
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Borrowed</span>
                        <span className="text-textPrimary">{borrowDateStr}</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Due</span>
                        <span className="text-textPrimary">{dueDateStr}</span>
                    </div>
                    <div className="flex justify-between border-b border-borderCol pb-2">
                        <span className="text-textSecondary">Duration</span>
                        <span className="text-textPrimary">{durationDays} days</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 p-2">
                <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-textSecondary">Time Remaining</span>
                    <span className={isOverdue ? 'text-danger' : 'text-textPrimary'}>{daysRemaining} of {durationDays} days remaining</span>
                </div>
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-borderCol">
                    <div
                        className={`h-full rounded-full transition-all duration-500 relative ${isOverdue ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${isOverdue ? 100 : percentagePassed}%` }}
                    >
                    </div>
                </div>
            </div>

            {/* Repayment Action box */}
            <div className="border border-borderCol bg-background/50 rounded-xl p-6 relative">
                <h4 className="absolute -top-3 left-4 bg-surface px-2 text-xs font-semibold text-textSecondary uppercase tracking-widest border border-borderCol rounded">
                    Repay Your Loan
                </h4>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left mb-6 mt-2">
                    <div>
                        <div className="text-3xl font-bold text-textPrimary mb-1">{formatXLM(totalDueObj)} <span className="text-xl text-textMuted font-normal">XLM</span></div>
                        <div className="text-xs text-textSecondary">
                            Principal: {formatXLM(principal)} XLM &nbsp;·&nbsp; Interest: {formatXLM(interest)} XLM
                        </div>
                    </div>
                </div>

                {isOverdue && (
                    <div className="mb-4 text-danger text-sm font-semibold flex gap-2 items-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                        <AlertTriangle size={18} />
                        Your loan is past due. Anyone can trigger liquidation.
                    </div>
                )}

                {status === 'pending' && (
                    <p className="text-center text-xs text-textSecondary mb-3 animate-pulse">Waiting for Freighter confirmation...</p>
                )}

                <button
                    onClick={() => setShowRepayModal(true)}
                    disabled={isSubmitting}
                    className={`w-full h-[52px] text-lg ${isSubmitting ? 'opacity-50' : ''} ${isOverdue ? 'btn-danger' : 'btn-primary'}`}
                >
                    {isSubmitting ? (
                        <>
                            <RefreshCw className="animate-spin mr-2" size={20} />
                            Processing repayment...
                        </>
                    ) : (
                        isOverdue ? `Repay Now (Overdue)` : `Repay ${formatXLM(totalDueObj)} XLM`
                    )}
                </button>
            </div>

            <ConfirmationModal
                isOpen={showRepayModal}
                onConfirm={handleConfirmedRepay}
                onCancel={() => setShowRepayModal(false)}
                title="Confirm Repayment"
                confirmLabel={`Repay ${formatXLM(totalDueObj)} XLM`}
                confirmColor="green"
                details={[
                    { label: 'Loan ID', value: `#${loan.loan_id}` },
                    { label: 'Principal', value: `${formatXLM(principal)} XLM` },
                    { label: 'Interest', value: `${formatXLM(interest)} XLM` },
                    { label: 'Total Due', value: `${formatXLM(totalDueObj)} XLM` },
                    { label: 'Due Date', value: dueDateStr },
                ]}
            />
        </div>
    );
}
