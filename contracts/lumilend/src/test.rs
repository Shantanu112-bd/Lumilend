#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

#[contract]
pub struct MockOracle;

#[contractimpl]
impl MockOracle {
    pub fn get_price(_env: Env, _asset: soroban_sdk::Symbol) -> i128 {
        1000000 // Mock XLM price 0.10 USD
    }

    pub fn mint(_env: Env, _to: Address, _amount: i128) {
        // Mock mint
    }
}

fn setup_test() -> (Env, LumiLendPoolClient<'static>, Address, Address, Address, TokenClient<'static>, TokenAdminClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin_client = TokenAdminClient::new(&env, &token_contract.address());
    let token_client = TokenClient::new(&env, &token_contract.address());

    let oracle_id = env.register_contract(None, MockOracle);

    let contract_id = env.register_contract(None, LumiLendPool);
    let client = LumiLendPoolClient::new(&env, &contract_id);
    
    let lender = Address::generate(&env);
    let borrower = Address::generate(&env);

    client.initialize(&token_contract.address(), &500, &oracle_id, &oracle_id); // 5% interest rate

    (env, client, lender, borrower, admin, token_client, token_admin_client)
}

#[test]
fn test_deposit_success() {
    let (env, client, lender, _borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_deposited, 50);

    let lender_info = client.get_lender_info(&lender);
    assert_eq!(lender_info.amount, 50);
}

#[test]
fn test_borrow_success() {
    let (env, client, lender, borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    let loan_id = client.request_loan(&borrower, &20, &14);
    assert_eq!(loan_id, 1);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_lent, 20);
    assert_eq!(stats.available, 30);

    let borrower_balance = token_client.balance(&borrower);
    assert_eq!(borrower_balance, 20);
}

#[test]
fn test_repay_success() {
    let (env, client, lender, borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    let loan_id = client.request_loan(&borrower, &20, &14);

    // Borrower needs extra to pay interest, minting some to test repayment
    token_admin.mint(&borrower, &5);
    
    client.repay_loan(&borrower, &loan_id);

    let loan = client.get_loan(&loan_id);
    assert_eq!(loan.status, LoanStatus::Repaid);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_lent, 0);
    // Interest is ~ 20 * 500 / 10000 = 1
    assert_eq!(stats.total_deposited, 51); 
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #2)")]
fn test_borrow_exceeds_liquidity_fails() {
    let (env, client, lender, borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    client.request_loan(&borrower, &60, &14);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #4)")]
fn test_double_borrow_fails() {
    let (env, client, lender, borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    client.request_loan(&borrower, &10, &14);
    client.request_loan(&borrower, &10, &14); // should fail
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #8)")]
fn test_liquidate_before_due_fails() {
    let (env, client, lender, borrower, _admin, token_client, token_admin) = setup_test();

    token_admin.mint(&lender, &1000);
    client.deposit(&lender, &50);

    let loan_id = client.request_loan(&borrower, &20, &14);

    // Time has not progressed, trying to liquidate
    client.liquidate_defaulted(&loan_id);
}
