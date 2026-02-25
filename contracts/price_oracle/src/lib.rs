#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    pub fn initialize(env: Env) {
        // Set mock prices (price with 7 decimals)
        // XML = 10% of USD => 0.10 => 1_000_000 stroops
        env.storage().instance().set(&symbol_short!("XLM"), &1_000_000i128);
        // USDC = 1 USD => 1.00 => 10_000_000 stroops
        env.storage().instance().set(&symbol_short!("USDC"), &10_000_000i128);
    }

    pub fn set_price(env: Env, asset: Symbol, price: i128) {
        env.storage().instance().set(&asset, &price);
    }

    pub fn get_price(env: Env, asset: Symbol) -> i128 {
        env.storage().instance().get(&asset).unwrap_or(0)
    }
}
