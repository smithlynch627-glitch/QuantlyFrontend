// Amount display. Prices are always paid in the chain's native coin (offers in its wrapped form). There is no
// market price for the coin on QMS Testnet, so amounts are shown in the coin itself; `rate` is the hook where a
// price feed plugs in later (set it and USD values appear wherever `usd()` / `isUsd` is used).
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { NATIVE } from '../config';
import { fromWei } from './format';

/** "$1,234", "$12.5K", "$3.1M", "<$0.01". */
export function usdText(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a === 0) return '$0';
  if (a < 0.01) return `${sign}<$0.01`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `${sign}${a.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: a >= 100 ? 0 : 2 })}`;
}

type Wei = string | bigint | null | undefined;
const coinNumber = (wei: Wei) => (wei === null || wei === undefined || wei === '' ? null : Number(formatUnits(BigInt(wei), 18)));

/** USD per coin, or null while the coin has no market price. */
const RATE: number | null = null;

/**
 * money(wei)  → "0.05 QMS".
 * usd(wei)    → the USD value, or null while there is no price feed.
 */
export function useMoney() {
  const rate = RATE;
  return useMemo(() => {
    const usd = (wei: Wei) => {
      const n = coinNumber(wei);
      return n === null || !rate ? null : usdText(n * rate);
    };
    const money = (wei: Wei, unit: string = NATIVE) => {
      if (wei === null || wei === undefined || wei === '') return '—';
      return `${fromWei(wei)} ${unit}`;
    };
    /** Signed amounts (PnL): "+0.4 QMS". */
    const signed = (wei: Wei, unit: string = NATIVE) => {
      if (wei === null || wei === undefined || wei === '') return '—';
      const b = BigInt(wei);
      const abs = b < 0n ? -b : b;
      const text = money(abs, unit);
      return b > 0n ? `+${text}` : b < 0n ? `-${text}` : text;
    };
    return { rate, money, usd, signed, isUsd: false as boolean };
  }, [rate]);
}
