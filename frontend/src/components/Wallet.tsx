import { useState, useEffect } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import type { Balances } from "@crossmint/wallets-sdk";

export function Wallet() {
  const { wallet, status } = useWallet();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loaded" && wallet) {
      const fetchBalances = async () => {
        setLoadingBalance(true);
        setBalanceError(null);
        try {
          const balanceData = await wallet.balances();
          setBalances(balanceData);
        } catch (error) {
          console.error("Failed to fetch balances:", error);
          setBalanceError("Failed to load balance");
        } finally {
          setLoadingBalance(false);
        }
      };

      fetchBalances();
      // Refresh balances every 10 seconds
      const interval = setInterval(fetchBalances, 10000);
      return () => clearInterval(interval);
    } else {
      setBalances(null);
    }
  }, [wallet, status]);

  if (status === "in-progress") {
    return <div className="wallet-status">Loading wallet...</div>;
  }

  if (status === "loaded" && wallet) {
    return (
      <div className="wallet-info">
        <div className="wallet-status">Connected</div>
        <div className="wallet-address">{wallet.address}</div>
        {loadingBalance && <div className="wallet-balance-loading">Loading balance...</div>}
        {balanceError && <div className="wallet-balance-error">{balanceError}</div>}
        {balances && !loadingBalance && (
          <div className="wallet-balances">
            {balances.nativeToken && (
              <div className="wallet-balance-item">
                <span className="balance-amount">
                  {parseFloat(balances.nativeToken.amount).toFixed(4)}
                </span>
                <span className="balance-symbol">{balances.nativeToken.symbol || "XLM"}</span>
              </div>
            )}
            {balances.usdc && parseFloat(balances.usdc.amount) > 0 && (
              <div className="wallet-balance-item">
                <span className="balance-amount">
                  {parseFloat(balances.usdc.amount).toFixed(4)}
                </span>
                <span className="balance-symbol">{balances.usdc.symbol || "USDC"}</span>
              </div>
            )}
            {balances.tokens && balances.tokens.length > 0 && balances.tokens.map((token, index) => (
              <div key={index} className="wallet-balance-item">
                <span className="balance-amount">
                  {parseFloat(token.amount).toFixed(4)}
                </span>
                <span className="balance-symbol">{token.symbol || token.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="wallet-status">Wallet not connected</div>;
}

