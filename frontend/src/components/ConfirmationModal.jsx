import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
    isOpen,
    onConfirm,
    onCancel,
    title,
    details,
    confirmLabel,
    confirmColor,
    warning
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onCancel();
            }
            if (e.key === 'Enter') {
                onConfirm();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel, onConfirm]);

    if (!isOpen) return null;

    const getButtonColorClass = () => {
        switch (confirmColor) {
            case 'green': return 'bg-success hover:bg-success/90 text-white';
            case 'red': return 'bg-danger hover:bg-danger/90 text-white';
            case 'blue':
            default: return 'btn-primary';
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center"
            onClick={onCancel}
        >
            <div
                className="bg-surface rounded-2xl w-full max-w-md mx-auto mt-20 p-6 border border-borderCol shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-textSecondary text-sm">
                        Please review before confirming. This action cannot be undone.
                    </p>
                </div>

                <div className="bg-background rounded-xl border border-borderCol overflow-hidden mb-6">
                    {details.map((row, index) => (
                        <div
                            key={index}
                            className={`flex justify-between items-center p-3 ${index !== details.length - 1 ? 'border-b border-borderCol' : ''}`}
                        >
                            <span className="text-[14px] text-textSecondary">{row.label}</span>
                            <span className="text-[14px] text-white font-mono break-all text-right ml-4">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                {warning && (
                    <div className="bg-[#431407] border border-amber-500/50 rounded-lg p-3 flex gap-3 mb-6">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-200/90 font-medium">
                            {warning}
                        </p>
                    </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Stellar Testnet
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        className="btn-ghost flex-1 py-3"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className={`flex-1 py-3 rounded-xl font-bold transition-colors ${getButtonColorClass()}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
