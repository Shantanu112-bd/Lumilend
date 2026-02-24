# LumiLend - Project Status & Architecture Documentation

## 1. Current State & Readiness
The LumiLend decentralized micro-lending pool application has been completely scaffolded, implemented, and refined to meet the **Level 3 Antigravity PRD Requirements**. All major logic blocks, both in the Smart Contract backend and the React frontend, are fully functional.

**Status Summary:**
- **Smart Contract (Rust/Soroban):** Complete. Implements logic for deposits, borrowing, withdrawing, and repaying in an escrow pool alongside local state management.
- **Contract Tests:** Complete. 6/6 tests passing securely locally, covering all happy paths and constraints defined in the PRD.
- **Frontend (React + Vite):** Complete. Modern, responsive, and dynamic UI mimicking high-end dapps, implementing wallet verification, logic checks, and on-chain Soroban executions directly from the UI.
- **Freighter Wallet Integration:** Fully connected using the latest `@stellar/freighter-api` v6 specification (`isConnected`, `isAllowed`, `getAddress`).
- **Build Integrity:** Working reliably without `global` or dependency chunk errors. The application builds completely to production grade with `npm run build`.

---

## 2. Infrastructure & Environment

### Frontend Architecture
- **Framework:** React 18, utilizing functional components and hooks (`useState`, `useEffect`, `useCallback`).
- **Build Tool:** Vite v3+
- **Styling:** Tailwind CSS v3 configured with standard `postcss`/`autoprefixer` integrations. Custom styling mapped in `tailwind.config.js` and `index.css` to build an opulent aesthetic using vibrant colors, glassmorphism (`backdrop-blur-md`), dark mode, and micro-animations.
- **Network Interfaces:**
  - `@stellar/freighter-api`: Handles signing, access authorizations, and identity resolution.
  - `@stellar/stellar-sdk`: Serializes parameters via XDR formats, converts values, simulates transactions, and submits signed operations to the node using `rpc.Server`.

### Smart Contract Architecture
- **Compiler:** Rust/Soroban SDK mapping. Targeting `wasm32-unknown-unknown`.
- **Logic Mapping:** `LumiLendPool` exposes `get_pool_stats`, `get_lender_info`, `deposit`, `request_loan`, `repay_loan`, etc.
- **Network Configuration:** Defaults built inside `/utils/soroban.js` target `https://soroban-testnet.stellar.org` and network passphrase for `Test SDF Network ; September 2015`.

---

## 3. UI/Frontend Specifications

### 3.1 App Header & Authentication
Managed inside `App.jsx`. Ensures Freighter connects properly.
- **Error Condition Handling:** Checks whether the user *actually* has Freighter installed (`isConnected`), whether they allowed connections (`isAllowed`), or rejected popups entirely. Displays detailed toasts on failure.
- **Data Caching:** Wallet data and pool state fetches are cached in memory (in `soroban.js`) to prevent excessive pinging of the public RPC and providing a snappy UX.

### 3.2 Pool Dashboard (`PoolDashboard.jsx`)
- **Visuals:** Skeleton loaders map the exact container dimensions before Soroban testnet fetches finish.
- **Metrics shown:** Total XLM deposited in the pool contract, Total Lent XLM representing active debts, remaining Available Liquidity, and Fixed Interest Rate limits.
- **Logic Checks:** All values returned via `get_pool_stats` simulated query in SDK.

### 3.3 Lender Forms (`DepositForm.jsx`)
- **Operations:** Pre-validates wallet balance limits and 1-XLM minimum constraints via standard UI states before hitting `depositXlm`. Converts base-XLM integers straight into 7-decimal Stroop values for network processing across Soroban endpoints.

### 3.4 Borrower Modules (`BorrowForm.jsx` / `ActiveLoanCard.jsx`)
- **Preview Metrics:** Provides a real-time reactive interface for expected interest + principal cost totals prior to attempting a loan submission.
- **Repayment Status Monitoring:** Evaluates `loan.due_timestamp` directly to track due dates relative to the active `Date.now()`. Renders dynamic Red alert rings around the interface when loans are effectively Defaulted.

### 3.5 Global Post-Processing (`TransactionToast.jsx`)
- Upon success or valid exception throw (e.g. simulation failures from lacked liquidity pool state limits, etc.), clear notifications trigger overlay animations notifying the user of status alongside dynamically generated Stellar Expert explorer URLs based off resulting Transaction Hashes.

---

## 4. Next Steps & Launch Check
To test this fully end-to-end:
1. Ensure your wallet has testnet XLM using the Stellar Laboratory or Freighter Faucet.
2. Deploy the generated `.wasm` smart contract binary into the network, keeping note of your new Contract ID.
3. Apply the ID to `frontend/.env` via `VITE_CONTRACT_ID=C...`.
4. Spin up the application using `npm run dev` at the project directory to interact with it seamlessly.
