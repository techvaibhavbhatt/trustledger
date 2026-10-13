import "./globals.css";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const monadTestnet = {
  chainId: 10143,
  networkId: 10143,
  name: "Monad Testnet",
  chainName: "Monad Testnet",
  iconUrls: ["https://docs.monad.xyz/img/favicon.ico"],
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.monadvision.com"],
  vanityName: "Monad Testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DynamicContextProvider
          settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
            walletConnectors: [EthereumWalletConnectors],
            overrides: {
              evmNetworks: [monadTestnet],
            },
          }}
        >
          {children}
        </DynamicContextProvider>
      </body>
    </html>
  );
}