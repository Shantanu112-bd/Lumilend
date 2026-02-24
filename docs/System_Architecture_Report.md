# LumiLend — System Architecture & Implementation Report

## 1. Project Overview & Current State
The **LumiLend Decentralized Micro-Lending Pool** has successfully met all development criteria. The application functions as a fully featured Web3 lending protocol operating on the Stellar Testnet, built in alignment with the Black Belt Level 3 submission requirements.

The application allows users to permissionlessly supply liquidity (XLM) to earn a fixed interest rate, and lets borrowers dynamically draw from the shared pool while enforcing strict on-chain due dates.

*   **Status:** Deployed / Production-Ready (Testnet)
*   **Operating Network:** Stellar Testnet (`https://soroban-testnet.stellar.org`)
*   **Contract Target:** `wasm32-unknown-unknown`
*   **Web Standard:** HTML5 / React 18 / Tailwind CSS v3

---

## 2. Infrastructure & Technical Stack

### Smart Contract Backend (Soroban / Rust)
*   **Environment:** `#![no_std]` Rust implementation compiled to `WASM`.
*   **State Management:** The contract stores four primary layers of data mapped via keys (`DataKey` Enum):
    1.  `PoolState`: Tracks global `total_deposited`, `total_lent`, and the `interest_rate_bps`.
    2.  `LenderRecord`: A map tethered to user addresses holding their individual deposit sum and timestamp.
    3.  `LoanRecord`: A ledger of all active, defaulted, or repaid loans indexed by an auto-incrementing `loan_id`.
    4.  `ActiveLoan(Address)`: Cross-references a borrower's wallet to ensure only **one** active loan is permitted at a time.
*   **Security & Error Handling:** Explicit bounds check for pool liquidity. Borrowers cannot drain unbacked funds, and the logic validates signatures against `from.require_auth()`. All custom error handling maps perfectly to `ContractError` integers (e.g., `InsufficientPoolLiquidity`).
*   **Testing Coverage:** Complete. The `src/test.rs` file provides full integration tests that scaffold simulated testnet nodes, allocate admin tokens, and verify that depositing, borrowing, repaying, liquidity drainage errors, and dual-borrow faults operate as intended.

### Web Frontend Application (React / Vite)
*   **Build Engine:** Vite serving a highly-optimized React v18 DOM.
*   **Wallet Integration:** Deeply integrated with `@stellar/freighter-api` (v6.0.1). It utilizes the updated `getAddress()` flows, enforcing checks for wallet installation via `isConnected()`, checking permissions via `isAllowed()`, and securely piping the user's signature.
*   **Blockchain Communication:** `@stellar/stellar-sdk` uses raw XDR serialization. The `submitSorobanTransaction` logic dynamically calculates fees (`100` stroops standard), simulates operations checking resource limits, prepares XDR envelopes, passes it back for Freighter user authorization, and watches `Server.getTransaction` loops until ledger finality is confirmed.

---

## 3. UI/UX Condition & Functionality Breakdown

The user interface was built to directly mirror the premium aesthetics defined in the *DeFi for everyone* parameters.

### App Container & Dashboard (`App.jsx` & `PoolDashboard.jsx`)
*   **Visual Aesthetics:** Deep purples and `stellar-light` `#1a0b2e` variants act as the backdrop. The application wraps elements in `.card` components utilizing `backdrop-blur-md` and glassmorphism transparency.
*   **State Management:** Handles all active states globally (`wallet`, `balance`, `poolStats`, `activeLoan`) to ensure a reactive layout. Switching between *Lender* and *Borrower* tabs unmounts and mounts the respective flows instantly.
*   **Dashboard Execution:** On load (and post-transaction), the dashboard runs a simulation call to `get_pool_stats` fetching the real-time liquidity ratio and dynamically calculates the user's percentage slice of the overall pool share mathematically based on their deposited `LenderRecord` data. 

### Deposit Flow (`DepositForm.jsx`)
*   Provides a clean input bound to the native `fetchXlmBalance` endpoint via Horizon limits.
*   Features a built-in `MAX` shortcut.
*   Validation prevents hitting the deposit method if the user seeks an amount inferior to `1` XLM or superior to their current holdings.

### Borrow Flow (`BorrowForm.jsx`)
*   Requires inputs bounded between `5 XLM` and `100 XLM` over a defined duration slider (`7-30` days).
*   **Live Preview Matrix:** Before clicking submit, the interface immediately pulls the `poolStats.interest_rate_bps`, does fractional arithmetic against the inputted amount, and previews the exact XLM `Interest` and `Total Due` they will be expected to repay.

### Core Repayment Engine (`ActiveLoanCard.jsx`)
*   If `fetchActiveLoan` returns a valid active entry in the database, the borrow form is explicitly blocked and replaced with the Active Loan monitoring card.
*   **Logic Gates:** Validates `(Date.now() / 1000) > loan.due_timestamp` locally on the frontend render step to dynamically paint the UI borders red alerting them to an expected Default.
*   Button pipelines the `loan_id` securely through `repay_loan(loan_id)`.

### Event Toasting Engine (`TransactionToast.jsx`)
*   Every blockchain interaction triggers `TransactionToast`.
*   Includes `success`, `error`, and fallback mechanisms. Crucially, successful queries embed the `submitRes.hash` generated by the transaction builder natively into the toast component as a hyperlink:
    `https://stellar.expert/explorer/testnet/tx/{hash}`.

---

## 4. Final Verification
The architecture is solid, dependency issues regarding Freighter versions natively injecting top level browser calls have been mitigated, CSS is bundled flawlessly leveraging PostCSS plugin wrappers, and structural hierarchy is configured directly out-of-the-box using Vite's rollups. 

The project is complete.
