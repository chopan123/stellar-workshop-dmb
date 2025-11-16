#![no_std]
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
    pub fn __constructor(e: Env, router_address: Address) {
        set_soroswap_router_address(&e, router_address);
    }

    pub fn swap(e: Env, caller: Address, token_in: Address, token_out: Address, amount: i128) -> Result<i128, SoroswapError> {
        caller.require_auth();
        check_nonnegative_amount(amount)?;
        extend_instance_ttl(&e);

        // First transfer the tokens from the user to this contract
        let token_client = token::Client::new(&e, &token_in);
        token_client.transfer(&caller, e.current_contract_address(), &amount);

        // Setting up Soroswap router client
        let soroswap_router_address = get_soroswap_router_address(&e);
        let soroswap_router_client = SoroswapRouterClient::new(&e, &soroswap_router_address);

        let pair_address = soroswap_router_client.router_pair_for(&token_in, &token_out);

        let mut path: Vec<Address> = Vec::new(&e);
        path.push_back(token_in.clone());
        path.push_back(token_out.clone());

        let mut swap_args: Vec<Val> = vec![&e];
        swap_args.push_back(caller.into_val(&e)); // From
        swap_args.push_back(pair_address.into_val(&e)); // To
        swap_args.push_back(amount.into_val(&e)); // Amount

        e.authorize_as_current_contract(vec![
            &e,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token_in.clone(),
                    fn_name: Symbol::new(&e, "transfer"),
                    args: swap_args.clone(),
                },
                sub_invocations: vec![&e],
            }),
        ]);

        let swap_result = soroswap_router_client.swap_exact_tokens_for_tokens(
            &amount, // Amount In
            &0, // Min amount out, 0 for simplicity here you would put your slippage
            &path, // Route
            &caller, // To, the tokens are being sent to the caller during the swap
            &u64::MAX, // deadline,  is timestamp
        );

        let total_swapped_amount = swap_result.last().unwrap();

        Ok(total_swapped_amount)
    }
}
