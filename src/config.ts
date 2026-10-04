import { defineChain, type Chain } from 'viem';

const env = import.meta.env;

/** Brand shown across the site. The logo can be replaced from the admin panel (Branding). */
export const BRAND = {
  name: 'Quantly',
  tagline: 'NFT Launchpad & Marketplace',
  logo: 'https://res.cloudinary.com/otqaz5kp/image/upload/v1791035090/photo_2026-10-03_19-14-32.jpg',
  /** Shown if the logo above cannot load (it ships with the site). */
  logoFallback: '/logo.svg',
  /** The marketplace banner: the background of the home page's first screen and the picture in link previews. */
  banner: 'https://res.cloudinary.com/otqaz5kp/image/upload/v1791034907/quantily-banner-2500x1500.png',
  /** Tried if the banner above cannot load (the same artwork under its other link). */
  bannerAlt: 'https://res.cloudinary.com/otqaz5kp/image/upload/v1791033013/quantly_banner_2500x1500.jpg',
  /** The headline printed over the banner. Set to false if the banner artwork already carries these words. */
  bannerHeadline: true,
};

/** Native coin and its wrapped form on the chain this build trades on (offers are paid in the wrapped coin). */
export const NATIVE = (env.VITE_NATIVE_SYMBOL || 'QMS').trim();
export const WRAPPED = (env.VITE_WRAPPED_SYMBOL || `W${NATIVE}`).trim();

/**
 * The marketplace's own collection. Name, supply and artwork are set in the admin panel (Branding), so the
 * values below are only placeholders; its contract address comes from the backend config.
 */
export const OFFICIAL = {
  name: 'Quantly Genesis',
  slug: 'official',
  supply: null as number | null,
  x: env.VITE_OFFICIAL_X || '',
  logo: '/logo.svg',
  banner: '',
  /** Official artwork, used for previews and showcases. Empty until the admin adds some. */
  images: [] as string[],
};

/** Image links the admin panel may set: https, or ipfs:// (opened through a gateway). */
const IMAGE_LINK = /^(https:\/\/[^\s"'<>\\]{4,500}|ipfs:\/\/[A-Za-z0-9._\-/]{10,500})$/;
const NAME = /^[^\s<>"'\\][^<>"'\\]{0,39}$/;
export interface Branding {
  logo?: string | null;
  officialName?: string | null;
  officialSupply?: number | null;
  officialLogo?: string | null;
  officialBanner?: string | null;
  officialImages?: string[] | null;
}

/** Applies the logo and official-collection details set in the admin panel (read once at start-up, before the first render). */
export function applyBranding(b?: Branding | null) {
  if (!b) return;
  const ok = (v?: string | null): v is string => typeof v === 'string' && IMAGE_LINK.test(v);
  if (ok(b.logo)) BRAND.logo = b.logo;
  if (typeof b.officialName === 'string' && NAME.test(b.officialName.trim())) OFFICIAL.name = b.officialName.trim();
  const supply = Number(b.officialSupply);
  if (Number.isInteger(supply) && supply > 0 && supply <= 1_000_000) OFFICIAL.supply = supply;
  if (ok(b.officialLogo)) OFFICIAL.logo = b.officialLogo;
  if (ok(b.officialBanner)) OFFICIAL.banner = b.officialBanner;
  const art = Array.isArray(b.officialImages) ? b.officialImages.filter(ok).slice(0, 60) : [];
  if (art.length) OFFICIAL.images = art;
}

export const API_URL = (env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

/**
 * Contract addresses pinned at build time (Netlify env). The website only ever asks a wallet to approve or sign
 * for THESE contracts, even if the API or database were tampered with and served other addresses.
 */
const addrList = (v?: string) => (v || '').split(',').map((a) => a.trim().toLowerCase()).filter((a) => /^0x[0-9a-f]{40}$/.test(a));
export const PINNED = {
  market: addrList(env.VITE_MARKET_ADDRESS)[0] || null,
  factories: addrList(env.VITE_FACTORY_ADDRESSES),
  /** The chain this site trades on. The server can't switch it (or hand wallets another RPC). */
  chainId: Number(env.VITE_CHAIN_ID || 0) || null,
};

/** QMS Testnet defaults (docs.qms.finance → For Developers → Network and RPC). */
export const DEFAULT_NETWORK = {
  chainId: 19480,
  name: 'QMS Testnet',
  rpcUrl: 'https://rpc.testnet.qms.finance',
  explorerUrl: 'https://testnet.qmsscan.io',
  isTestnet: true,
};
/** Wrapped QMS (WQMS) on QMS Testnet: deposit QMS to get WQMS, withdraw to get QMS back. Verified on QMSScan. */
export const DEFAULT_WRAPPED_ADDRESS = '0x9aa510295ac664a3d5a3182a3efe959de2b12c34';
/** The wrapped-coin contract this build accepts for offers. A server that reports any other address is refused. */
export const WRAPPED_ADDRESS = (addrList(env.VITE_WRAPPED_ADDRESS)[0] || DEFAULT_WRAPPED_ADDRESS) as `0x${string}`;

export interface ChainInfo { chainId: number; name: string; rpcUrl: string; explorerUrl: string; isTestnet: boolean }

/** Builds the viem chain the whole app uses. The active network comes from the backend at startup. */
export function makeChain(n: ChainInfo): Chain {
  return defineChain({
    id: n.chainId,
    name: n.name,
    nativeCurrency: { name: NATIVE, symbol: NATIVE, decimals: 18 },
    rpcUrls: { default: { http: [env.VITE_RPC_URL || n.rpcUrl] } },
    blockExplorers: { default: { name: 'QMSScan', url: env.VITE_EXPLORER_URL || n.explorerUrl } },
    // Multicall3 is predeployed on QMS at its usual address, so reads can be batched into one RPC request.
    contracts: { multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' } },
    testnet: n.isTestnet,
  });
}

/**
 * EIP-712 domain name of the marketplace contract (what a wallet shows when an order is signed). It is set in the
 * contract's constructor, so it must match the deployed contract exactly or every signature is rejected.
 */
export const MARKET_DOMAIN_NAME = (env.VITE_MARKET_DOMAIN_NAME || 'Quantly Market').trim();

/** Live binding: set once in main.tsx before the app renders. */
export let activeChain: Chain = makeChain({ ...DEFAULT_NETWORK, chainId: Number(env.VITE_CHAIN_ID || 0) || DEFAULT_NETWORK.chainId });
export function setActiveChain(c: Chain) {
  activeChain = c;
}

/**
 * QMS blocks come from proof-of-work, about every 10 seconds, and the current testnet has no finality layer yet.
 * A transaction is shown as done once it is this many blocks deep, so a one-block reorg cannot undo what the
 * site just reported. 1 = as soon as it is mined.
 */
export const CONFIRMATIONS = Math.min(12, Math.max(1, Number(env.VITE_CONFIRMATIONS || 2) || 2));
/** How often the site asks the RPC for news. The public RPC is shared and rate limited, so this stays gentle. */
export const POLL_MS = 5_000;

export const LINKS = {
  docs: 'https://docs.qms.finance',
  faucet: 'https://faucet.testnet.qms.finance',
  status: 'https://status.testnet.qms.finance',
};
