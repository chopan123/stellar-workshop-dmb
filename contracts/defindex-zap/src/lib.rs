#![no_std]
use soroban_sdk::{
    Address, Env, Vec, contract, contractimpl, vec
};

mod defindex_vault;
mod soroswap_router;
mod storage;
mod error;

use defindex_vault::DeFindexVaultClient;
use soroswap_router::SoroswapRouterClient;
use storage::{
    extend_instance_ttl, get_vault_address, set_vault_address, get_soroswap_router_address, set_soroswap_router_address
};
use error::DeFindexError;

use crate::storage::{get_underlying_asset_address, set_underlying_asset_address};

/// Validates that the amount is non-negative
///
/// Prevents arithmetic issues and invalid swap amounts
pub fn check_nonnegative_amount(amount: i128) -> Result<(), DeFindexError> {
    if amount < 0 {
        Err(DeFindexError::NegativeNotAllowed)
    } else {
        Ok(())
    }
}

#[contract]
struct DeFindexSimple;

#[contractimpl]
impl DeFindexSimple {
    pub fn __constructor(e: Env, vault_address: Address, router_address: Address, underlying_asset: Address) {
        set_vault_address(&e, vault_address);
        set_soroswap_router_address(&e, router_address);
        set_underlying_asset_address(&e, underlying_asset);
    }

    pub fn deposit(e: Env, caller: Address, token_in: Address, amount: i128) -> Result<i128, DeFindexError> {
        caller.require_auth();
        check_nonnegative_amount(amount)?;
        extend_instance_ttl(&e);

        let underlying_asset = get_underlying_asset_address(&e);

        let soroswap_router_address = get_soroswap_router_address(&e);
        let soroswap_router_client = SoroswapRouterClient::new(&e, &soroswap_router_address);

        let mut path: Vec<Address> = Vec::new(&e);
        path.push_back(token_in.clone());
        path.push_back(underlying_asset.clone());

        let swap_result = soroswap_router_client.swap_exact_tokens_for_tokens(
            &amount,     // Exact amount to swap
            &0,          // Minimum amount out (0 for simplicity; use slippage calculation in production)
            &path,       // Swap route
            &caller,     // Recipient of output tokens (tokens go back to the original caller)
            &u64::MAX,   // Deadline (max for simplicity; use actual timestamp in production)
        );

        let total_swapped_amount = swap_result.last().unwrap();

        let defindex_vault_address = get_vault_address(&e);
        let defindex_vault_client = DeFindexVaultClient::new(&e, &defindex_vault_address);

        defindex_vault_client.deposit(
            &vec![&e, total_swapped_amount], 
            &vec![&e, 0], 
            &caller, 
            &false
        );

        Ok(total_swapped_amount)
    }
}
