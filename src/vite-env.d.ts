/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_OFFICIAL_X?: string;
  readonly VITE_NATIVE_SYMBOL?: string;
  readonly VITE_WRAPPED_SYMBOL?: string;
  readonly VITE_MARKET_DOMAIN_NAME?: string;
  readonly VITE_CONFIRMATIONS?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_EXPLORER_URL?: string;
  readonly VITE_MARKET_ADDRESS?: string;
  readonly VITE_FACTORY_ADDRESSES?: string;
  readonly VITE_WRAPPED_ADDRESS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
