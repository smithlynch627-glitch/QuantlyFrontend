import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { errorMessage } from '../lib/actions';
import { fromWei, short, timeAgo, tokenLabel } from '../lib/format';
import { ensureSession, getSession } from '../lib/session';
import type { Collection, Order, UserProfile } from '../lib/types';
import { Avatar, TokenArt } from '../components/Art';
import { CollectionCard } from '../components/CollectionCard';
import { NftCard } from '../components/NftCard';
import { BulkBar, useBulkSelection, type OwnedToken } from '../components/bulk';
import { IconCheck, IconEyeOff, IconLock } from '../components/Icons';
import { useTrade } from '../components/trade';
import { CopyButton, EmptyState, GridSkeleton, Modal, Skeleton, Tabs, useToast } from '../components/ui';
import { ActivityTab } from './Collection';
import { BackButton } from '../components/BackButton';
import { NATIVE, WRAPPED } from '../config';

type Tab = 'items' | 'created' | 'listings' | 'made' | 'received' | 'activity';
const PAGE = 60;

export default function Profile() {
  const { address: raw = '' } = useParams();
  const addr = raw.toLowerCase();
  const { t } = useI18n();
  const { address: me } = useAccount();
  const isMe = !!me && me.toLowerCase() === addr;
  const [tab, setTab] = useState<Tab>('items');
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setTab('items');
  }, [addr]);

  // Your own profile is read with your session (if you have one), so lists you hid from others still show for you.
  const tok = isMe ? getSession(me) : null;
  const profile = useQuery({ queryKey: ['user', addr, !!tok], queryFn: () => api.get<UserProfile>(`/users/${addr}`, undefined, tok) });
  const counts = profile.data?.counts;
  const name = profile.data?.user.username;
  const pv = profile.data?.privacy;
  const self = !!profile.data?.self;
  const lockedCollected = !!pv?.hide_collected && !self;
  const lockedActivity = !!pv?.hide_activity && !self;
  const shown = (n: number | null | undefined) => (n === null ? '–' : (n ?? 0).toLocaleString());
  // A small mark on lists that are hidden: a lock for visitors, an eye for the owner (hidden from others only).
  const mark = (hidden: boolean | undefined) =>
    hidden ? (self ? <IconEyeOff size={14} aria-label={t('pv.hiddenBadge')} /> : <IconLock size={13} aria-label={t('pv.private')} />) : null;

  return (
    <div className="page container pf">
      <div className="back-row"><BackButton /></div>
      <div className="pf-layout">
      <aside className="pf-card">
        <div className="pf-card__avatar"><Avatar address={addr || '0x0'} size={112} /></div>
        {profile.isLoading ? <Skeleton h={34} w={200} /> : <h1 className="pf-card__name">{name || short(addr)}</h1>}
        <div className="pf-card__addr">{short(addr)}<CopyButton value={addr} /></div>
        {profile.data?.user.bio && <p className="soft pf-card__bio">{profile.data.user.bio}</p>}
        <dl className="pf-counts">
          <div><dt>{t('profile.items')}</dt><dd className="mono-num">{shown(counts?.owned)}</dd></div>
          <div><dt>{t('profile.listings')}</dt><dd className="mono-num">{shown(counts?.listed)}</dd></div>
          <div><dt>{t('profile.created')}</dt><dd className="mono-num">{(profile.data?.collections?.length ?? 0).toLocaleString()}</dd></div>
        </dl>
        {isMe && (
          <div className="pf-card__actions">
            <button className="btn btn--outline" onClick={() => setEditing(true)}>{t('profile.edit')}</button>
            <Link className="btn btn--ghost" to="/security"><IconLock size={16} />{t('sec.menu')}</Link>
          </div>
        )}
        {isMe && profile.data && <PrivacyPanel addr={addr} privacy={pv} />}
      </aside>

      <div className="pf-main">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'items', label: <>{t('profile.items')}{mark(pv?.hide_collected)}</>, count: counts?.owned ?? undefined },
          { id: 'created', label: t('profile.created'), count: profile.data?.collections?.length },
          { id: 'listings', label: <>{t('profile.listings')}{mark(pv?.hide_collected)}</>, count: counts?.listed ?? undefined },
          { id: 'made', label: <>{t('profile.offersMade')}{mark(pv?.hide_activity)}</>, count: counts?.offers_made ?? undefined },
          { id: 'received', label: <>{t('profile.offersReceived')}{mark(pv?.hide_collected)}</> },
          { id: 'activity', label: <>{t('profile.activity')}{mark(pv?.hide_activity)}</> },
        ]}
      />
      <div className="tab-panel" key={tab}>
      {profile.isLoading && tab !== 'created' ? <GridSkeleton /> : (
        <>
          {tab === 'items' && (lockedCollected ? <Private what="collected" isMe={isMe} /> : <Items addr={addr} isMe={isMe} tok={tok} />)}
          {tab === 'created' && <Created list={profile.data?.collections ?? []} isMe={isMe} />}
          {tab === 'listings' && (lockedCollected ? <Private what="collected" isMe={isMe} /> : <Orders path={`/users/${addr}/listings`} mode="listing" isMe={isMe} tok={tok} />)}
          {tab === 'made' && (lockedActivity ? <Private what="activity" isMe={isMe} /> : <Orders path={`/users/${addr}/offers-made`} mode="made" isMe={isMe} tok={tok} />)}
          {tab === 'received' && (lockedCollected ? <Private what="collected" isMe={isMe} /> : <Orders path={`/users/${addr}/offers-received`} mode="received" isMe={isMe} tok={tok} />)}
          {tab === 'activity' && (lockedActivity ? <Private what="activity" isMe={isMe} /> : <ActivityTab address={addr} session={tok} />)}
        </>
      )}
      </div>
      </div>
      </div>

      {isMe && editing && profile.data && <EditProfile p={profile.data} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Items({ addr, isMe, tok }: { addr: string; isMe: boolean; tok: string | null }) {
  const { t } = useI18n();
  const q = useInfiniteQuery({
    queryKey: ['user-tokens', addr, !!tok],
    queryFn: ({ pageParam }) => api.get<{ tokens: OwnedToken[]; total: number }>(`/users/${addr}/tokens`, { limit: PAGE, offset: pageParam }, tok),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (pages.length * PAGE < last.total ? pages.length * PAGE : undefined),
  });
  const tokens = q.data?.pages.flatMap((p) => p.tokens) ?? [];
  // Select mode (your own profile): pick items, then list, delist or send them together.
  const bulk = useBulkSelection();
  if (q.isLoading) return <GridSkeleton />;
  if ((q.error as any)?.code === 'private') return <Private what="collected" isMe={isMe} />;
  if (!tokens.length) return <EmptyState title={t('profile.emptyItems')} action={isMe ? <Link className="btn" to="/launchpad">{t('profile.goLaunchpad')}</Link> : undefined} />;
  return (
    <>
      {isMe && (
        <div className="manage-bar">
          <span className="small soft">{t('col.count', { n: q.data?.pages[0]?.total ?? tokens.length })}</span>
          <div className="row" style={{ gap: 8 }}>
            {bulk.managing && <button className="btn btn--ghost btn--sm" onClick={() => bulk.selectMany(tokens)}>{t('bulk.selectAll')}</button>}
            <button className={`btn btn--sm ${bulk.managing ? '' : 'btn--outline'}`} onClick={() => (bulk.managing ? bulk.stop() : bulk.start())} aria-pressed={bulk.managing}>
              <IconCheck size={15} />{bulk.managing ? t('bulk.done') : t('bulk.select')}
            </button>
          </div>
        </div>
      )}
      <div className="nft-grid">
        {tokens.map((tok) => (
          <NftCard
            key={`${tok.collection}:${tok.token_id}`}
            token={tok}
            collection={{ address: tok.collection, slug: tok.collection_slug!, art_style: tok.art_style!, name: tok.collection_name, tradable: tok.tradable, total_supply: tok.collection_supply }}
            showCollection
            manage={bulk.managing}
            selected={bulk.has(tok)}
            onToggle={() => bulk.toggle(tok)}
          />
        ))}
      </div>
      {q.hasNextPage && <div style={{ display: 'grid', placeItems: 'center', marginTop: 24 }}><button className="btn btn--outline" onClick={() => q.fetchNextPage()}>{t('common.loadMore')}</button></div>}
      <BulkBar bulk={bulk} />
    </>
  );
}

function Created({ list, isMe }: { list: Collection[]; isMe: boolean }) {
  const { t } = useI18n();
  if (!list.length) return <EmptyState title={t('profile.emptyCreated')} action={isMe ? <Link className="btn" to="/create">{t('lp.create')}</Link> : undefined} />;
  return (
    <div className="pf-created">
      {list.map((c) => (
        <div key={c.address} className="pf-created__item">
          <CollectionCard c={c} />
          {isMe && !c.is_external && <Link className="btn btn--sm btn--outline" to={`/studio/${c.slug}`}>{t('col.manage')}</Link>}
        </div>
      ))}
    </div>
  );
}

function Orders({ path, mode, isMe, tok }: { path: string; mode: 'listing' | 'made' | 'received'; isMe: boolean; tok: string | null }) {
  const { t, lang } = useI18n();
  const trade = useTrade();
  const q = useQuery({ queryKey: ['orders', path, !!tok], queryFn: () => api.get<{ orders: Order[] }>(path, undefined, tok) });
  const list = q.data?.orders ?? [];
  if (q.isLoading) return <Skeleton h={240} r={14} />;
  if ((q.error as any)?.code === 'private') return <Private what={mode === 'made' ? 'activity' : 'collected'} isMe={isMe} />;
  if (!list.length) return <EmptyState title={mode === 'listing' ? t('profile.emptyListings') : t('profile.emptyOffers')} />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t('common.item')}</th>
            <th className="num">{t('common.price')}</th>
            {mode === 'received' && <th>{t('common.from')}</th>}
            <th>{t('common.expires')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((o) => {
            const col = { address: o.collection!, art_style: o.art_style };
            return (
              <tr key={o.hash}>
                <td>
                  <Link to={o.token_id ? `/item/${o.collection_slug}/${o.token_id}` : `/collection/${o.collection_slug}`} className="cell-item">
                    <span className="thumb thumb--sm" style={{ position: 'relative' }}>
                      <TokenArt collection={col} token={{ token_id: o.token_id ?? '6', image_url: o.token_image, attributes: o.token_attributes }} />
                    </span>
                    <span style={{ display: 'grid' }}>
                      <span className="strong small">{o.token_id ? tokenLabel(o.token_name, o.token_id) : t('col.collectionOffer')}</span>
                      <span className="tiny muted">{o.collection_name}</span>
                    </span>
                  </Link>
                </td>
                <td className="num strong">{fromWei(o.price_wei)} {o.kind === 'listing' ? NATIVE : WRAPPED}</td>
                {mode === 'received' && <td><Link className="link" to={`/profile/${o.maker}`}>{short(o.maker)}</Link></td>}
                <td className="muted">{timeAgo(o.end_time, lang)}</td>
                <td style={{ textAlign: 'right' }}>
                  {isMe && mode !== 'received' && <button className="btn btn--outline btn--sm" onClick={() => trade.cancel(o, o.collection!)}>{mode === 'listing' ? t('item.cancelListing') : t('item.cancelOffer')}</button>}
                  {isMe && mode === 'received' && (
                    <button className="btn btn--sm" onClick={() => trade.accept(o, o.collection!)}>{t('item.accept')}</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditProfile({ p, onClose }: { p: UserProfile; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [username, setUsername] = useState(p.user.username ?? '');
  const [bio, setBio] = useState(p.user.bio ?? '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!address) return;
    setBusy(true);
    try {
      const token = await ensureSession(address, (message) => signMessageAsync({ message }));
      await api.put('/users/me', { username: username.trim() || null, bio }, token);
      qc.invalidateQueries({ queryKey: ['user'] });
      toast(t('profile.saved'));
      onClose();
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onClose={onClose} title={t('profile.edit')} locked={busy}>
      <div className="field"><label htmlFor="u-name">{t('profile.username')}</label><input id="u-name" className="input" maxLength={24} value={username} onChange={(e) => setUsername(e.target.value)} /></div>
      <div className="field"><label htmlFor="u-bio">{t('profile.bio')}</label><textarea id="u-bio" className="textarea" maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      <button className="btn btn--lg btn--block" onClick={save} disabled={busy}>{busy && <span className="spinner" />}{t('profile.save')}</button>
    </Modal>
  );
}

/** A list the wallet hid from others. On your own profile it explains that signing in shows it. */
function Private({ what, isMe }: { what: 'collected' | 'activity'; isMe: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  async function signIn() {
    if (!address) return;
    setBusy(true);
    try {
      await ensureSession(address, (message) => signMessageAsync({ message }));
      await qc.invalidateQueries();
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <EmptyState
      icon={<IconLock size={22} />}
      title={isMe ? t('pv.mineHidden') : t(what === 'collected' ? 'pv.privateCollected' : 'pv.privateActivity')}
      action={isMe ? <button className="btn" disabled={busy} onClick={signIn}>{busy && <span className="spinner" />}{t('pv.signIn')}</button> : undefined}
    />
  );
}

/** Your own profile: hide or show your collected items and your activity. Saved by the marketplace (no gas). */
function PrivacyPanel({ addr, privacy }: { addr: string; privacy?: UserProfile['privacy'] }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState<'collected' | 'activity' | null>(null);
  const v = privacy ?? { hide_collected: false, hide_activity: false };

  async function set(which: 'collected' | 'activity', hide: boolean) {
    if (!address || address.toLowerCase() !== addr) return;
    setBusy(which);
    try {
      const token = await ensureSession(address, (message) => signMessageAsync({ message }));
      const body = which === 'collected' ? { hideCollected: hide } : { hideActivity: hide };
      const res = await api.put<{ privacy: NonNullable<UserProfile['privacy']> }>('/users/me/privacy', body, token);
      qc.setQueriesData<UserProfile>({ queryKey: ['user', addr] }, (old) => (old ? { ...old, privacy: res.privacy } : old));
      qc.invalidateQueries({ queryKey: ['user', addr] });
      toast(hide ? t('pv.savedHidden') : t('pv.savedShown'));
    } catch (e) {
      toast(errorMessage(e, t), 'error');
    } finally {
      setBusy(null);
    }
  }

  const rows = [
    ['collected', 'pv.collected', 'pv.collectedHint', v.hide_collected],
    ['activity', 'pv.activity', 'pv.activityHint', v.hide_activity],
  ] as const;
  return (
    <section className="pf-privacy" aria-labelledby="pf-privacy-title">
      <h2 id="pf-privacy-title" className="pf-privacy__title">{t('pv.title')}</h2>
      {rows.map(([id, label, hint, on]) => (
        <label key={id} className="pf-privacy__row">
          <span className="pf-privacy__text">
            <span className="strong small">{t(label)}</span>
            <span className="tiny muted">{t(hint)}</span>
          </span>
          {busy === id ? <span className="spinner" /> : (
            <input type="checkbox" role="switch" className="switch" checked={on} disabled={!!busy} onChange={(e) => set(id, e.target.checked)} />
          )}
        </label>
      ))}
      <p className="tiny muted pf-privacy__note">{t('pv.note')}</p>
    </section>
  );
}
