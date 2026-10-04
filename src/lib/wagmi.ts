import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import type { Chain } from 'viem';
import { BRAND, POLL_MS, activeChain } from '../config';

/**
 * Wallets:
 * - Every browser wallet that supports EIP-6963 (MetaMask, Rabby, OKX, Coinbase / Base, Trust, Zerion, ...)
 *   is discovered automatically and listed by its own name and icon.
 * - `injected` covers older wallets that only expose window.ethereum.
 * - `coinbaseWallet` opens the Base / Coinbase Wallet app when its extension is not installed.
 * Auto-reconnect is off; WalletProvider reconnects only the wallet the user picked on this site.
 *
 * RPC use: the public QMS endpoint is shared and rate limited (50 requests a second per address), so reads made in
 * the same moment are batched into one Multicall3 call and one HTTP request, and polling is slower than a block.
 */
export function createWagmi(chain: Chain) {
  return createConfig({
    chains: [chain],
    connectors: [
      injected({ shimDisconnect: true }),
      coinbaseWallet({ appName: BRAND.name, version: '4', preference: { options: 'eoaOnly' } }),
    ],
    transports: { [chain.id]: http(undefined, { batch: { wait: 20, batchSize: 50 }, retryCount: 3, retryDelay: 400 }) },
    batch: { multicall: { wait: 20 } },
    pollingInterval: POLL_MS,
    multiInjectedProviderDiscovery: true,
  });
}

export let wagmiConfig = createWagmi(activeChain);
export function initWagmi(chain: Chain) {
  wagmiConfig = createWagmi(chain);
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof createWagmi>;
  }
}
