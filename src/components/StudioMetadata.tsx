// Creator Studio → Metadata: what collectors see now, uploading new metadata (or revealing), the placeholder,
// what "removing" metadata can and can't mean on a blockchain (plus a one-click hidden version), and locking.
// Every change here is a transaction from the owner wallet; the contract rejects anything once metadata is locked.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { activeChain, BRAND } from '../config';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { collectionOwnerAbi } from '../lib/abis';
import { useAppConfig } from '../lib/appConfig';
import { errorMessage } from '../lib/actions';
import type { Collection, Token } from '../lib/types';
import { useAuthedApi, useTx } from '../lib/tx';
import { TokenArt } from './Art';
import { ImageLinkRow, PreRevealPicker, toHttp, type LinkState } from './CreateArt';
import { IconAlert, IconCheck, IconExternal, IconLock, IconRefresh } from './Icons';
import { IpfsFolderUpload, uploadBuiltFolder } from './IpfsUpload';
import { MetadataCheck } from './MetadataCheck';
import { MetadataGuide } from './MetadataGuide';
import { CopyButton, Progress, useToast } from './ui';

type S = { revealed: boolean; frozen: boolean; maxSupply: number; minted: number };
const LINK = /^(ipfs:\/\/|https:\/\/|ar:\/\/)/;
/** Largest collection the browser builds a hidden folder for (one small file per item). */
const HIDE_MAX = 20_000;

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="st-sec">
      <header className="st-sec__head">
        <h2 className="st-sec__title">{title}</h2>
        <p className="small soft">{sub}</p>
      </header>
      <div className="st-sec__body">{children}</div>
    </section>
  );
}

export function StudioMetadata({ c, addr, s }: { c: Collection; addr: Address; s: S }) {
  const { t } = useI18n();
  return (
    <>
      <CurrentMetadata c={c} addr={addr} s={s} />
      {s.frozen ? null : (
        <>
          <NewMetadata c={c} addr={addr} s={s} />
          {!s.revealed && <Placeholder c={c} addr={addr} />}
          <RemoveMetadata c={c} addr={addr} s={s} />
          {s.revealed && (
            <Section title={t('md.lockTitle')} sub={t('md.lockSub')}>
              <LockMetadata addr={addr} />
            </Section>
          )}
        </>
      )}
    </>
  );
}

/** The first item as Quantly shows it, the link the contract returns for it, and a refresh. */
function CurrentMetadata({ c, addr, s }: { c: Collection; addr: Address; s: S }) {
  const { t } = useI18n();
  const toast = useToast();
  const authed = useAuthedApi();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const first = useQuery({
    queryKey: ['studio-first', c.address],
    queryFn: () => api.get<{ tokens: Token[] }>(`/collections/${c.address}/tokens`, { sort: 'id_asc', limit: 1 }),
  });
  const tok = first.data?.tokens[0];
  const uri = useReadContract({
    address: addr, abi: collectionOwnerAbi, functionName: 'tokenURI', args: tok ? [BigInt(tok.token_id)] : undefined, chainId: activeChain.id,
    query: { enabled: !!tok },
  });
  const raw = typeof uri.data === 'string' ? uri.data : '';
  // After the reveal the contract returns folder + id + ".json": show the folder, which is what the creator set.
  const suffix = tok ? `${tok.token_id}.json` : '';
  const link = s.revealed && raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : raw;
  const isData = link.startsWith('data:');
  const traits = Array.isArray(tok?.attributes) ? tok!.attributes.length : 0;
  const state = s.frozen ? 'md.stateLocked' : s.revealed ? 'md.stateLive' : 'md.stateHidden';

  async function refresh() {
    setBusy(true);
    try {
      const r = await authed.post<{ tokens: number }>(`/drops/${c.address}/refresh`);
      toast(t('md.refreshing', { n: r.tokens }));
      setTimeout(() => qc.invalidateQueries({ queryKey: ['studio-first', c.address] }), 8000);
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t('md.nowTitle')} sub={t('md.nowSub', { brand: BRAND.name })}>
      <div className="md-now">
        <div className="md-now__art">
          {tok ? <TokenArt collection={c} token={tok} /> : <span className="md-now__empty" aria-hidden="true" />}
        </div>
        <div className="md-now__info">
          <span className={`pill md-state md-state--${s.frozen ? 'locked' : s.revealed ? 'live' : 'hidden'}`}>
            {s.frozen && <IconLock size={13} />}{t(state)}
          </span>
          {tok ? (
            <>
              <strong className="md-now__name">{tok.name || `#${tok.token_id}`}</strong>
              <span className="small soft">{t('md.sample', { id: tok.token_id, brand: BRAND.name })} · {traits ? t('md.traits', { n: traits }) : t('md.noTraits')}</span>
            </>
          ) : (
            <p className="small soft" style={{ margin: 0 }}>{first.isLoading ? '…' : t('md.noneMinted')}</p>
          )}
        </div>
      </div>
      {tok && (
        <div className="md-link">
          <span className="label">{s.revealed ? t('md.linkFolder') : t('md.linkPlaceholder')}</span>
          {uri.isLoading ? <span className="small muted">…</span> : isData ? (
            <span className="small soft">{t('md.linkData')}</span>
          ) : link ? (
            <div className="md-link__row">
              <code className="md-link__value" title={link}>{link}</code>
              <CopyButton value={link} label={t('common.copy')} />
              {LINK.test(link) && (
                <a className="btn btn--ghost btn--sm" href={toHttp(s.revealed ? raw : link)} target="_blank" rel="noopener noreferrer nofollow">
                  <IconExternal size={14} />{t('md.open')}
                </a>
              )}
            </div>
          ) : <span className="small muted">—</span>}
        </div>
      )}
      {tok && (
        <div className="md-refresh">
          <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={refresh}>
            {busy ? <span className="spinner" /> : <IconRefresh size={15} />}{t('md.refresh', { brand: BRAND.name })}
          </button>
          <span className="hint">{t('md.refreshHint')}</span>
        </div>
      )}
      {s.frozen && <div className="notice"><IconLock size={16} />{t('md.locked')}</div>}
    </Section>
  );
}

/** Reveal (before) or switch to a new folder (after): upload two folders, or paste a link, then the folder check. */
function NewMetadata({ c, addr, s }: { c: Collection; addr: Address; s: S }) {
  const { t } = useI18n();
  const { busy, run } = useTx();
  const cfg = useAppConfig();
  const [mode, setMode] = useState<'upload' | 'link'>(cfg.ipfsUploads ? 'upload' : 'link');
  const [uri, setUri] = useState('');
  const [ok, setOk] = useState(false);
  const base = uri.trim();
  const valid = LINK.test(base) && base.endsWith('/');
  const action = s.revealed ? 'md.switch' : 'md.reveal';
  return (
    <Section title={t(s.revealed ? 'md.newTitle' : 'md.newTitleReveal')} sub={t(s.revealed ? 'md.newSub' : 'md.newSubReveal')}>
      <div className="segmented md-modes" role="tablist" aria-label={t(s.revealed ? 'md.newTitle' : 'md.newTitleReveal')}>
        {(['upload', 'link'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {t(m === 'upload' ? 'md.modeUpload' : 'md.modeLink')}
          </button>
        ))}
      </div>
      {mode === 'upload' ? (
        <>
          <MetadataGuide name={c.name} description={c.description || ''} supply={c.max_supply || s.maxSupply} />
          <IpfsFolderUpload expected={c.max_supply || undefined} onDone={(u) => { setUri(u); setOk(false); }} />
          {base && <div className="field"><label className="label">{t('create.baseUri')}</label><code className="md-link__value">{base}</code></div>}
        </>
      ) : (
        <div className="field">
          <label className="label" htmlFor="md-uri">{t('create.baseUri')}</label>
          <input id="md-uri" className="input" value={uri} onChange={(e) => { setUri(e.target.value.trim()); setOk(false); }} placeholder="ipfs://CID/" spellCheck={false} autoComplete="off" />
          <span className="hint">{t('create.baseUriHint')}</span>
        </div>
      )}
      {valid && <MetadataCheck baseUri={base} onResult={setOk} expected={s.maxSupply || undefined} onFix={setUri} />}
      <div className="row-wrap">
        <button className="btn" disabled={!valid || !ok || !!busy}
          onClick={() => run('meta', { address: addr, abi: collectionOwnerAbi, functionName: s.revealed ? 'setBaseURI' : 'reveal', args: [base] }, t('md.saved'))}>
          {busy === 'meta' && <span className="spinner" />}{t(action)}
        </button>
        {!ok && <span className="tiny muted">{t('md.checkFirst')}</span>}
      </div>
      <p className="tiny muted" style={{ margin: 0 }}>{t('md.oneTx')}</p>
    </Section>
  );
}

/** Before the reveal: swap the image every item shows. An image link is written into the contract itself. */
function Placeholder({ c, addr }: { c: Collection; addr: Address }) {
  const { t } = useI18n();
  const { busy, run } = useTx();
  const [uri, setUri] = useState('');
  return (
    <Section title={t('md.placeholderTitle')} sub={t('md.placeholderSub')}>
      <PreRevealPicker name={c.name} description={c.description || ''} value={uri} onChange={setUri} />
      <button className="btn" style={{ justifySelf: 'start' }} disabled={!uri || !!busy}
        onClick={() => run('pre', { address: addr, abi: collectionOwnerAbi, functionName: 'setUnrevealedURI', args: [uri] }, t('md.saved'))}>
        {busy === 'pre' && <span className="spinner" />}{t('md.placeholderSave')}
      </button>
    </Section>
  );
}

/**
 * Metadata can't be deleted from a blockchain or from IPFS. After the reveal the creator can still stop the
 * collection from using it: this builds a folder where every item shows one chosen image (no traits) and
 * switches the collection to it in one transaction.
 */
function RemoveMetadata({ c, addr, s }: { c: Collection; addr: Address; s: S }) {
  const { t } = useI18n();
  const cfg = useAppConfig();
  const toast = useToast();
  const authed = useAuthedApi();
  const { busy, run } = useTx();
  const [image, setImage] = useState('');
  const [imgState, setImgState] = useState<LinkState>('idle');
  const [note, setNote] = useState(() => t('md.hideDefault'));
  const [pct, setPct] = useState<number | null>(null);
  const [ready, setReady] = useState<{ uri: string; key: string } | null>(null);
  const n = s.maxSupply;
  const key = `${image}\n${note}\n${n}`;
  const built = ready?.key === key ? ready.uri : null;

  // One small file per item, numbered the way the contract reads them (folder + id + ".json").
  const files = () => {
    const description = note.trim().slice(0, 300);
    return Array.from({ length: n }, (_, i) => ({
      file: new Blob([JSON.stringify({ name: `${c.name} #${i + 1}`, description, image: image.trim() })], { type: 'application/json' }),
      path: `hidden/${i + 1}.json`,
    }));
  };

  async function build() {
    setPct(0);
    try {
      const uri = await uploadBuiltFolder(authed, files(), setPct);
      setReady({ uri, key });
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setPct(null);
    }
  }

  return (
    <Section title={t('md.removeTitle')} sub={t('md.removeSub')}>
      <p className="st-note">{t('md.removeWhy')}</p>
      {!s.revealed ? (
        <p className="small soft" style={{ margin: 0 }}>{t('md.removeBefore')}</p>
      ) : (
        <>
          <ul className="md-ways">
            <li><IconCheck size={15} />{t('md.removeOpt1')}</li>
            <li><IconCheck size={15} />{t('md.removeOpt2')}</li>
          </ul>
          {!cfg.ipfsUploads ? (
            <div className="notice"><IconAlert size={16} />{t('md.hideNeedsIpfs')}</div>
          ) : !(n >= 1 && n >= s.minted) ? (
            // The supply could not be read: never build (and switch to) a folder with the wrong number of files.
            <div className="notice"><IconAlert size={16} />{t('md.hideNoSupply')}</div>
          ) : n > HIDE_MAX ? (
            <div className="notice"><IconAlert size={16} />{t('md.hideTooBig', { max: HIDE_MAX.toLocaleString('en-US') })}</div>
          ) : (
            <div className="md-hide">
              <div className="field">
                <span className="label">{t('md.hideImage')}</span>
                <ImageLinkRow label={t('md.hideImage')} value={image} onChange={setImage} onState={setImgState} />
              </div>
              <div className="field">
                <label className="label" htmlFor="md-note">{t('md.hideNote')}</label>
                <input id="md-note" className="input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
              </div>
              {pct !== null && (
                <div>
                  <Progress value={pct} max={100} />
                  <div className="progress-meta"><span>{t('art.uploadingJson', { pct })}</span></div>
                </div>
              )}
              <div className="row-wrap">
                {built ? (
                  <>
                    <span className="row strong small"><IconCheck size={15} />{t('md.hideReady')}</span>
                    <button className="btn" disabled={!!busy}
                      onClick={() => window.confirm(t('md.hideConfirm')) && run('hide', { address: addr, abi: collectionOwnerAbi, functionName: 'setBaseURI', args: [built] }, t('md.hidden'))}>
                      {busy === 'hide' && <span className="spinner" />}{t('md.hideGo')}
                    </button>
                  </>
                ) : (
                  <button className="btn btn--outline" disabled={imgState !== 'ok' || pct !== null} onClick={build}>
                    {pct !== null && <span className="spinner" />}{t('md.hideBuild', { n: n.toLocaleString('en-US') })}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function LockMetadata({ addr }: { addr: Address }) {
  const { t } = useI18n();
  const { busy, run } = useTx();
  return (
    <>
      <p className="small soft" style={{ margin: 0 }}>{t('md.lockBody')}</p>
      <button className="btn btn--outline" style={{ justifySelf: 'start' }} disabled={!!busy}
        onClick={() => window.confirm(t('md.lockBody')) && run('freeze', { address: addr, abi: collectionOwnerAbi, functionName: 'freezeMetadata' }, t('md.locked'))}>
        {busy === 'freeze' && <span className="spinner" />}<IconLock size={15} />{t('md.lock')}
      </button>
    </>
  );
}
