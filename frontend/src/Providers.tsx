import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  // Replace with your Crossmint API key
  // Get it from: https://www.crossmint.com/console/projects/apiKeys
  const apiKey = import.meta.env.VITE_CROSSMINT_API_KEY || "<crossmint-client-api-key>";

  return (
    <CrossmintProvider apiKey={apiKey}>
      <CrossmintAuthProvider
        // Configure available login methods
        // Options: "email", "google", "twitter", "farcaster", "web3"
        loginMethods={["email", "google", "twitter", "farcaster", "web3"]}
        authModalTitle="Sign in to Stellar Workshop"
        // Optional: Customize the appearance
        appearance={{
          borderRadius: "12px",
          colors: {
            background: "#ffffff",
            textPrimary: "#000000",
            accent: "#2667ff",
          },
        }}
      >
        <CrossmintWalletProvider
          createOnLogin={{
            chain: "stellar", // Change to "stellar" for mainnet
            signer: {
              type: "email", // For Stellar: "email" | "phone" | "api-key" | "external-wallet" (passkey not supported on Stellar)
            },
          }}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}

