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

## Running Tests
To run the automated tests covering `deposit`, `request_loan`, `repay_loan`, and error states:

```bash
cd contracts/lumilend
cargo run test -- --nocapture
```
You should see 6 passing tests.
