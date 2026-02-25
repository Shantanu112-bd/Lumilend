#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, token};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    InsufficientPoolLiquidity = 2,
    InsufficientBalance = 3,
    LoanAlreadyActive = 4,
    LoanNotFound = 5,
    LoanNotActive = 6,
    RepaymentTooLow = 7,
    NotYetDefaulted = 8,
    Unauthorized = 9,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    PoolState,
    Lender(Address),
    Loan(u64),
    NextLoanId,
    ActiveLoan(Address),
    Oracle(Address),
    OracleAddress,
    RewardTokenAddress,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolState {
    pub total_deposited: i128,
    pub total_lent: i128,
    pub interest_rate_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LenderRecord {
    pub amount: i128,
    pub deposit_timestamp: u64,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRecord {
    pub borrower: Address,
    pub principal: i128,
    pub interest_owed: i128,
    pub due_timestamp: u64,
    pub status: LoanStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolStats {
    pub total_deposited: i128,
    pub total_lent: i128,
    pub available: i128,
    pub interest_rate_bps: u32,
}

#[contract]
pub struct LumiLendPool;

#[contractimpl]
impl LumiLendPool {
    pub fn initialize(env: Env, token: Address, interest_rate_bps: u32, oracle: Address, reward_token: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::PoolState) {
            return Err(ContractError::AlreadyInitialized);
        }
        
        let pool_state = PoolState {
            total_deposited: 0,
            total_lent: 0,
            interest_rate_bps,
        };
        env.storage().instance().set(&DataKey::PoolState, &pool_state);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::OracleAddress, &oracle);
        env.storage().instance().set(&DataKey::RewardTokenAddress, &reward_token);
        env.storage().instance().set(&DataKey::NextLoanId, &1u64);
        
        Ok(())
    }

    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<(), ContractError> {
        from.require_auth();
        if amount <= 0 {
            return Err(ContractError::InsufficientBalance);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        let mut pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        pool_state.total_deposited += amount;
        env.storage().instance().set(&DataKey::PoolState, &pool_state);

        let lender_key = DataKey::Lender(from.clone());
        let mut lender_record: LenderRecord = env.storage().instance().get(&lender_key).unwrap_or(LenderRecord {
            amount: 0,
            deposit_timestamp: env.ledger().timestamp(),
        });

        lender_record.amount += amount;
        lender_record.deposit_timestamp = env.ledger().timestamp();
        env.storage().instance().set(&lender_key, &lender_record);

        Ok(())
    }

    pub fn withdraw(env: Env, from: Address, amount: i128) -> Result<(), ContractError> {
        from.require_auth();
        if amount <= 0 {
            return Err(ContractError::InsufficientBalance);
        }

        let lender_key = DataKey::Lender(from.clone());
        let mut lender_record: LenderRecord = env.storage().instance().get(&lender_key).unwrap_or(LenderRecord {
            amount: 0,
            deposit_timestamp: 0,
        });

        if lender_record.amount < amount {
            return Err(ContractError::InsufficientBalance);
        }

        let mut pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        if pool_state.total_deposited - pool_state.total_lent < amount {
            return Err(ContractError::InsufficientPoolLiquidity);
        }

        pool_state.total_deposited -= amount;
        lender_record.amount -= amount;

        env.storage().instance().set(&DataKey::PoolState, &pool_state);
        env.storage().instance().set(&lender_key, &lender_record);

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &from, &amount);

        Ok(())
    }

    pub fn request_loan(env: Env, from: Address, amount: i128, duration_days: u32) -> Result<u64, ContractError> {
        from.require_auth();
        
        let active_loan_key = DataKey::ActiveLoan(from.clone());
        if env.storage().instance().has(&active_loan_key) {
            return Err(ContractError::LoanAlreadyActive);
        }

        let mut pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        
        if pool_state.total_deposited - pool_state.total_lent < amount {
            return Err(ContractError::InsufficientPoolLiquidity);
        }

        // Fetch price from oracle just to demonstrate cross-contract collateral valuation logic
        let oracle_addr: Address = env.storage().instance().get(&DataKey::OracleAddress).unwrap();
        use soroban_sdk::{symbol_short, vec, IntoVal};
        let _price: i128 = env.invoke_contract(
            &oracle_addr, 
            &symbol_short!("get_price"), 
            vec![&env, symbol_short!("XLM").into_val(&env)]
        );

        let interest_owed = amount * (pool_state.interest_rate_bps as i128) / 10000;
        
        pool_state.total_lent += amount;
        env.storage().instance().set(&DataKey::PoolState, &pool_state);

        let loan_id: u64 = env.storage().instance().get(&DataKey::NextLoanId).unwrap();
        env.storage().instance().set(&DataKey::NextLoanId, &(loan_id + 1));

        let duration_secs = (duration_days as u64) * 86400;
        let due_timestamp = env.ledger().timestamp() + duration_secs;

        let loan_record = LoanRecord {
            borrower: from.clone(),
            principal: amount,
            interest_owed,
            due_timestamp,
            status: LoanStatus::Active,
        };

        env.storage().instance().set(&DataKey::Loan(loan_id), &loan_record);
        env.storage().instance().set(&active_loan_key, &loan_id);

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &from, &amount);

        Ok(loan_id)
    }

    pub fn repay_loan(env: Env, from: Address, loan_id: u64) -> Result<(), ContractError> {
        from.require_auth();

        let mut loan_record: LoanRecord = env.storage().instance().get(&DataKey::Loan(loan_id)).ok_or(ContractError::LoanNotFound)?;

        if loan_record.borrower != from {
            return Err(ContractError::Unauthorized);
        }

        if loan_record.status != LoanStatus::Active {
            return Err(ContractError::LoanNotActive);
        }

        let total_owed = loan_record.principal + loan_record.interest_owed;

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        
        token_client.transfer(&from, &env.current_contract_address(), &total_owed);

        loan_record.status = LoanStatus::Repaid;
        env.storage().instance().set(&DataKey::Loan(loan_id), &loan_record);
        env.storage().instance().remove(&DataKey::ActiveLoan(from.clone()));

        let mut pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        pool_state.total_lent -= loan_record.principal;
        pool_state.total_deposited += loan_record.interest_owed;
        env.storage().instance().set(&DataKey::PoolState, &pool_state);

        // Mint LUMI rewards on successful repayment within due_timestamp
        // (Assuming on-time if the transaction succeeds, we check due_date)
        if env.ledger().timestamp() <= loan_record.due_timestamp {
            if let Some(reward_token_addr) = env.storage().instance().get::<_, Address>(&DataKey::RewardTokenAddress) {
                // Reward is dynamically scaled, for instance 10% of principal in LUMI
                let reward_amount = loan_record.principal / 10;
                use soroban_sdk::{symbol_short, vec, IntoVal};
                let _ = env.invoke_contract::<()>(
                    &reward_token_addr,
                    &symbol_short!("mint"),
                    vec![&env, from.into_val(&env), reward_amount.into_val(&env)]
                );
            }
        }

        Ok(())
    }

    pub fn liquidate_defaulted(env: Env, loan_id: u64) -> Result<(), ContractError> {
        let mut loan_record: LoanRecord = env.storage().instance().get(&DataKey::Loan(loan_id)).ok_or(ContractError::LoanNotFound)?;

        if loan_record.status != LoanStatus::Active {
            return Err(ContractError::LoanNotActive);
        }

        if env.ledger().timestamp() <= loan_record.due_timestamp {
            return Err(ContractError::NotYetDefaulted);
        }

        loan_record.status = LoanStatus::Defaulted;
        env.storage().instance().set(&DataKey::Loan(loan_id), &loan_record);
        env.storage().instance().remove(&DataKey::ActiveLoan(loan_record.borrower.clone()));

        let mut pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap();
        pool_state.total_deposited -= loan_record.principal;
        pool_state.total_lent -= loan_record.principal;
        env.storage().instance().set(&DataKey::PoolState, &pool_state);

        Ok(())
    }

    pub fn get_pool_stats(env: Env) -> PoolStats {
        let pool_state: PoolState = env.storage().instance().get(&DataKey::PoolState).unwrap_or(PoolState {
            total_deposited: 0,
            total_lent: 0,
            interest_rate_bps: 0,
        });

        PoolStats {
            total_deposited: pool_state.total_deposited,
            total_lent: pool_state.total_lent,
            available: pool_state.total_deposited - pool_state.total_lent,
            interest_rate_bps: pool_state.interest_rate_bps,
        }
    }

    pub fn get_lender_info(env: Env, lender: Address) -> LenderRecord {
        env.storage().instance().get(&DataKey::Lender(lender)).unwrap_or(LenderRecord {
            amount: 0,
            deposit_timestamp: 0,
        })
    }

    pub fn get_loan(env: Env, loan_id: u64) -> Result<LoanRecord, ContractError> {
        env.storage().instance().get(&DataKey::Loan(loan_id)).ok_or(ContractError::LoanNotFound)
    }
}
#[cfg(test)]
mod test;
