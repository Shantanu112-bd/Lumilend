import { Contract, Networks, TransactionBuilder, Horizon, rpc, Address, nativeToScVal } from '@stellar/stellar-sdk';

const CONTRACT_ID = "CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ";
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);

async function main() {
    const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await horizon.loadAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF').catch(() => {
        return {
            id: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
            sequence: '1',
            incrementSequenceNumber: () => { },
            accountId: () => 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        }
    });

    const txBuilder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    const contract = new Contract(CONTRACT_ID);
    const amountStroops = BigInt(Math.floor(Number(10) * 10 ** 7));
    const durationDays = 14;

    const op = contract.call(
        'request_loan',
        new Address('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF').toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
        nativeToScVal(Number(durationDays), { type: 'u32' })
    );

    const tx = txBuilder.addOperation(op).setTimeout(30).build();

    console.log("Simulating...");
    const sim = await server.simulateTransaction(tx);
    console.log(JSON.stringify(sim, null, 2));
}

main().catch(console.error);
