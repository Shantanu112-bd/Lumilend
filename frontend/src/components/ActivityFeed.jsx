import React, { useEffect, useState } from 'react';
import { Activity, Circle } from 'lucide-react';
import { formatHash } from '../App';

export default function ActivityFeed({ accountId }) {
    const [events, setEvents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!accountId) return;

        console.log("Setting up SSE for account:", accountId);
        // We use the raw SSE URL for Stellar Horizon to listen to account transactions
        const es = new EventSource(`https://horizon-testnet.stellar.org/accounts/${accountId}/transactions?cursor=now`);

        es.onopen = () => {
            setIsConnected(true);
        };

        es.onmessage = (message) => {
            try {
                const tx = JSON.parse(message.data);
                // We add it to the top of our events array
                setEvents((prev) => {
                    const newEvent = {
                        id: tx.id,
                        hash: tx.hash,
                        time: new Date(tx.created_at).toLocaleTimeString(),
                        isSuccess: tx.successful
                    };
                    return [newEvent, ...prev].slice(0, 5); // Keep last 5
                });
            } catch (err) {
                console.error("Failed parsing SSE", err);
            }
        };

        es.onerror = () => {
            setIsConnected(false);
        };

        return () => {
            es.close();
            setIsConnected(false);
        };
    }, [accountId]);

    if (!accountId) return null;

    return (
        <div className="card p-6 mt-6 border border-borderCol bg-surface">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Live Activity Feed
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium bg-background px-3 py-1 rounded-full border border-borderCol">
                    <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-success animate-pulse' : 'text-danger'}`} />
                    {isConnected ? 'LIVE' : 'DISCONNECTED'}
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-6 text-sm text-textSecondary bg-background rounded-lg border border-borderCol/50">
                    Watching for new transactions...
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((ev) => (
                        <div key={ev.id} className="flex justify-between items-center p-3 rounded-lg bg-background border border-borderCol/70 text-sm">
                            <div className="flex flex-col">
                                <span className={`font-medium ${ev.isSuccess ? 'text-success' : 'text-danger'}`}>
                                    {ev.isSuccess ? 'Transaction Confirmed' : 'Transaction Failed'}
                                </span>
                                <span className="text-xs text-textSecondary">{ev.time}</span>
                            </div>
                            <a
                                href={`https://stellar.expert/explorer/testnet/tx/${ev.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-accent hover:underline text-xs"
                            >
                                {formatHash(ev.hash)}
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
