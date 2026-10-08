// Handing a collection to another wallet. The contract uses a two-step handover: the owner names the new
// wallet, and nothing changes until that wallet accepts here. A typo therefore can't lose the collection,
// and the owner can cancel at any time before it is accepted.
import { useState } from 'react';
import { isAddress, zeroAddress, type Address } from 'viem';
import { usePublicClient } from 'wagmi';
import { activeChain } from '../config';
import { useI18n } from '../i18n';
import { collectionOwnerAbi } from '../lib/abis';
import { short } from '../lib/format';
import type { Collection } from '../lib/types';
import { useTx } from '../lib/tx';
import { CollectionAvatar } from './Art';
import { IconAlert, IconCheck, IconUsers } from './Icons';

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function HandOver({ c, addr, owner, pending }: { c: Collection; addr: Address; owner: string; pending: string | null }) {
  const { t } = useI18n();
  const { busy, run } = useTx();
  const client = usePublicClient({ chainId: activeChain.id });
  const [to, setTo] = useState('');
  const [isContract, setIsContract] = useState(false);
  const target = to.trim();
  const valid = isAddress(target, { strict: false }) && !same(target, zeroAddress);
  const problem = !target || !valid ? null : same(target, owner) ? t('own.badSelf') : same(target, addr) ? t('own.badContract') : null;
  const waiting = pending && !same(pending, zeroAddress) ? pending : null;

  async function start() {
    const next = target.toLowerCase() as Address;
    // A contract wallet (a team safe, say) can be right, but it has to be able to call "accept": say so.
    const code = await client?.getCode({ address: next }).catch(() => undefined);
    const contract = !!code && code !== '0x';
    setIsContract(contract);
    if (!window.confirm(`${t('own.confirm', { name: c.name, to: next })}${contract ? `\n\n${t('own.contractWallet')}` : ''}`)) return;
    const ok = await run('own', { address: addr, abi: collectionOwnerAbi, functionName: 'transferOwnership', args: [next] }, t('own.started'));
    if (ok) setTo('');
  }

  return (
    <section className="st-sec">
      <header className="st-sec__head">
        <h2 className="st-sec__title">{t('own.title')}</h2>
        <p className="small soft">{t('own.sub')}</p>
      </header>
      <div className="st-sec__body">
        <p className="small soft" style={{ margin: 0 }}>{t('own.body')}</p>
        {waiting ? (
          <div className="own-wait">
            <span className="own-wait__icon" aria-hidden="true"><IconUsers size={18} /></span>
            <div className="st-stack">
              <strong>{t('own.waiting', { to: short(waiting) })}</strong>
              <span className="small soft">{t('own.waitingHint')}</span>
              <code className="md-link__value">{waiting}</code>
            </div>
            <button className="btn btn--outline btn--sm" disabled={!!busy}
              onClick={() => run('own', { address: addr, abi: collectionOwnerAbi, functionName: 'transferOwnership', args: [zeroAddress] }, t('own.cancelled'))}>
              {busy === 'own' && <span className="spinner" />}{t('own.cancel')}
            </button>
          </div>
        ) : (
          <div className="field">
            <label className="label" htmlFor="own-to">{t('own.to')}</label>
            <input id="own-to" className="input md-mono" value={to} onChange={(e) => { setTo(e.target.value.trim()); setIsContract(false); }} placeholder="0x…" spellCheck={false} autoComplete="off" />
            {problem && <span className="hint" style={{ color: 'var(--bad)' }}>{problem}</span>}
            {isContract && <span className="hint"><IconAlert size={13} /> {t('own.contractWallet')}</span>}
            <button className="btn btn--sm" style={{ justifySelf: 'start', marginTop: 6 }} disabled={!valid || !!problem || !!busy} onClick={start}>
              {busy === 'own' && <span className="spinner" />}{t('own.start')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Shown in place of the Studio to the wallet a collection is being handed to. */
export function AcceptHandover({ c, addr, owner, payout, feeWallet }: { c: Collection; addr: Address; owner: string; payout: string; feeWallet: string }) {
  const { t } = useI18n();
  const { busy, run } = useTx();
  const [done, setDone] = useState(false);
  return (
    <div className="own-accept">
      <span className="own-accept__art"><CollectionAvatar collection={c} /></span>
      <h1 className="own-accept__title">{t('own.acceptTitle', { name: c.name })}</h1>
      <p className="soft">{t('own.acceptBody', { from: short(owner) })}</p>
      {payout && <p className="small soft own-accept__note"><IconAlert size={15} />{t('own.acceptPayout', { payout: short(payout), fees: short(feeWallet || payout) })}</p>}
      {done ? (
        <span className="row strong"><IconCheck size={16} />{t('own.accepted')}</span>
      ) : (
        <button className="btn btn--lg" disabled={!!busy}
          onClick={async () => { if (await run('accept', { address: addr, abi: collectionOwnerAbi, functionName: 'acceptOwnership' }, t('own.accepted'))) setDone(true); }}>
          {busy === 'accept' && <span className="spinner" />}{t('own.accept')}
        </button>
      )}
    </div>
  );
}
