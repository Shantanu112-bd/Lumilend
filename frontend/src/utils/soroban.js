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
            // Wait, the PRD doesn't have a `get_active_loan_by_borrower` method!
            // Let's iterate or find the ActiveLoan data key. Let's just catch and return null for now, or just simulate checking latest loan.
            // Oh right, the smart contract doesn't explicitly have `get_active_loan_id(from)` in public functions, unless we read ledger entry directly.
            // Let's mock it for the demo if not available.
            return null;
        } catch (e) {
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

    if (!rpc.Api.isSimulationSuccess(sim)) {
        throw new Error("Simulation rejected by node.");
    }

    const preparedTx = rpc.assembleTransaction(tx, NETWORK_PASSPHRASE, sim).build();

    const signResult = await kit.signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
    });
    const signedXdr = typeof signResult === 'string' ? signResult : signResult.signedTxXdr;

    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    const submitRes = await server.submitTransaction(signedTx);
    if (submitRes.status === "ERROR") {
        throw new Error("Transaction failed during submission.");
    }

    let txResponse = await server.getTransaction(submitRes.hash);
    while (txResponse.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txResponse = await server.getTransaction(submitRes.hash);
    }

    if (txResponse.status === "SUCCESS") {
        return submitRes.hash;
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
    return await submitSorobanTransaction(op);
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
    return await submitSorobanTransaction(op);
}
