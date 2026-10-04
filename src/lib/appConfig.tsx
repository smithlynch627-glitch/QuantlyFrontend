import { createContext, useContext, type ReactNode } from 'react';
import { safeHref } from './format';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { AppConfig } from './types';
import { DEFAULT_NETWORK, DEFAULT_WRAPPED_ADDRESS, OFFICIAL } from '../config';

const FALLBACK: AppConfig = {
  ready: false,
  chainId: DEFAULT_NETWORK.chainId,
  rpcUrl: DEFAULT_NETWORK.rpcUrl,
  explorerUrl: DEFAULT_NETWORK.explorerUrl,
  market: null,
  factory: null,
  feeVault: null,
  wrapped: DEFAULT_WRAPPED_ADDRESS,
  marketFeeBps: null,
  mintFeeBps: null,
  official: { address: null, slug: OFFICIAL.slug },
};

const Ctx = createContext<AppConfig & { loaded: boolean }>({ ...FALLBACK, loaded: false });

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({ queryKey: ['config'], queryFn: () => api.get<AppConfig>('/config'), staleTime: 60_000, retry: 3 });
  // Explorer links: the pinned explorer when the build has one, otherwise only an https link from the API.
  const explorerUrl = (import.meta.env.VITE_EXPLORER_URL || safeHref(data?.explorerUrl) || FALLBACK.explorerUrl).replace(/\/$/, '');
  return <Ctx.Provider value={data ? { ...data, explorerUrl, loaded: true } : { ...FALLBACK, loaded: false }}>{children}</Ctx.Provider>;
}

export const useAppConfig = () => useContext(Ctx);
