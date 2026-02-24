import React, { useState } from 'react';
import { StrKey } from '@stellar/stellar-sdk';
import { AlertCircle, Check, ArrowRight, RefreshCw, Info } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { sendXlmPayment, parseStellarError } from '../utils/stellar';

function FieldError({ error }) {
    if (!error) return null;
    return (
        <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
        </p>
    );
}

export default function SendForm({ publicKey, balance, onBalanceRefresh, showToast }) {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [txStatus, setTxStatus] = useState('idle');
    const [txHash, setTxHash] = useState(null);

    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({
        recipient: '',
        amount: '',
        memo: ''
    });

    const availableBalance = Math.max(0, parseFloat(balance) - 1);

    function validateRecipient(value) {
        if (!value) return 'Recipient address is required.';
        if (!StrKey.isValidEd25519PublicKey(value))
            return 'Invalid Stellar address. Must start with G and be 56 characters.';
        if (value === publicKey)
            return 'You cannot send XLM to your own address.';
        return '';
    }

    function validateAmount(value) {
        const num = parseFloat(value);
        if (!value) return 'Amount is required.';
        if (isNaN(num) || num <= 0) return 'Amount must be a positive number.';
        if (num < 1) return 'Minimum send amount is 1 XLM.';
        if (num > availableBalance)
            return `Maximum is ${availableBalance.toFixed(2)} XLM. 1 XLM reserved for account minimum balance.`;
        return '';
    }

    function validateMemo(value) {
        if (value.length > 28) return 'Memo must be 28 characters or less.';
        return '';
    }

    function validateAll() {
        const newErrors = {
            recipient: validateRecipient(recipient),
            amount: validateAmount(amount),
            memo: validateMemo(memo)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(e => e !== '');
    }

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        let error = '';
        if (field === 'recipient') error = validateRecipient(recipient);
        if (field === 'amount') error = validateAmount(amount);
        if (field === 'memo') error = validateMemo(memo);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleChange = (field, value) => {
        if (field === 'recipient') setRecipient(value);
        if (field === 'amount') setAmount(value);
        if (field === 'memo') setMemo(value);

        if (touched[field]) {
            let error = '';
            if (field === 'recipient') error = validateRecipient(value);
            if (field === 'amount') error = validateAmount(value);
            if (field === 'memo') error = validateMemo(value);
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleReviewClick = () => {
        setTouched({ recipient: true, amount: true, memo: true });
        if (validateAll()) {
            setShowModal(true);
        }
    };

    const handleConfirmedSend = async () => {
        setShowModal(false);
        setTxStatus('pending');

        // Fallback UI toast, if showToast passed as prop, use it. App.js provides it as showToastMsg
        if (showToast) showToast('Sending XLM...', 'pending');

        try {
            const result = await sendXlmPayment({
                fromPublicKey: publicKey,
                toAddress: recipient,
                amount: amount,
                memo: memo || null
            });

            if (result.success) {
                setTxStatus('success');
                setTxHash(result.txHash);
                if (showToast) {
                    showToast(`${amount} XLM sent successfully!`, 'success', result.txHash);
                }
                setRecipient('');
                setAmount('');
                setMemo('');
                setTouched({});
                onBalanceRefresh();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setTxStatus('failed');
            const errorMsg = parseStellarError(err);
            const isReject = err.message?.includes('User declined');
            if (showToast) {
                showToast(
                    isReject ? 'Transaction rejected. Try again when ready.' : `Send failed: ${errorMsg}`,
                    isReject ? 'warning' : 'error'
                );
            }
        }
    };

    const getBorderClass = (field, value) => {
        if (touched[field] && errors[field]) return 'border-danger focus:ring-danger';
        if (touched[field] && !errors[field] && value) return 'border-success focus:ring-success/50';
        return 'border-borderCol focus:border-primary focus:ring-primary/50';
    };

    return (
        <div className="card bg-surface relative overflow-hidden p-6 rounded-2xl">
            <div className="mb-6 pb-4 border-b border-borderCol">
                <h2 className="text-xl font-bold text-textPrimary">Send XLM</h2>
                <p className="text-sm text-textSecondary">Transfer XLM to any Stellar testnet address</p>
            </div>

            <div className="space-y-6">

                {/* Sender Info Row */}
                <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-borderCol">
                    <div>
                        <div className="text-sm font-medium text-textSecondary mb-1">From</div>
                        <div className="text-sm text-white font-mono break-all font-medium">
                            {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
                        </div>
                        <div className="text-xs text-textSecondary mt-1">Bal: {parseFloat(balance).toFixed(2)} XLM</div>
                    </div>
                    <button
                        onClick={onBalanceRefresh}
                        className="flex items-center gap-1 text-sm bg-surface hover:bg-white/10 px-3 py-1.5 rounded-lg border border-borderCol transition-colors"
                    >
                        <RefreshCw size={14} /> Refresh Balance
                    </button>
                </div>

                {/* Recipient Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-textSecondary">
                        Recipient Address <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            className={`input w-full font-mono text-sm pr-10 focus:ring-2 ${getBorderClass('recipient', recipient)}`}
                            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            value={recipient}
                            onChange={e => handleChange('recipient', e.target.value)}
                            onBlur={() => handleBlur('recipient')}
                        />
                        {touched.recipient && !errors.recipient && recipient && StrKey.isValidEd25519PublicKey(recipient) && (
                            <Check className="w-5 h-5 text-success absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                    </div>
                    <div className="flex justify-between mt-1">
                        <FieldError error={touched.recipient ? errors.recipient : ''} />
                        <p className="text-xs text-textMuted ml-auto">{recipient.length}/56</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-textSecondary">
                        Amount <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            className={`input w-full pr-16 focus:ring-2 ${getBorderClass('amount', amount)}`}
                            placeholder="0.00"
                            value={amount}
                            onChange={e => handleChange('amount', e.target.value)}
                            onBlur={() => handleBlur('amount')}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs">
                            XLM
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-1">
                        <div className="flex-1">
                            <FieldError error={touched.amount ? errors.amount : ''} />
                            <p className="text-xs text-textMuted mt-1">
                                Available: {availableBalance.toFixed(2)} XLM (1 XLM reserved)
                            </p>
                        </div>

                        <div className="flex gap-2 flex-wrap justify-end">
                            <button onClick={() => handleChange('amount', '10')} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors">10 XLM</button>
                            <button onClick={() => handleChange('amount', '25')} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors">25 XLM</button>
                            <button onClick={() => handleChange('amount', '50')} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors">50 XLM</button>
                            <button onClick={() => handleChange('amount', availableBalance.toFixed(7))} className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-borderCol hover:border-primary text-textSecondary hover:text-primary transition-colors">MAX-1</button>
                        </div>
                    </div>
                </div>

                {/* Memo Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-textSecondary flex items-center gap-2">
                        Memo (optional)
                        <div className="group relative">
                            <Info size={14} className="text-textMuted hover:text-white cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 text-xs p-2 bg-background border border-borderCol text-textSecondary rounded shadow-lg invisible group-hover:visible z-10 text-center">
                                Memo is stored on-chain and visible publicly. Do not include sensitive information.
                            </div>
                        </div>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            className={`input w-full focus:ring-2 ${getBorderClass('memo', memo)}`}
                            placeholder="Payment for... / Invoice #..."
                            value={memo}
                            onChange={e => handleChange('memo', e.target.value)}
                            onBlur={() => handleBlur('memo')}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <FieldError error={touched.memo ? errors.memo : ''} />
                        <p className={`text-xs ml-auto ${(memo.length > 28) ? 'text-danger' : 'text-textMuted'}`}>
                            {memo.length}/28
                        </p>
                    </div>
                </div>

                {/* Transaction Preview Card */}
                {recipient && amount && !errors.recipient && !errors.amount && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6 animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-widest mb-4">Transaction Preview</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-textSecondary">To</span>
                                <span className="text-textPrimary font-mono">{recipient.slice(0, 6)}...{recipient.slice(-6)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary">Amount</span>
                                <span className="text-textPrimary font-bold">{amount} XLM</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary">Memo</span>
                                <span className="text-textPrimary">{memo || "None"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary">Network</span>
                                <span className="text-textPrimary">Stellar Testnet</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textSecondary">Fee</span>
                                <span className="text-textPrimary">~0.00001 XLM</span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleReviewClick}
                    disabled={Object.values(errors).some(e => e !== '') && Object.keys(touched).length > 0}
                    className="btn-primary w-full py-4 text-base font-bold flex justify-center items-center gap-2 mt-4"
                >
                    Review & Send <ArrowRight size={18} />
                </button>

            </div>

            <ConfirmationModal
                isOpen={showModal}
                onConfirm={handleConfirmedSend}
                onCancel={() => setShowModal(false)}
                title="Confirm Send"
                confirmLabel={`Send ${amount || 0} XLM`}
                confirmColor="blue"
                details={[
                    { label: 'From', value: publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : '' },
                    { label: 'To', value: recipient ? `${recipient.slice(0, 6)}...${recipient.slice(-6)}` : '' },
                    { label: 'Amount', value: `${amount} XLM` },
                    { label: 'Memo', value: memo || 'None' },
                    { label: 'Fee', value: '~0.00001 XLM' },
                ]}
                warning="Double-check the recipient address. Transactions on Stellar cannot be reversed."
            />
        </div>
    );
}
