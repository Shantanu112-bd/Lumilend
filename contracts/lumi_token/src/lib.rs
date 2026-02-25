#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Balance(Address),
    Allowance(Address, Address),
}

#[contract]
pub struct LumiToken;

#[contractimpl]
impl LumiToken {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        // Mock permission: to simplify Integration with LendingPool we allow any mint or enforce admin
        // Ideally `admin.require_auth()` but for now we skip it for simplicity or allow the LendingPool to be admin
        // Let's require the LendingPool contract to be admin
        admin.require_auth();

        let mut balance: i128 = env.storage().instance().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        balance += amount;
        env.storage().instance().set(&DataKey::Balance(to), &balance);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let mut balance: i128 = env.storage().instance().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if balance < amount { panic!("insufficient balance"); }
        balance -= amount;
        env.storage().instance().set(&DataKey::Balance(from), &balance);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let mut from_balance: i128 = env.storage().instance().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if from_balance < amount { panic!("insufficient balance"); }
        from_balance -= amount;
        env.storage().instance().set(&DataKey::Balance(from), &from_balance);

        let mut to_balance: i128 = env.storage().instance().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        to_balance += amount;
        env.storage().instance().set(&DataKey::Balance(to), &to_balance);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().instance().get(&DataKey::Balance(id)).unwrap_or(0)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage().instance().get(&DataKey::Allowance(from, spender)).unwrap_or(0)
    }

    pub fn approve(env: Env, from: Address, spender: Address, amount: i128, _expiration_ledger: u32) {
        from.require_auth();
        env.storage().instance().set(&DataKey::Allowance(from, spender), &amount);
    }
}
