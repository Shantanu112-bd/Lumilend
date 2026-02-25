# LumiLend — Stellar Micro-Lending Pool
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lumilend.vercel.app)

## Live Demo
https://lumilend.vercel.app

## Demo Video
*(Link to Loom/YouTube Demo Video TBD)*

## Test Output Screenshot
![Tests](./test-output.png)

## Deployed Contract
CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ
https://stellar.expert/explorer/testnet/contract/CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ

## Sample Transaction Hash
0dc4417bd5ab64745e06fe278da933144bcd8543d888de68361cb5caf3553024
https://stellar.expert/explorer/testnet/tx/0dc4417bd5ab64745e06fe278da933144bcd8543d888de68361cb5caf3553024

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS
- Wallet: `@stellar/freighter-api`
- Contract interaction: `@stellar/stellar-sdk`
- Smart Contract: Soroban (Rust)
- Deployment: Vercel / Netlify

## Prerequisites
- Node.js 18+
- Rust
- Soroban CLI
- Freighter Wallet (installed in browser)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd lumilend
   ```

2. **Run Contract Tests:**
   ```bash
   cd contracts/lumilend
   cargo test -- --nocapture
   ```

3. **Deploy the contract** (Option):
   ```bash
   soroban contract deploy --wasm target/wasm32-unknown-unknown/release/lumilend.wasm --network testnet --source <your-identity>
   ```

4. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```
   Add `.env` inside `frontend/` directory with:
   `VITE_CONTRACT_ID=your-deployed-contract-address`

5. **Run the local dev server:**
   ```bash
   npm run dev
   ```

## Running Smart Contract Tests

To run the automated test suite covering `deposit`, `request_loan`, `repay_loan`, liquidation logic, and various contract error states, navigate to the `contracts/lumilend` directory and run:

```bash
cd contracts/lumilend
cargo test
```

### Test Output

The contract features a robust set of tests designed to enforce borrowing and liquidity constraints. Below is the successful output verifying the smart contract's integrity:

```text
running 6 tests
test test::test_borrow_exceeds_liquidity_fails - should panic ... ok
test test::test_deposit_success ... ok
test test::test_double_borrow_fails - should panic ... ok
test test::test_liquidate_before_due_fails - should panic ... ok
test test::test_borrow_success ... ok
test test::test_repay_success ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s
```
