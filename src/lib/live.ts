// Live chain data for the status bar and fee estimates.
import { useQuery } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';
import { usePublicClient } from 'wagmi';
import { POLL_MS, activeChain } from '../config';

/** Latest block (number + age) and gas price. QMS blocks are proof-of-work: about 10 s apart, but uneven. */
export function useChainLive() {
  const client = usePublicClient({ chainId: activeChain.id });
  return useQuery({
    queryKey: ['chain-live', activeChain.id],
    queryFn: async () => {
      const [block, gasPrice] = await Promise.all([client!.getBlock({ blockTag: 'latest' }), client!.getGasPrice()]);
      return { block: block.number, timestamp: Number(block.timestamp), gasPrice };
    },
    enabled: !!client,
    refetchInterval: POLL_MS,
    retry: 1,
  });
}

/** Estimated network fee for a transaction (gas × current fee per gas). Undefined if the tx would fail. */
export function useNetworkFee(tx: { account?: Address; to?: Address; data?: Hex; value?: bigint } | null) {
  const client = usePublicClient({ chainId: activeChain.id });
  return useQuery({
    queryKey: ['network-fee', tx?.account, tx?.to, tx?.data, tx?.value?.toString()],
    queryFn: async () => {
      const [gas, fees] = await Promise.all([
        client!.estimateGas({ account: tx!.account!, to: tx!.to!, data: tx!.data, value: tx!.value }),
        client!.estimateFeesPerGas().catch(async () => ({ maxFeePerGas: await client!.getGasPrice() })),
      ]);
      return gas * (fees.maxFeePerGas ?? 0n);
    },
    enabled: !!client && !!tx?.account && !!tx?.to,
    staleTime: 15_000,
    retry: false,
  });
}

export function gweiText(wei?: bigint) {
  if (wei === undefined) return '—';
  const g = Number(wei) / 1e9;
  if (g === 0) return '0';
  if (g < 0.001) return g.toPrecision(2);
  return g < 10 ? g.toFixed(3) : g.toFixed(1);
}
