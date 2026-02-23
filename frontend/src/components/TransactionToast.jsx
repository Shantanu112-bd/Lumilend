import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, X, ExternalLink } from 'lucide-react';
import { formatHash } from '../App';

export default function TransactionToast({ show, message, type, hash, onClose }) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!show) {
            setProgress(100);
            return;
        }

        if (type !== 'pending') {
            const startTime = Date.now();
            const duration = 6000;

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(newProgress);

                if (newProgress === 0) {
                    clearInterval(interval);
                    onClose();
                }
            }, 16);

            return () => clearInterval(interval);
        }
    }, [show, type, onClose]);

    if (!show) return null;

    // Render variables
    let icon = <CheckCircle size={24} className="text-success shrink-0" />;
    let bgColor = 'bg-[#064E3B]'; // dark green
    let borderColor = 'border-l-[#059669]';
    let title = 'Transaction Successful';
    let progressColor = 'bg-[#059669]';

    if (type === 'error') {
        icon = <XCircle size={24} className="text-danger shrink-0" />;
        bgColor = 'bg-[#450A0A]'; // dark red
        borderColor = 'border-l-[#DC2626]';
        progressColor = 'bg-[#DC2626]';
        title = message.includes('Freighter not found') ? 'Freighter Not Found' : 'Transaction Error';
    } else if (type === 'warning' || message.includes('rejected')) {
        icon = <AlertTriangle size={24} className="text-warning shrink-0" />;
        bgColor = 'bg-[#431407]'; // dark orange
        borderColor = 'border-l-[#D97706]';
        progressColor = 'bg-[#D97706]';
        title = 'Transaction Rejected';
    } else if (type === 'pending') {
        icon = <Loader2 size={24} className="text-primary shrink-0 animate-spin" />;
        bgColor = 'bg-[#0C1A2E]'; // dark blue
        borderColor = 'border-l-[#1A56B0]';
        progressColor = 'bg-[#1A56B0]';
        title = 'Processing...';
    }

    return (
        <div className={`fixed top-5 right-5 w-full max-w-[380px] z-[100] transition-all duration-300 transform translate-x-0 ${bgColor} rounded-xl shadow-2xl overflow-hidden border border-borderCol/20 border-l-4 ${borderColor}`}>
            <div className="p-4 flex gap-4">
                {icon}
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="text-white text-base font-semibold">{title}</h4>
                        {type !== 'pending' && (
                            <button onClick={onClose} className="text-textSecondary hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <p className="text-textSecondary text-sm mb-2">{message}</p>

                    {hash && type === 'success' && (
                        <p className="text-sm mt-1">
                            <span className="text-textMuted mr-1">Tx:</span>
                            <a
                                href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent font-mono hover:underline inline-flex items-center gap-1"
                            >
                                {formatHash(hash)} <ExternalLink size={12} />
                            </a>
                        </p>
                    )}

                    {type === 'error' && message.includes('Install Freighter') && (
                        <a
                            href="https://freighter.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-danger hover:text-white underline text-sm inline-block mt-1 font-semibold"
                        >
                            Get Freighter &rarr;
                        </a>
                    )}
                </div>
            </div>

            {type !== 'pending' && (
                <div className="h-1 w-full bg-black/20">
                    <div
                        className={`h-full ${progressColor} transition-all duration-75 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
