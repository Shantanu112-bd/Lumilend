# LumiLend — Stellar Micro-Lending Pool
[![CI/CD Pipeline](https://github.com/Shantanu112-bd/Lumilend/actions/workflows/deploy.yml/badge.svg)](https://github.com/Shantanu112-bd/Lumilend/actions/workflows/deploy.yml) 
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://frontend-lac-psi-36.vercel.app)

**LumiLend** is a decentralized, non-custodial micro-lending pool built on the Stellar network using Soroban smart contracts. It enables users to deposit XLM to earn yields or securely borrow XLM against fixed dynamic parameters.

## Live Demo
- **Website**: https://frontend-lac-psi-36.vercel.app
- **Video Walkthrough**: [Watch on Loom](https://www.loom.com/share/6a54b3d7ec624b03ab6dad8265ed1075)

## Features & Characteristics

LumiLend is engineered with a modern, high-end technical architecture with the following distinct features designed for both active Lenders and Borrowers.

### Core Roles & Functionality
- **Lenders:** Users can seamlessly deposit XLM into the decentralized liquidity pool. Their deposited amounts are tracked on-chain, and they naturally accrue yield over time as borrowers pay standard fixed-interest rates back into the shared pool.
- **Borrowers:** Users can request short-term, micro-loans ranging from **5 to 100 XLM** against the pool. The application strictly checks the pool's remaining available liquidity before approving the loan. Borrowers can choose flexible repayment duration sliders between 7 and 90 days.

### Smart Contract Architecture (Rust/Soroban)
- **Escrow Pool Liquidity & Mathematical Precision:** All XLM deposited by lenders is held securely in the smart contract's decentralized pool. Calculations use native 128-bit integer scaling to seamlessly process Stellar's native `10^7` stroop decimal accuracy.
- **Dynamic Yield & Fixed Rates:** Built-in fixed interest rates (5% per period) calculated seamlessly on-chain depending on the total pool distribution.
- **On-Chain State Tracking:** Complete ledger state management using Soroban `DataKey` structures for tracking individual Lender balances, mapping loan structs `(principal, interest, status)`, and calculating global overarching Pool Stats natively.
- **Automated Default & Liquidations:** Secure endpoints naturally block unauthorized repayments. Built-in logic flags and allows permissionless liquidation functions of defaulted loans securely if the loan passes its strict `due_timestamp` epoch.
- **Robust Security Integration:** Full constraint checks natively integrated in Rust using Soroban Auth scopes (`from.require_auth()`). This prevents loans from exceeding active pool liquidity, guarantees signature payloads, and enforces baseline integer constraints (like $>0$ XLM deposits).

### Frontend Interface (React 18 + Vite)
- **Stellar Wallets Kit Integration:** Full secure connection with the Freighter wallet (or xBull via modular setup) natively hooked to the Stellar Testnet. This fully abstracts the transaction signing flow.
- **Premium UI & Glassmorphism:** Built entirely with advanced Tailwind CSS featuring frosted glass layers (`backdrop-blur-xl`), animated glowing background orbs, elegant dark mode palettes, and seamless transition states scaling natively on mobile and desktop.
- **Intelligent Edge Caching:** Efficient local caching mapped to the `rpc.Server` SDK, simulating and reading ledger states safely without overwhelming network requests or unnecessarily freezing the UI. 
- **Reactive Action Previews:** Dynamically updates your total Repayment amount, interest values, and parses precise human-readable Due Dates concurrently as you slide the Borrow duration slider — explicitly before submitting the transaction.
- **Lost ID Auto-Recovery Scanner:** Seamless fallback mechanism where the Web UI can automatically recover lost active loan instances. If `localStorage` is cleared, the system scans generic loan IDs on the blockchain mapping to the connected wallet, recovering the session state effortlessly.
- **Comprehensive Error Mapping:** Intelligent translation of Soroban VM `ContractError` enumerations into actionable, human-readable React Toast warnings (e.g., dynamically resolving `Error(Contract, #4)` to *"You already have an active loan. Please repay it first."*).

## Deployed Contract Information & Submission Artifacts
- **LendingPool Contract ID:** `CDTPCOTNCQXWKZLPGF56QWZ6TWNP3I4YYYK7G3ABCNT5DQGB4VKSA4J2`
- **PriceOracle Contract ID:** `CAXH2PKPWKWFF7TXLGITWH7M6TFZAIOKIPAX2OOFKU2N355YGARPUOP5`
- **LumiToken (Reward Token) Contract ID:** `CABLMCLLYYTCFJ6AG7TKF6WBGMSWKQDEDM2BNJZNQKMIG3VERPFDUHPC`
- **Network:** Stellar Testnet (`https://soroban-testnet.stellar.org`)

### Inter-Contract Call Transaction Hash
*(Please replace the placeholder below with the actual hash of a successful transaction where the Lending Pool interacts natively with the PriceOracle or LumiToken)*
- **Transaction Hash:** `[INSERT_TRANSACTION_HASH_HERE]`

### Explorer Links
- [View Lending Pool on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDTPCOTNCQXWKZLPGF56QWZ6TWNP3I4YYYK7G3ABCNT5DQGB4VKSA4J2)
- [View PriceOracle on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAXH2PKPWKWFF7TXLGITWH7M6TFZAIOKIPAX2OOFKU2N355YGARPUOP5)
- [View LumiToken on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CABLMCLLYYTCFJ6AG7TKF6WBGMSWKQDEDM2BNJZNQKMIG3VERPFDUHPC)

## Visual Artifacts
### CI/CD Pipeline
![CI/CD Pipeline Status](https://github.com/Shantanu112-bd/Lumilend/actions/workflows/deploy.yml/badge.svg)

### Mobile Responsive View
*(Please make sure to add your mobile screenshot named `mobile-view.png` to the repository root)*
![Mobile Responsive View](./mobile-view.png)

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
   NEXT_PUBLIC_LENDING_POOL_CONTRACT_ID=CDTPCOTNCQXWKZLPGF56QWZ6TWNP3I4YYYK7G3ABCNT5DQGB4VKSA4J2
   NEXT_PUBLIC_PRICE_ORACLE_CONTRACT_ID=CAXH2PKPWKWFF7TXLGITWH7M6TFZAIOKIPAX2OOFKU2N355YGARPUOP5
   NEXT_PUBLIC_LUMI_TOKEN_CONTRACT_ID=CABLMCLLYYTCFJ6AG7TKF6WBGMSWKQDEDM2BNJZNQKMIG3VERPFDUHPC
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
   
   VITE_CONTRACT_ID=CDTPCOTNCQXWKZLPGF56QWZ6TWNP3I4YYYK7G3ABCNT5DQGB4VKSA4J2
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_SOROBAN_RPC=https://soroban-testnet.stellar.org
   VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
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

### Test Output Screenshot
![Tests](./test-output.png)

### Test Output Text
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
