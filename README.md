# LumiLend — Stellar Micro-Lending Pool
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://lumilend.vercel.app)

**LumiLend** is a decentralized, non-custodial micro-lending pool built on the Stellar network using Soroban smart contracts. It enables users to deposit XLM to earn yields or securely borrow XLM against fixed dynamic parameters.

## Live Demo
https://lumilend.vercel.app

## Features & Characteristics

LumiLend is engineered with a modern, high-end technical architecture with the following distinct features:

### Smart Contract Backend (Soroban/Rust)
- **Escrow Pool Liquidity:** All XLM deposited by lenders is held securely in the smart contract's decentralized pool.
- **Dynamic Yield & Fixed Rates:** Built-in fixed interest rates (5% per period) calculated seamlessly on-chain.
- **On-Chain Tracking:** Complete ledger state management using Soroban `DataKey` structures for tracking Lender balances, Active Loans, and global Pool Stats.
- **Automated Default Logic:** Secure endpoints block unauthorized repayments. Built-in logic flags and allows liquidation of defaulted loans passing their `due_timestamp`.
- **Robust Security Integration:** Full constraint checks natively in Rust (preventing loans exceeding pool liquidity, verifying auth payloads, checking minimum balances).

### Frontend Application (React 18 + Vite)
- **Stellar Wallets Kit Integration:** Full secure connection with the Freighter wallet on the Stellar Testnet.
- **Modern UI/UX:** Built using Tailwind CSS with glassmorphism, dynamic glowing orbs, elegant dark mode, and seamless micro-animations.
- **Live Data Sync:** Efficient edge caching mapping to the Soroban RPC to simulate and read ledger states cleanly without spamming network requests.
- **Action Previews:** Reactively updates your total Repayment amount and calculates precise Due Dates explicitly before you submit the Soroban transaction.
- **Lost ID Auto-Recovery:** Seamless integration where the frontend can automatically recover lost active loan instances directly from the blockchain map by simulating generic queries if local storage drops.
- **Comprehensive Error Handling:** Intelligent parsing of Soroban VM `ContractError` enum variants into human-readable UI warnings (e.g., "Insufficient pool liquidity", "You already have an active loan").

## Deployed Contract Information
- **Contract ID:** `CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ`
- **Network:** Stellar Testnet (`https://soroban-testnet.stellar.org`)
- **Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ)

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Web3 Integrations:** `@creit.tech/stellar-wallets-kit`, `@stellar/stellar-sdk`
- **Smart Contract:** Soroban, Rust (`wasm32-unknown-unknown`)

## Prerequisites
- Node.js 18+
- Rust toolchain
- Soroban CLI (`stellar-cli`)
- Freighter Wallet (browser extension connected to Testnet)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd lumilend
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```
   Add a `.env` file inside the `frontend/` directory with:
   ```env
   VITE_CONTRACT_ID=CDZIMDXFK5NNH2EWV3LG7JDDMDZFNZUMUWDSHEHAJ6YHO2C43JJOWKIZ
   ```

3. **Run the local dev server:**
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
