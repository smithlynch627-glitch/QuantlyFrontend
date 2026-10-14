// Hooks for signed-in API calls and one-off contract transactions (Studio + Admin).
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { simulateContract, writeContract } from 'wagmi/actions';
import { activeChain } from '../config';
import { useI18n } from '../i18n';
import { useToast } from '../components/ui';
import { useWalletUI } from '../components/wallet';
import { api } from './api';
import { errorMessage } from './actions';
import { SLOW_TEXT, callOf, suggestFees, waitMined, type SlowReason } from './chaintx';
import { ensureSession, withSession } from './session';
import { wagmiConfig } from './wagmi';

export function useAuthedApi() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const token = useCallback(async () => {
    if (!address) throw new Error('Connect your wallet first');
    return ensureSession(address, (message) => signMessageAsync({ message }));
  }, [address, signMessageAsync]);
  const call = async <T,>(fn: (tk: string) => Promise<T>): Promise<T> => {
    if (!address) throw new Error('Connect your wallet first');
    return withSession(address, (message) => signMessageAsync({ message }), fn);
  };
  return {
    token,
    get: <T,>(path: string, params?: Record<string, any>) => call((tk) => api.get<T>(path, params, tk)),
    post: <T,>(path: string, body?: unknown) => call((tk) => api.post<T>(path, body, tk)),
    put: <T,>(path: string, body: unknown) => call((tk) => api.put<T>(path, body, tk)),
    patch: <T,>(path: string, body: unknown) => call((tk) => api.patch<T>(path, body, tk)),
    del: <T,>(path: string) => call((tk) => api.del<T>(path, tk)),
    upload: <T,>(path: string, file: File, fields?: Record<string, string>) => call((tk) => api.upload<T>(path, file, tk, fields)),
  };
}

/** Simulate → send → wait → sync the indexer, with toasts. Returns the receipt or null. */
export function useTx() {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const { address } = useAccount();
  const { ensureReady } = useWalletUI();
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async (label: string, params: any, success?: string) => {
      if (!(await ensureReady()) || !address) return null;
      setBusy(label);
      try {
        const { request } = await simulateContract(wagmiConfig, { ...params, account: address, chainId: activeChain.id });
        const fees = await suggestFees();
        const hash = await writeContract(wagmiConfig, { ...(request as any), ...fees });
        // A long wait is explained once per reason (lib/chaintx.ts), so the toast says what to do in the wallet.
        let told: SlowReason | null = null;
        const receipt = await waitMined(hash, address, callOf(request), (why) => {
          if (why && why !== 'busy' && why !== told) { told = why; toast(t(SLOW_TEXT[why])); }
        });
        await api.post('/orders/sync', { txHash: receipt.transactionHash }).catch(() => undefined);
        toast(success || t('tx.done'));
        qc.invalidateQueries();
        return receipt;
      } catch (e) {
        toast(errorMessage(e, t), 'error');
        return null;
      } finally {
        setBusy(null);
      }
    },
    [address, ensureReady, qc, t, toast],
  );
  return { busy, run };
}
