import DefindexSDK, { CreateDefindexVaultDepositDto, SupportedNetworks } from "@defindex/sdk";
import { Horizon, Keypair, Networks, rpc, scValToNative, TransactionBuilder } from "@stellar/stellar-sdk";
import { config } from "dotenv";
config();

// ========================================
// CONSTANTS
// ========================================
const TESTNET_HORIZON_URL = "https://horizon-testnet.stellar.org";
const TESTNET_SOROBAN_URL = "https://soroban-testnet.stellar.org";

// ========================================
// SERVER INITIALIZATION
// ========================================
const horizonServer = new Horizon.Server(TESTNET_HORIZON_URL);
const sorobanServer = new rpc.Server(TESTNET_SOROBAN_URL);

const defindexSdk = new DefindexSDK({
    apiKey: process.env.DEFINDEX_API_KEY,
})

// ========================================
// MAIN WORKSHOP FUNCTION
// ========================================

/**
 * DeFindex Workshop: Demonstrates vault creation and deposit flows
 *
 * Flow:
 * 1. Create vault manager wallet and fund it
 * 2. Configure and create a new DeFindex vault with initial deposit
 * 3. Create a separate depositor wallet
 * 4. Make an additional deposit to the vault from the depositor
 */
async function defindexWorkshop() {
    console.log("🚀 Starting DeFindex Workshop!");
    console.log("=".repeat(70));

    try {
        // ========================================
        // STEP 1: CREATE VAULT MANAGER WALLET
        // ========================================
        console.log("\n📝 STEP 1: Creating Vault Manager Wallet");
        console.log("=".repeat(40));

        const keyPair = Keypair.random();
        console.log("🏛️  Vault Manager wallet created:");
        console.log(`   Public Key: ${keyPair.publicKey()}`);
        console.log(`   Secret Key: ${keyPair.secret()}`);

        // Fund the vault manager wallet via Soroban airdrop
        console.log("\n💰 Requesting airdrop for vault manager...");
        await sorobanServer.requestAirdrop(keyPair.publicKey());
        console.log("✅ Vault manager funded successfully");

        // ========================================
        // STEP 2: CONFIGURE VAULT
        // ========================================
        console.log("\n⚙️  STEP 2: Configuring Vault Parameters");
        console.log("=".repeat(40));

        /**
         * Vault Configuration:
         * - Roles: Define who can manage different aspects of the vault
         *   - 0: Emergency Manager (can pause vault in emergencies)
         *   - 1: Fee Receiver (receives vault management fees)
         *   - 2: Manager (general vault management)
         *   - 3: Rebalance Manager (can rebalance assets across strategies)
         * - vault_fee_bps: Fee in basis points (2000 = 20%)
         * - assets: Assets the vault will manage and their strategies
         * - soroswap_router: Router contract for swaps
         * - name_symbol: Vault name and share token symbol
         * - upgradable: Whether vault contract can be upgraded
         */
        const vaultConfig: CreateDefindexVaultDepositDto = {
            roles: {
                0: keyPair.publicKey(), // Emergency Manager
                1: keyPair.publicKey(), // Fee Receiver
                2: keyPair.publicKey(), // Manager
                3: keyPair.publicKey()  // Rebalance Manager
            },
            vault_fee_bps: 2000, // 20% management fee
            assets: [{
                address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // Asset contract
                strategies: [{
                    address: "CCSPRGGUP32M23CTU7RUAGXDNOHSA6O2BS2IK4NVUP5X2JQXKTSIQJKE", // Strategy contract
                    name: "XLM Strategy",
                    paused: false // Strategy is active
                }]
            }],
            soroswap_router: "CCMAPXWVZD4USEKDWRYS7DA4Y3D7E2SDMGBFJUCEXTC7VN6CUBGWPFUS", // Testnet Soroswap router
            name_symbol: { name: "TestVault", symbol: "TV" },
            upgradable: true,
            caller: keyPair.publicKey(),
            amounts: [100000000],        // Initial deposit amounts (100 tokens with 7 decimals)
            deposit_amounts: [100000000] // Amounts to deposit during vault creation
        };

        console.log("📋 Vault Configuration:");
        console.log(`   Name: ${vaultConfig.name_symbol.name}`);
        console.log(`   Symbol: ${vaultConfig.name_symbol.symbol}`);
        console.log(`   Fee: ${vaultConfig.vault_fee_bps / 100}%`);
        console.log(`   Manager: ${keyPair.publicKey()}`);
        console.log(`   Assets: ${vaultConfig.assets.length}`);
        console.log(`   Initial Deposit: ${vaultConfig.deposit_amounts[0] / 10000000} tokens`);

        // ========================================
        // STEP 3: CREATE VAULT WITH INITIAL DEPOSIT
        // ========================================
        console.log("\n🏗️  STEP 3: Creating Vault with Initial Deposit");
        console.log("=".repeat(40));

        console.log("🔨 Building vault creation transaction...");
        const createVaultResponse = await defindexSdk.createVaultWithDeposit(
            vaultConfig,
            SupportedNetworks.TESTNET
        );

        console.log("✅ Transaction built successfully");
        console.log("📝 Signing transaction with vault manager...");

        // Parse, sign and submit the vault creation transaction
        const tx = TransactionBuilder.fromXDR(createVaultResponse.xdr!, Networks.TESTNET);
        tx.sign(keyPair);

        console.log("📤 Submitting vault creation transaction...");
        const txResponse = await defindexSdk.sendTransaction(tx.toXDR(), SupportedNetworks.TESTNET);

        // Extract vault contract address from response
        const vaultContract = txResponse.returnValue;
        console.log("\n🎉 Vault created successfully!");
        console.log(`📋 Vault Contract Address: ${vaultContract}`);
        console.log(`💰 Initial deposit of ${vaultConfig.deposit_amounts[0] / 10000000} tokens completed`);

        // ========================================
        // STEP 4: CREATE DEPOSITOR WALLET
        // ========================================
        console.log("\n👤 STEP 4: Creating Additional Depositor");
        console.log("=".repeat(40));

        // Create a new wallet to demonstrate external deposits
        const depositor = Keypair.random();
        console.log("🏦 Depositor wallet created:");
        console.log(`   Public Key: ${depositor.publicKey()}`);
        console.log(`   Secret Key: ${depositor.secret()}`);

        console.log("\n💰 Requesting airdrop for depositor...");
        await sorobanServer.requestAirdrop(depositor.publicKey());
        console.log("✅ Depositor funded successfully");

        // ========================================
        // STEP 5: DEPOSIT TO VAULT
        // ========================================
        console.log("\n💸 STEP 5: Making Deposit to Vault");
        console.log("=".repeat(40));

        const depositAmount = 10000000000; // 1000 tokens with 7 decimals
        console.log(`📊 Deposit details:`);
        console.log(`   Depositor: ${depositor.publicKey()}`);
        console.log(`   Amount: ${depositAmount / 10000000} tokens`);
        console.log(`   Slippage tolerance: 5%`);
        console.log(`   Invest immediately: No (keep as idle)`);

        console.log("\n🔨 Building deposit transaction...");
        const depositResponse = await defindexSdk.depositToVault(
            vaultContract,
            {
                caller: depositor.publicKey(),
                amounts: [depositAmount],
                slippageBps: 500,  // 5% slippage tolerance
                invest: false       // Don't invest into strategies, keep as idle
            },
            SupportedNetworks.TESTNET
        );

        console.log("✅ Transaction built successfully");
        console.log("📝 Signing transaction with vault manager (authorization)...");

        // Parse and sign the deposit transaction
        const depositTx = TransactionBuilder.fromXDR(depositResponse.xdr!, Networks.TESTNET);
        depositTx.sign(depositor);

        // Small delay to ensure transaction readiness
        console.log("⏳ Preparing transaction...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("📤 Submitting deposit transaction...");
        const depositTxResponse = await defindexSdk.sendTransaction(
            depositTx.toXDR(),
            SupportedNetworks.TESTNET
        );

        const depositEndResponse = depositTxResponse.returnValue;
        console.log("\n🎉 Deposit completed successfully!");
        console.log("📊 Deposit Response:", depositEndResponse);

        // ========================================
        // FINAL SUMMARY
        // ========================================
        console.log("\n" + "=".repeat(70));
        console.log("🎓 Workshop Summary");
        console.log("=".repeat(70));
        console.log("\n✨ What we accomplished:");
        console.log("   1. ✅ Created vault manager wallet");
        console.log("   2. ✅ Configured vault with roles and strategies");
        console.log(`   3. ✅ Created vault: ${vaultContract}`);
        console.log(`   4. ✅ Made initial deposit: ${vaultConfig.deposit_amounts[0] / 10000000} tokens`);
        console.log("   5. ✅ Created depositor wallet");
        console.log(`   6. ✅ Made additional deposit: ${depositAmount / 10000000} tokens`);

        console.log("\n🔗 Important Addresses:");
        console.log(`   Vault Contract: ${vaultContract}`);
        console.log(`   Vault Manager: ${keyPair.publicKey()}`);
        console.log(`   Depositor: ${depositor.publicKey()}`);

        console.log("\n🌟 Key Learning Points:");
        console.log("   • DeFindex vaults manage multiple assets with configurable strategies");
        console.log("   • Roles define granular permissions (emergency, fees, management, rebalancing)");
        console.log("   • Vaults can be created with an initial deposit in one transaction");
        console.log("   • External users can deposit into existing vaults");
        console.log("   • Deposits can be kept idle or immediately invested into strategies");

        console.log("\n🚀 Workshop completed successfully!");

    } catch (error) {
        console.error("\n❌ Workshop Error:", error);
        if (error instanceof Error) {
            console.error("🔍 Error message:", error.message);
            if ('response' in error) {
                const errorWithResponse = error as any;
                if (errorWithResponse.response?.data) {
                    console.error("🔍 Error details:", errorWithResponse.response.data);
                }
            }
        }
    }
}

// Execute the workshop
defindexWorkshop();
