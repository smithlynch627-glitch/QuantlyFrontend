// Sending a transaction on QMS and waiting for it.
//
// QMS's base fee (the minimum fee per gas a block accepts) moves a lot: in October 2026 it went from about 100 wei
// to about 0.3 gwei within a day as the testnet got busy. Some wallets set the max fee to the price of the moment,
// with no room above it, so the next small rise leaves the transaction waiting in the mempool, and the site waiting
// with it. Two defences:
//  1. The site suggests the fee itself (wallets show it as "site suggested"): room for the base fee to triple, plus
//     the tip the network asks for. A block only charges its own base fee plus the tip, so the room costs nothing.
//  2. While a transaction waits, the site checks why and says what to do (speed it up in the wallet, or deal with
//     an older pending transaction first), instead of spinning without explanation.
import { encodeFunctionData, type Address, type Hash, type Hex, type TransactionReceipt } from 'viem';
import { getPublicClient, waitForTransactionReceipt } from 'wagmi/actions';
import { CONFIRMATIONS, activeChain } from '../config';
import type { DictKey } from '../i18n/en';
import { wagmiConfig } from './wagmi';

export type FeeSuggestion = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };

/** How far the base fee may rise between the fee being set and the transaction being mined. */
const BASE_FEE_ROOM = 3n;
/** Tip bounds: never zero (some miners skip zero-tip transactions), never more than 5 gwei. */
const MIN_TIP = 1_000_000n;
const MAX_TIP = 5_000_000_000n;

const client = () => getPublicClient(wagmiConfig, { chainId: activeChain.id });

/** Fee fields for a new transaction, or undefined to let the wallet decide (no base fee, or the RPC failed). */
export async function suggestFees(): Promise<FeeSuggestion | undefined> {
  const c = client();
  if (!c) return undefined;
  try {
    const [block, tip] = await Promise.all([
      c.getBlock({ blockTag: 'latest' }),
      c.estimateMaxPriorityFeePerGas().catch(() => 0n),
    ]);
    if (block.baseFeePerGas == null) return undefined;
    const priority = tip < MIN_TIP ? MIN_TIP : tip > MAX_TIP ? MAX_TIP : tip;
    return { maxFeePerGas: block.baseFeePerGas * BASE_FEE_ROOM + priority, maxPriorityFeePerGas: priority };
  } catch {
    return undefined;
  }
}

/**
 * Why a sent transaction is not in a block yet:
 * - fee: its max fee is below what blocks currently require, so no block can include it until it is sped up;
 * - queued: an older transaction from the same wallet is still pending, and this one waits behind it;
 * - unknown: the network's RPC has not seen it (the wallet sent it elsewhere, or it was dropped);
 * - busy: nothing is wrong with it, the network is just slow.
 * null: it is in a block already (only the confirmations are left), or it was replaced.
 */
export type SlowReason = 'fee' | 'queued' | 'unknown' | 'busy';

export const SLOW_TEXT: Record<SlowReason, DictKey> = {
  fee: 'tx.slowFee',
  queued: 'tx.slowQueued',
  unknown: 'tx.slowUnknown',
  busy: 'tx.slowBusy',
};

export async function whyPending(hash: Hash, from: Address): Promise<SlowReason | null> {
  const c = client();
  if (!c) return null;
  const tx = await c.getTransaction({ hash }).catch(() => null);
  if (!tx) return 'unknown';
  if (tx.blockNumber != null) return null;
  const [next, block] = await Promise.all([
    c.getTransactionCount({ address: from, blockTag: 'latest' }),
    c.getBlock({ blockTag: 'latest' }),
  ]);
  if (tx.nonce > next) return 'queued';
  if (tx.nonce < next) return null; // this nonce is already used: the wallet replaced it
  const cap = tx.maxFeePerGas ?? tx.gasPrice;
  if (cap != null && block.baseFeePerGas != null && cap < block.baseFeePerGas) return 'fee';
  return 'busy';
}

/** First check after a few blocks, then every 30 s. */
const FIRST_CHECK_MS = 40_000;
const CHECK_EVERY_MS = 30_000;
/** Long enough to speed a transaction up in the wallet without the site giving up first. */
const WAIT_LIMIT_MS = 20 * 60_000;

const REPLACED = 'This transaction was cancelled or replaced in your wallet, so nothing was done.';

/** What the site asked the wallet to send: a replacement only counts if it makes the same call. */
export type SentCall = { to: Address; input: Hex };
export function callOf(request: any): SentCall | undefined {
  try {
    return { to: request.address, input: encodeFunctionData({ abi: request.abi, functionName: request.functionName, args: request.args }) };
  } catch {
    return undefined;
  }
}

/**
 * Waits until the transaction is CONFIRMATIONS blocks deep and succeeded. A transaction sped up in the wallet
 * (same call, higher fee) counts as the same one; one cancelled or replaced by something else is an error.
 * viem does not always report a replacement when it waits for more than one block, so the transaction that
 * actually landed is compared with the call that was sent.
 */
export async function waitMined(hash: Hash, from: Address, sent?: SentCall, onSlow?: (why: SlowReason | null) => void): Promise<TransactionReceipt> {
  let finished = false;
  let replaced: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = async () => {
    const why = await whyPending(hash, from).catch(() => null);
    if (finished) return;
    onSlow?.(why);
    timer = setTimeout(check, CHECK_EVERY_MS);
  };
  if (onSlow) timer = setTimeout(check, FIRST_CHECK_MS);
  try {
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash,
      chainId: activeChain.id,
      confirmations: CONFIRMATIONS,
      timeout: WAIT_LIMIT_MS,
      onReplaced: (r) => { replaced = r.reason; },
    });
    if (replaced && replaced !== 'repriced') throw new Error(REPLACED);
    if (receipt.transactionHash.toLowerCase() !== hash.toLowerCase()) {
      const landed = await client()?.getTransaction({ hash: receipt.transactionHash }).catch(() => null);
      const same = !!landed && !!sent && landed.to?.toLowerCase() === sent.to.toLowerCase() && landed.input.toLowerCase() === sent.input.toLowerCase();
      if (!same) throw new Error(REPLACED);
    }
    if (receipt.status !== 'success') throw new Error('The transaction failed on-chain.');
    return receipt;
  } finally {
    finished = true;
    clearTimeout(timer);
    onSlow?.(null);
  }
}
