import { rpc, TransactionBuilder, Networks, xdr, Address, nativeToScVal, scValToNative, Contract, Horizon } from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';

StellarWalletsKit.init({
    network: 'TESTNET',
    selectedWalletId: 'freighter',
    modules: [new FreighterModule(), new xBullModule()],
});

export const kit = StellarWalletsKit;

export async function getKitAddress() {
    try {
        const result = await kit.getAddress();
        return { address: result.address, error: null };
    } catch (error) {
        return { address: null, error };
    }
}

export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);
const cache = new Map();

async function getCached(key, durationMs, fetcher) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < durationMs) {
        return cached.data;
    }
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}

export async function fetchPoolStats() {
    if (!CONTRACT_ID) return null;
    return getCached('poolStats', 30000, async () => {
        try {
            const contract = new Contract(CONTRACT_ID);
            const builder = new TransactionBuilder(await getSourceAccount(), {
                fee: '100',
                networkPassphrase: NETWORK_PASSPHRASE,
            });
            const tx = builder.addOperation(contract.call('get_pool_stats')).setTimeout(30).build();
            const res = await server.simulateTransaction(tx);

            if (rpc.Api.isSimulationSuccess(res)) {
                const stats = scValToNative(res.result.retval);
                return {
                    total_deposited: (Number(stats.total_deposited) / 10 ** 7).toString(),
                    total_lent: (Number(stats.total_lent) / 10 ** 7).toString(),
                    available: (Number(stats.available) / 10 ** 7).toString(),
                    interest_rate_bps: Number(stats.interest_rate_bps),
                };
            }
            return null;
        } catch (e) {
            console.error('fetchPoolStats Error', e);
            return null;
        }
    });
}

export async function fetchLenderInfo(walletPubkey) {
    if (!CONTRACT_ID) return null;
    return getCached(`lenderInfo_${walletPubkey}`, 10000, async () => {
        try {
            const contract = new Contract(CONTRACT_ID);
            const builder = new TransactionBuilder(await getSourceAccount(), { fee: '100', networkPassphrase: NETWORK_PASSPHRASE });
            const tx = builder.addOperation(contract.call('get_lender_info', nativeToScVal(walletPubkey, { type: 'address' }))).setTimeout(30).build();
            const res = await server.simulateTransaction(tx);
            if (rpc.Api.isSimulationSuccess(res)) {
                const info = scValToNative(res.result.retval);
                return {
                    amount: (Number(info.amount) / 10 ** 7).toString(),
                    deposit_timestamp: Number(info.deposit_timestamp),
                };
            }
            return null;
        } catch (e) {
            return null;
        }
    });
}

export async function fetchActiveLoan(walletPubkey) {
    if (!CONTRACT_ID) return null;
    return getCached(`activeLoan_${walletPubkey}`, 10000, async () => {
        try {
            let loanId = localStorage.getItem(`lumilend_loan_${walletPubkey}`);

            const contract = new Contract(CONTRACT_ID);
            const sourceAccount = await getSourceAccount();
            const builder = new TransactionBuilder(sourceAccount, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE });

            // If loanId is missing, try scanning recent loans to recover it
            if (!loanId) {
                // We'll scan from 1 up to a reasonable max (e.g., 20) for demo purposes, 
                // since we don't have a reliable way to know the `next_loan_id` from the outside without a dedicated view function.
                for (let i = 1; i <= 20; i++) {
                    try {
                        const txScan = new TransactionBuilder(sourceAccount, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
                            .addOperation(contract.call('get_loan', nativeToScVal(i, { type: 'u64' })))
                            .setTimeout(30).build();

                        const resScan = await server.simulateTransaction(txScan);
                        if (rpc.Api.isSimulationSuccess(resScan)) {
                            const loanData = scValToNative(resScan.result.retval);

                            if (loanData.borrower === walletPubkey) {
                                const statusName = typeof loanData.status === 'object' ? Object.keys(loanData.status)[0] : loanData.status;
                                if (statusName === 'Active' || loanData.status === 0) {
                                    loanId = i.toString();
                                    localStorage.setItem(`lumilend_loan_${walletPubkey}`, loanId);
                                    break; // Found it!
                                }
                            }
                        }
                    } catch (scanErr) {
                        // Ignore errors for individual non-existent loans in the scan
                    }
                }
            }

            if (!loanId) return null; // Still not found after scanning

            const tx = builder.addOperation(contract.call('get_loan', nativeToScVal(Number(loanId), { type: 'u64' }))).setTimeout(30).build();
            const res = await server.simulateTransaction(tx);

            if (rpc.Api.isSimulationSuccess(res)) {
                const loan = scValToNative(res.result.retval);
                const statusName = typeof loan.status === 'object' ? Object.keys(loan.status)[0] : loan.status;
                if (statusName === 'Active' || loan.status === 0) {
                    const dueTimestamp = Number(loan.due_timestamp);
                    const nowSecs = Math.floor(Date.now() / 1000);
                    const diffDays = Math.ceil((dueTimestamp - nowSecs) / 86400);

                    return {
                        loan_id: loanId,
                        amount: loan.principal.toString(),
                        interest_owed: loan.interest_owed.toString(),
                        due_timestamp: dueTimestamp,
                        duration_days: Math.max(1, diffDays),
                        status: 'Active'
                    };
                } else {
                    // Loan is not active, maybe it was repaid elsewhere
                    localStorage.removeItem(`lumilend_loan_${walletPubkey}`);
                    return null;
                }
            }
            return null;
        } catch (e) {
            console.error("fetchActiveLoan Error", e);
            return null;
        }
    });
}

export async function fetchXlmBalance(walletPubkey) {
    try {
        const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
        const acc = await horizon.loadAccount(walletPubkey);
        const native = acc.balances.find((b) => b.asset_type === 'native');
        return native ? native.balance : '0';
    } catch (e) {
        return '0';
    }
}

async function getSourceAccount() {
    const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
    // For simulation we can use a randomly established account or just the fallback.
    return await horizon.loadAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF').catch(() => {
        return {
            id: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
            sequence: '1',
            incrementSequenceNumber: () => { },
            accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        }
    });
}

async function submitSorobanTransaction(operationCall) {
    const { address, error } = await getKitAddress();
    if (!address || error) throw new Error("Wallet not connected");
    const publicKey = address;

    const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
    let account;
    try {
        account = await horizon.loadAccount(publicKey);
    } catch (e) {
        throw new Error("Account not found on testnet. Please fund it.");
    }

    const txBuilder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    const tx = txBuilder.addOperation(operationCall).setTimeout(30).build();

    let sim;
    try {
        sim = await server.simulateTransaction(tx);
    } catch (e) {
        throw new Error("Simulation failed. Check pool liquidity or constraints.");
    }

    if (!rpc.Api.isSimulationError(sim) && !rpc.Api.isSimulationSuccess(sim)) {
        console.error("Simulation had no success but also no explicitly formatted error?", sim);
    }

    if (!rpc.Api.isSimulationSuccess(sim)) {
        console.error("Simulation failed object:", JSON.stringify(sim, null, 2));

        // Parse contract specific errors based on ContractError enum in lib.rs
        if (sim.error) {
            if (sim.error.includes("Error(Contract, #1)")) throw new Error("Contract already initialized.");
            if (sim.error.includes("Error(Contract, #2)")) throw new Error("Insufficient pool liquidity.");
            if (sim.error.includes("Error(Contract, #3)")) throw new Error("Insufficient balance.");
            if (sim.error.includes("Error(Contract, #4)")) throw new Error("You already have an active loan. Please repay it first.");
            if (sim.error.includes("Error(Contract, #5)")) throw new Error("Loan not found.");
            if (sim.error.includes("Error(Contract, #6)")) throw new Error("Loan is not active.");
            if (sim.error.includes("Error(Contract, #7)")) throw new Error("Repayment amount too low.");
            if (sim.error.includes("Error(Contract, #8)")) throw new Error("Loan not yet defaulted.");
            if (sim.error.includes("Error(Contract, #9)")) throw new Error("Unauthorized action.");
        }

        let errMsg = "Simulation rejected by node.";
        if (sim.error) errMsg += " " + sim.error;
        throw new Error(errMsg);
    }

    let retval = null;
    if (sim.result && sim.result.retval) {
        try {
            retval = scValToNative(sim.result.retval);
        } catch (e) {
            console.warn("Could not parse retval into native", e);
        }
    }

    const preparedTx = rpc.assembleTransaction(tx, sim).build();

    const signResult = await kit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
    });
    const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;

    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    const submitRes = await server.sendTransaction(signedTx);
    if (submitRes.errorResult) {
        console.error("Transaction Error:", submitRes);
        throw new Error("Transaction failed during submission.");
    }

    let txResponse = await server.getTransaction(submitRes.hash);
    while (txResponse.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txResponse = await server.getTransaction(submitRes.hash);
    }

    if (txResponse.status === "SUCCESS") {
        return { hash: submitRes.hash, result: retval };
    } else {
        throw new Error(`Transaction failed on ledger.`);
    }
}

export async function depositXlm(amount) {
    const { address, error } = await getKitAddress();
    if (error || !address) throw new Error("Wallet issue.");
    const amountStroops = BigInt(Math.floor(Number(amount) * 10 ** 7));
    const contract = new Contract(CONTRACT_ID);
    const op = contract.call(
        'deposit',
        new Address(address).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' })
    );
    const { hash } = await submitSorobanTransaction(op);
    return hash;
}

export async function requestLoan(amount, durationDays) {
    const { address, error } = await getKitAddress();
    if (error || !address) throw new Error("Wallet issue.");
    const amountStroops = BigInt(Math.floor(Number(amount) * 10 ** 7));
    const contract = new Contract(CONTRACT_ID);
    const op = contract.call(
        'request_loan',
        new Address(address).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
        nativeToScVal(Number(durationDays), { type: 'u32' })
    );
    return await submitSorobanTransaction(op);
}

export async function repayLoan(loanId) {
    const { address, error } = await getKitAddress();
    if (error || !address) throw new Error("Wallet issue.");
    const contract = new Contract(CONTRACT_ID);
    const op = contract.call(
        'repay_loan',
        new Address(address).toScVal(),
        nativeToScVal(Number(loanId), { type: 'u64' })
    );
    const { hash } = await submitSorobanTransaction(op);
    return hash;
}
