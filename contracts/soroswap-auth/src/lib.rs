#![no_std]
//! # Soroswap Auth - Aggregator Pattern with Authorization
//!
//! This contract demonstrates the **aggregator pattern** where the contract acts as an authorized
//! intermediary between the user and the Soroswap Router.
//!
//! ## Key Characteristics:
//! - Contract receives tokens from the user first (takes custody)
//! - Contract must explicitly authorize the Router's token transfers
//! - Requires `authorize_as_current_contract` to create authorization context
//! - Token flow: User → Contract → Router (Pair) → User
//!
//! ## Why Authorization Context is Required:
//! When this contract calls the Soroswap Router, the router will internally call `token.transfer()`
//! to move tokens to the liquidity pair. Since the user only authorized THIS contract (not the
//! router directly), we must create an authorization context that allows the router to execute
//! the token transfer on the user's behalf.
//!
//! Without `authorize_as_current_contract`, the router's token transfer would fail with an
//! authorization error, because the authorization chain would be broken.
//!
//! ## Authorization Chain:
//! 1. User signs transaction → Authorizes THIS contract
//! 2. THIS contract calls `authorize_as_current_contract` → Authorizes the Router's sub-invocation
//! 3. Router can now transfer tokens from user to pair

use soroban_sdk::{
    Address, Env, IntoVal, Symbol, Val, Vec, auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation}, contract, contractimpl, token, vec
};

mod soroswap_router;
mod storage;
mod error;

use soroswap_router::SoroswapRouterClient;
use storage::{
    extend_instance_ttl, get_soroswap_router_address, set_soroswap_router_address,
};
use error::SoroswapError;

/// Validates that the amount is non-negative
///
/// Prevents arithmetic issues and invalid swap amounts
pub fn check_nonnegative_amount(amount: i128) -> Result<(), SoroswapError> {
    if amount < 0 {
        Err(SoroswapError::NegativeNotAllowed)
    } else {
        Ok(())
    }
}

#[contract]
struct SoroswapAuth;

#[contractimpl]
impl SoroswapAuth {
    /// Initialize the contract with the Soroswap Router address
    ///
    /// This address is stored and used for all subsequent swap operations
    pub fn __constructor(e: Env, router_address: Address) {
        set_soroswap_router_address(&e, router_address);
    }

    /// Execute a token swap via Soroswap Router with explicit authorization context
    ///
    /// ## Authorization Flow (Why This is Different from Simple Proxy):
    /// Unlike the simple proxy pattern, this contract acts as an intermediary that requires
    /// explicit authorization handling:
    ///
    /// 1. User authorizes THIS contract via `caller.require_auth()`
    /// 2. Contract optionally receives tokens from user (takes custody)
    /// 3. Contract creates authorization context with `authorize_as_current_contract`
    /// 4. This context allows the Router to transfer tokens on the user's behalf
    /// 5. Router executes the swap and sends output tokens to the user
    ///
    /// ## Why `authorize_as_current_contract` is Needed:
    /// The Soroswap Router will internally call `token.transfer(from=caller, to=pair, amount)`
    /// to move tokens into the liquidity pair for the swap. However, the caller's original
    /// signature only authorized calling THIS contract - not the router directly.
    ///
    /// We create a `SubContractInvocation` that explicitly authorizes this specific token
    /// transfer, effectively saying: "I (this contract) am authorized by the caller, and I
    /// authorize this specific transfer operation during the router call."
    ///
    /// Without this authorization context, the router's token transfer would fail because
    /// the authorization chain would be broken (caller → this contract → ❌ router).
    ///
    /// ## Parameters:
    /// - `caller`: The user executing the swap (must sign the transaction)
    /// - `token_in`: Token being sold
    /// - `token_out`: Token being purchased
    /// - `amount`: Amount of `token_in` to swap
    ///
    /// ## Returns:
    /// Amount of `token_out` received from the swap
    pub fn swap(e: Env, caller: Address, token_in: Address, token_out: Address, amount: i128) -> Result<i128, SoroswapError> {
        // Verify the caller has signed this transaction
        caller.require_auth();
        check_nonnegative_amount(amount)?;
        extend_instance_ttl(&e);

        // Transfer tokens from the user to this contract (contract takes custody)
        // The user's signature authorizes this transfer
        let token_client = token::Client::new(&e, &token_in);
        token_client.transfer(&caller, e.current_contract_address(), &amount);

        // Get the stored Soroswap Router address and create client
        let soroswap_router_address = get_soroswap_router_address(&e);
        let soroswap_router_client = SoroswapRouterClient::new(&e, &soroswap_router_address);

        // Get the pair address for this token pair
        let pair_address = soroswap_router_client.router_pair_for(&token_in, &token_out);

        // Build the swap path (direct pair: token_in -> token_out)
        let mut path: Vec<Address> = Vec::new(&e);
        path.push_back(token_in.clone());
        path.push_back(token_out.clone());

        // Prepare the arguments for the token transfer that will happen inside the router
        // This represents: token.transfer(from=caller, to=pair, amount=amount)
        let mut transfer_args: Vec<Val> = vec![&e];
        transfer_args.push_back(caller.into_val(&e));         // From: original caller
        transfer_args.push_back(pair_address.into_val(&e));   // To: liquidity pair
        transfer_args.push_back(amount.into_val(&e));         // Amount to transfer

        // CRITICAL: Create authorization context for the sub-contract invocation
        // This tells the Soroban runtime: "When the router calls token.transfer() with these
        // exact arguments, I (the current contract) authorize it on behalf of my caller"
        //
        // The SubContractInvocation specifies:
        // - Which contract will be called (token_in)
        // - Which function will be invoked ("transfer")
        // - What arguments will be passed (transfer_args)
        //
        // This creates a secure authorization chain: caller → this contract → router → token
        e.authorize_as_current_contract(vec![
            &e,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token_in.clone(),                // The token contract being authorized
                    fn_name: Symbol::new(&e, "transfer"),      // The function being authorized
                    args: transfer_args.clone(),               // The exact arguments allowed
                },
                sub_invocations: vec![&e],                     // No further nested invocations
            }),
        ]);

        // Execute the swap through the router
        // The authorization context above allows the router to transfer tokens from the caller
        // to the pair, even though the caller didn't directly authorize the router
        let swap_result = soroswap_router_client.swap_exact_tokens_for_tokens(
            &amount,     // Exact amount to swap
            &0,          // Minimum amount out (0 for simplicity; use slippage calculation in production)
            &path,       // Swap route
            &caller,     // Recipient of output tokens (tokens go back to the original caller)
            &u64::MAX,   // Deadline (max for simplicity; use actual timestamp in production)
        );

        // Return the amount of token_out received
        let total_swapped_amount = swap_result.last().unwrap();

        Ok(total_swapped_amount)
    }
}
