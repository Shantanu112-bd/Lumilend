import {
    TransactionBuilder,
    Networks,
    Operation,
    Asset,
    Memo,
    BASE_FEE,
    Horizon
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || Networks.TESTNET;

export async function sendXlmPayment({ fromPublicKey, toAddress, amount, memo }) {
    // 1. Load sender account from Horizon
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(fromPublicKey);

    // 2. Build transaction
    const txBuilder = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE
    });

    // 3. Add payment operation
    txBuilder.addOperation(
        Operation.payment({
            destination: toAddress,
            asset: Asset.native(),
            amount: amount.toString()
        })
    );

    // 4. Add memo if provided
    if (memo) {
        txBuilder.addMemo(Memo.text(memo));
    }

    // 5. Set timeout and build
    const tx = txBuilder.setTimeout(30).build();
    const txXdr = tx.toXDR();

    // 6. Sign with Freighter
    const { signedTxXdr } = await signTransaction(txXdr, {
        network: 'TESTNET',
        networkPassphrase: NETWORK_PASSPHRASE
    });

    // 7. Submit to Horizon
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(signedTx);

    return {
        success: true,
        txHash: result.hash
    };
}

export function parseStellarError(err) {
    const resultCodes = err?.response?.data?.extras?.result_codes;
    if (!resultCodes) return err.message;

    if (resultCodes.operations?.includes('op_no_destination'))
        return 'Recipient account does not exist on testnet. They need to be funded first.';
    if (resultCodes.operations?.includes('op_underfunded'))
        return 'Insufficient XLM balance for this transaction.';
    if (resultCodes.transaction?.includes('tx_bad_auth'))
        return 'Transaction signature is invalid.';
    return `Transaction failed: ${JSON.stringify(resultCodes)}`;
}
