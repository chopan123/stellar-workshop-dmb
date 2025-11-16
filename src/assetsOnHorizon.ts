import {
  Asset,
  Keypair,
  TransactionBuilder,
  Operation,
  LiquidityPoolAsset,
  getLiquidityPoolId,
  BASE_FEE,
  Networks,
  Horizon,
} from "@stellar/stellar-sdk";
import { HorizonApi } from "@stellar/stellar-sdk/lib/horizon";
import { config } from "dotenv";
config();

// Initialize Horizon server for Stellar testnet
const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org");

/**
 * Helper function to load account with retry logic
 *
 * Horizon sometimes needs time to process ledger closes, so this function
 * retries loading an account with exponential backoff to handle timing issues.
 */
async function loadAccountWithRetry(publicKey: string, maxRetries: number = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await horizonServer.loadAccount(publicKey);
    } catch (error) {
      if (i === maxRetries - 1) {
        // Last retry failed, throw the error
        throw error;
      }
      // Wait before retrying (exponential backoff: 1s, 2s, 3s, 4s, 5s)
      const delay = (i + 1) * 2000;
      console.log(`⏳ Retry ${i + 1}/${maxRetries} loading account in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to load account after retries");
}

/**
 * 🌟 STELLAR WORKSHOP 🌟
 *
 * This script demonstrates the complete lifecycle of creating a custom asset on Stellar:
 * 1. Create wallets (Asset Creator, Token Holder, Trader)
 * 2. Create a custom asset (PLTA token)
 * 3. Issue tokens and remove minting ability
 * 4. Create a liquidity pool (PLTA/XLM)
 * 5. Perform asset swaps via path payments
 */

async function stellarWorkshop() {
  console.log("🚀 Starting Stellar Workshop!");
  console.log("=" .repeat(60));

  try {
    // ========================================
    // STEP 1: CREATE WALLETS
    // ========================================
    console.log("\n📝 STEP 1: Creating Wallets");
    console.log("-".repeat(30));

    // Create the asset creator wallet (will issue the PLTA token)
    const assetCreatorWallet = Keypair.random();
    console.log("🏛️  Asset Creator Wallet created:");
    console.log(`   Public Key: ${assetCreatorWallet.publicKey()}`);
    console.log(`   Secret Key: ${assetCreatorWallet.secret()}`);

    // Create the token holder wallet (will receive and hold tokens)
    const tokenHolderWallet = Keypair.random();
    console.log("\n💰 Token Holder Wallet created:");
    console.log(`   Public Key: ${tokenHolderWallet.publicKey()}`);
    console.log(`   Secret Key: ${tokenHolderWallet.secret()}`);

    // Create the trader wallet (will swap XLM for PLTA tokens)
    const traderWallet = Keypair.random();
    console.log("\n🏪 Trader Wallet created:");
    console.log(`   Public Key: ${traderWallet.publicKey()}`);
    console.log(`   Secret Key: ${traderWallet.secret()}`);

    // ========================================
    // STEP 2: FUND WALLETS WITH TESTNET XLM
    // ========================================
    console.log("\n💳 STEP 2: Funding Wallets with Testnet XLM");
    console.log("-".repeat(30));

    console.log("🤖 Funding Asset Creator wallet with Friendbot...");
    await horizonServer.friendbot(assetCreatorWallet.publicKey()).call();
    console.log("✅ Asset Creator wallet funded successfully");

    console.log("🤖 Funding Token Holder wallet with Friendbot...");
    await horizonServer.friendbot(tokenHolderWallet.publicKey()).call();
    console.log("✅ Token Holder wallet funded successfully");

    console.log("🤖 Funding Trader wallet with Friendbot...");
    await horizonServer.friendbot(traderWallet.publicKey()).call();
    console.log("✅ Trader wallet funded successfully");

    // Check initial balances
    const assetCreatorAccount = await loadAccountWithRetry(assetCreatorWallet.publicKey());
    const tokenHolderAccount = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    const traderAccount = await loadAccountWithRetry(traderWallet.publicKey());

    console.log(`\n💰 Initial XLM balances:`);
    console.log(`   Asset Creator: ${assetCreatorAccount.balances[0].balance} XLM`);
    console.log(`   Token Holder: ${tokenHolderAccount.balances[0].balance} XLM`);
    console.log(`   Trader: ${traderAccount.balances[0].balance} XLM`);

    // ========================================
    // STEP 3: CREATE CUSTOM ASSET (PLTA TOKEN)
    // ========================================
    console.log("\n🪙 STEP 3: Creating Custom Asset (PLTA Token)");
    console.log("-".repeat(30));

    // Create the PLTA asset - issued by the Asset Creator
    const PLTA_ASSET = new Asset("PLTA", assetCreatorWallet.publicKey());
    console.log(`🏗️  PLTA Asset created:`);
    console.log(`   Asset Code: PLTA`);
    console.log(`   Issuer: ${assetCreatorWallet.publicKey()}`);

    // ========================================
    // STEP 4: ESTABLISH TRUSTLINE FOR PLTA ASSET
    // ========================================
    console.log("\n🤝 STEP 4: Creating Trustline for PLTA Asset");
    console.log("-".repeat(30));

    // The Token Holder must create a trustline to receive PLTA tokens
    console.log("📄 Creating trustline from Token Holder to PLTA asset...");

    let tokenHolderAccountUpdated = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    
    const trustlineTransaction = new TransactionBuilder(tokenHolderAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.changeTrust({
      asset: PLTA_ASSET
    }))
    .setTimeout(30)
    .build();

    trustlineTransaction.sign(tokenHolderWallet);
    await horizonServer.submitTransaction(trustlineTransaction);
    console.log("✅ Trustline created successfully");

    // ========================================
    // STEP 5: ISSUE PLTA TOKENS
    // ========================================
    console.log("\n🏭 STEP 5: Issuing PLTA Tokens");
    console.log("-".repeat(30));

    // Issue 1,000,000 PLTA tokens to the Token Holder
    const TOKEN_SUPPLY = "1000000"; // 1 million PLTA tokens
    
    console.log(`💰 Issuing ${TOKEN_SUPPLY} PLTA tokens to Token Holder...`);

    let assetCreatorAccountUpdated = await loadAccountWithRetry(assetCreatorWallet.publicKey());
    console.log("🚀 | stellarWorkshop | assetCreatorAccountUpdated:", assetCreatorAccountUpdated)
    
    const issueTokensTransaction = new TransactionBuilder(assetCreatorAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.payment({
      destination: tokenHolderWallet.publicKey(),
      asset: PLTA_ASSET,
      amount: TOKEN_SUPPLY
    }))
    .setTimeout(30)
    .build();

    issueTokensTransaction.sign(assetCreatorWallet);
    await horizonServer.submitTransaction(issueTokensTransaction);
    console.log("✅ PLTA tokens issued successfully");

    // ========================================
    // STEP 6: REMOVE MINTING ABILITY (LOCK SUPPLY)
    // ========================================
    console.log("\n🔒 STEP 6: Removing Minting Ability");
    console.log("-".repeat(30));

    console.log("🚫 Setting Asset Creator account options to disable further minting...");

    assetCreatorAccountUpdated = await loadAccountWithRetry(assetCreatorWallet.publicKey());
    
    const lockSupplyTransaction = new TransactionBuilder(assetCreatorAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.setOptions({
      masterWeight: 0, // Remove ability to sign transactions
      lowThreshold: 1,
      medThreshold: 1,
      highThreshold: 1
    }))
    .setTimeout(30)
    .build();

    lockSupplyTransaction.sign(assetCreatorWallet);
    await horizonServer.submitTransaction(lockSupplyTransaction);
    console.log("✅ Asset Creator account locked - no more PLTA tokens can be minted");

    // Check Token Holder balance
    tokenHolderAccountUpdated = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    console.log(`\n📊 Token Holder now holds:`);
    tokenHolderAccountUpdated.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`   ${balance.balance} XLM`);
      } else {
        console.log(`   ${balance.balance} ${(balance as HorizonApi.BalanceLineAsset).asset_code}`);
      }
    });

    // ========================================
    // STEP 7: CREATE LIQUIDITY POOL (PLTA/XLM)
    // ========================================
    console.log("\n🏊 STEP 7: Creating Liquidity Pool (PLTA/XLM)");
    console.log("-".repeat(30));

    // Create XLM/PLTA liquidity pool asset (XLM comes first lexicographically)
    const XLM_ASSET = Asset.native();
    const liquidityPoolAsset = new LiquidityPoolAsset(XLM_ASSET, PLTA_ASSET, 30); // 0.30% fee
    const poolId = getLiquidityPoolId("constant_product", liquidityPoolAsset).toString('hex');
    
    console.log(`🏊 Creating XLM/PLTA liquidity pool:`);
    console.log(`   Pool ID: ${poolId}`);
    console.log(`   Fee: 0.30%`);

    // Token Holder creates trustline to the liquidity pool
    console.log("🤝 Creating trustline to liquidity pool...");

    tokenHolderAccountUpdated = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    
    const poolTrustlineTransaction = new TransactionBuilder(tokenHolderAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.changeTrust({
      asset: liquidityPoolAsset,
    }))
    .setTimeout(30)
    .build();

    poolTrustlineTransaction.sign(tokenHolderWallet);
    await horizonServer.submitTransaction(poolTrustlineTransaction);
    console.log("✅ Pool trustline created");

    // ========================================
    // STEP 8: DEPOSIT LIQUIDITY TO POOL
    // ========================================
    console.log("\n💧 STEP 8: Depositing Liquidity to Pool");
    console.log("-".repeat(30));

    // Deposit liquidity: 1000 XLM + 500,000 PLTA (1 XLM = 500 PLTA initial rate)
    const XLM_DEPOSIT = "1000";
    const PLTA_DEPOSIT = "500000";
    
    console.log(`💰 Depositing liquidity:`);
    console.log(`   ${XLM_DEPOSIT} XLM`);
    console.log(`   ${PLTA_DEPOSIT} PLTA`);
    console.log(`   Initial rate: 1 XLM = 500 PLTA`);

    tokenHolderAccountUpdated = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    
    const depositLiquidityTransaction = new TransactionBuilder(tokenHolderAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.liquidityPoolDeposit({
      liquidityPoolId: poolId,
      maxAmountA: XLM_DEPOSIT, // XLM amount
      maxAmountB: PLTA_DEPOSIT, // PLTA amount
      minPrice: "0.0001",
      maxPrice: "10000"
    }))
    .setTimeout(30)
    .build();

    depositLiquidityTransaction.sign(tokenHolderWallet);
    await horizonServer.submitTransaction(depositLiquidityTransaction);
    console.log("✅ Liquidity deposited successfully");

    // Check pool balances
    tokenHolderAccountUpdated = await loadAccountWithRetry(tokenHolderWallet.publicKey());
    console.log(`\n📊 Token Holder balances after liquidity deposit:`);
    tokenHolderAccountUpdated.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`   ${balance.balance} XLM`);
      } else if (balance.asset_type === 'credit_alphanum4') {
        console.log(`   ${balance.balance} ${balance.asset_code}`);
      } else if (balance.asset_type === 'liquidity_pool_shares') {
        console.log(`   ${balance.balance} LP Shares`);
      }
    });

    // ========================================
    // STEP 9: TRADER SWAPS XLM FOR PLTA
    // ========================================
    console.log("\n🔄 STEP 9: Trader Swaps XLM for PLTA");
    console.log("-".repeat(30));

    // First, trader needs to create trustline to PLTA
    console.log("🤝 Creating trustline from Trader to PLTA asset...");

    let traderAccountUpdated = await loadAccountWithRetry(traderWallet.publicKey());
    
    const traderTrustlineTransaction = new TransactionBuilder(traderAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.changeTrust({
      asset: PLTA_ASSET,
      limit: "1000000000"
    }))
    .setTimeout(30)
    .build();

    traderTrustlineTransaction.sign(traderWallet);
    await horizonServer.submitTransaction(traderTrustlineTransaction);
    console.log("✅ Trader trustline to PLTA created");

    // Now perform the swap: 100 XLM for PLTA tokens
    const SWAP_AMOUNT = "100";
    
    console.log(`🔄 Performing path payment:`);
    console.log(`   Sending: ${SWAP_AMOUNT} XLM`);
    console.log(`   Receiving: PLTA tokens (market rate)`);
    console.log(`   Path: XLM → PLTA (via liquidity pool)`);

    traderAccountUpdated = await loadAccountWithRetry(traderWallet.publicKey());
    
    const pathPaymentTransaction = new TransactionBuilder(traderAccountUpdated, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(Operation.pathPaymentStrictSend({
      sendAsset: XLM_ASSET,
      sendAmount: SWAP_AMOUNT,
      destination: traderWallet.publicKey(),
      destAsset: PLTA_ASSET,
      destMin: "1", // Minimum PLTA to receive (very low for demo)
      path: [] // Direct swap through AMM
    }))
    .setTimeout(30)
    .build();

    pathPaymentTransaction.sign(traderWallet);
    await horizonServer.submitTransaction(pathPaymentTransaction);
    console.log("✅ Path payment executed successfully");

    // ========================================
    // STEP 10: FINAL RESULTS
    // ========================================
    console.log("\n🎉 STEP 10: Final Results");
    console.log("-".repeat(30));

    // Check final balances
    traderAccountUpdated = await loadAccountWithRetry(traderWallet.publicKey());
    
    console.log(`\n📊 Final Trader balances:`);
    traderAccountUpdated.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`   ${balance.balance} XLM`);
      } else if (balance.asset_type === 'credit_alphanum4') {
        console.log(`   ${balance.balance} ${balance.asset_code}`);
      }
    });

    // ========================================
    // WORKSHOP SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(60));
    console.log("🎓 WORKSHOP SUMMARY");
    console.log("=".repeat(60));
    console.log("\n✨ What we accomplished:");
    console.log("   1. ✅ Created 3 wallets (Asset Creator, Token Holder, Trader)");
    console.log("   2. ✅ Created custom PLTA asset");
    console.log("   3. ✅ Issued 1,000,000 PLTA tokens");
    console.log("   4. ✅ Locked token supply (no more minting possible)");
    console.log("   5. ✅ Created XLM/PLTA liquidity pool");
    console.log("   6. ✅ Deposited liquidity (1000 XLM + 500,000 PLTA)");
    console.log("   7. ✅ Performed asset swap (XLM → PLTA)");
    
    console.log("\n🔗 Important addresses:");
    console.log(`   PLTA Asset: ${PLTA_ASSET.code}:${PLTA_ASSET.issuer}`);
    console.log(`   Liquidity Pool ID: ${poolId}`);
    console.log(`   Token Holder: ${tokenHolderWallet.publicKey()}`);
    console.log(`   Trader: ${traderWallet.publicKey()}`);
    
    console.log("\n🌟 Key learning points:");
    console.log("   • Custom assets require trustlines before receiving");
    console.log("   • Asset supply can be locked by setting issuer account options");
    console.log("   • Liquidity pools enable decentralized trading");
    console.log("   • Path payments can swap assets through pools");
    console.log("   • All transactions are recorded on the Stellar ledger");
    
    console.log("\n🚀 Workshop completed successfully!");
    console.log("Explore these assets on Stellar Expert: https://stellar.expert/explorer/testnet");

  } catch (error) {
    console.error("\n❌ Workshop Error:", error);
    if (error instanceof Error && 'response' in error) {
      const errorWithResponse = error as any;
      if (errorWithResponse.response && errorWithResponse.response.data) {
        console.error("🔍 Error details:", errorWithResponse.response.data);
      }
    }
  }
}

// Execute the workshop
stellarWorkshop();