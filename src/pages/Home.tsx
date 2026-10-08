import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BRAND, NATIVE, OFFICIAL, activeChain } from '../config';
import { useI18n } from '../i18n';
import { officialContent } from '../content/official';
import { api } from '../lib/api';
import { fromWei, num, short, timeAgo, tokenLabel } from '../lib/format';
import type { Activity, Collection, DropListItem } from '../lib/types';
import { CollectionAvatar, TokenArt } from '../components/Art';
import { CollectionCard } from '../components/CollectionCard';
import { DropCard, DropStatusPill } from '../components/DropCard';
import { FaqSection } from '../components/Faq';
import { IconArrowLeft, IconArrowRight, IconVerified } from '../components/Icons';
import { ArtRotator } from '../components/official';
import { Badge, CountdownLabel, EmptyState, Progress, Skeleton } from '../components/ui';

/** The official collection: artwork that changes every few seconds, its facts, and the way to its page or mint. */
function Spotlight({ drop }: { drop?: DropListItem }) {
  const { t, lang } = useI18n();
  const copy = useMemo(() => officialContent({ name: OFFICIAL.name, supply: OFFICIAL.supply, brand: BRAND.name, chain: activeChain.name }), []);
  const c = drop?.collection;
  const minting = !!drop && (drop.status === 'live' || drop.status === 'upcoming');
  return (
    <section className="section">
      <div className="spot">
        <Link to="/qubots" className="spot__media" aria-label={OFFICIAL.name}>
          <ArtRotator interval={3200} w={720} />
          {minting && drop && <span className="spot__status"><DropStatusPill d={drop} /></span>}
        </Link>
        <div className="spot__body">
          <span className="spot__eyebrow"><IconVerified size={16} official />{copy.eyebrow}</span>
          <h2 className="h1">{OFFICIAL.name}</h2>
          <p className="soft">{t('home.officialBody', { name: OFFICIAL.name })}</p>
          {minting && c ? (
            <div className="spot__progress">
              <Progress value={c.total_supply} max={c.max_supply || 1} />
              <div className="progress-meta">
                <span>{t('lp.minted', { n: num(c.total_supply, lang), max: num(c.max_supply, lang) })}</span>
                <span className="muted">
                  {drop.status === 'live' && drop.livePhase?.end ? <CountdownLabel k="lp.endsIn" to={drop.livePhase.end} /> : null}
                  {drop.status === 'upcoming' && drop.nextPhase ? <CountdownLabel k="lp.startsIn" to={drop.nextPhase.start} /> : null}
                </span>
              </div>
            </div>
          ) : (
            <dl className="spot__facts">
              {copy.facts.slice(0, 3).map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
            </dl>
          )}
          <div className="row-wrap">
            {minting
              ? <Link className="btn btn--lg" to={`/launchpad/${OFFICIAL.slug}`}>{t('home.mintNow')}<IconArrowRight size={16} /></Link>
              : <Link className="btn btn--lg" to="/qubots">{t('home.officialCta', { name: OFFICIAL.name })}<IconArrowRight size={16} /></Link>}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A row that scrolls sideways and snaps card by card, with previous / next buttons on wide screens. */
function Scroller({ children, label }: { children: ReactNode; label: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    on();
    el.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { el.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [children]);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(280, ref.current.clientWidth * 0.8), behavior: 'smooth' });
  return (
    <div className="scroller">
      <button type="button" className="scroller__btn scroller__btn--prev" onClick={() => move(-1)} disabled={edge.start} aria-label={t('common.prev')}><IconArrowLeft size={18} /></button>
      <div className="scroller__track" ref={ref} role="list" aria-label={label}>{children}</div>
      <button type="button" className="scroller__btn scroller__btn--next" onClick={() => move(1)} disabled={edge.end} aria-label={t('common.next')}><IconArrowRight size={18} /></button>
    </div>
  );
}

/** Collections the team marked as featured. The whole section is hidden when there are none. */
function FeaturedCollections() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['collections', 'featured'],
    queryFn: () => api.get<{ collections: Collection[] }>('/collections', { featured: 1, sort: 'volume', limit: 8 }),
  });
  const list = (q.data?.collections ?? []).filter((c) => c.slug !== OFFICIAL.slug);
  if (list.length === 0) return null;
  return (
    <section className="section">
      <div className="section__head">
        <div className="section__title">
          <h2 className="h2">{t('home.featuredCols')}</h2>
          <p className="small muted">{t('home.featuredSub')}</p>
        </div>
        <Link to="/explore" className="btn btn--outline btn--sm">{t('common.viewAll')}</Link>
      </div>
      <div className="ex-list">{list.map((c) => <CollectionCard key={c.address} c={c} />)}</div>
    </section>
  );
}

function Launchpad({ drops, loading }: { drops: DropListItem[]; loading: boolean }) {
  const { t } = useI18n();
  const rank = { live: 0, upcoming: 1, sold_out: 2, ended: 3 } as Record<string, number>;
  const list = [...drops].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)).slice(0, 6);
  return (
    <section className="section">
      <div className="section__head">
        <div className="section__title">
          <h2 className="h2">{t('home.drops')}</h2>
          <p className="small muted">{t('home.dropsSub')}</p>
        </div>
        <Link to="/launchpad" className="btn btn--outline btn--sm">{t('common.viewAll')}</Link>
      </div>
      {loading ? (
        <div className="lx-grid">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={360} r={30} />)}</div>
      ) : list.length === 0 ? (
        <EmptyState title={t('lp.emptyLive')} action={<Link className="btn" to="/create">{t('lp.create')}</Link>} />
      ) : (
        <Scroller label={t('home.drops')}>{list.map((d) => <div key={d.collection.address} className="scroller__item" role="listitem"><DropCard d={d} /></div>)}</Scroller>
      )}
    </section>
  );
}

/** One sale on the tape: artwork, what sold, for how much, how long ago. */
function SaleChip({ a }: { a: Activity }) {
  const { lang } = useI18n();
  const col = { address: a.collection, art_style: a.art_style, image_url: a.collection_image, name: a.collection_name };
  const itemUrl = a.token_id ? `/item/${a.collection_slug}/${a.token_id}` : `/collection/${a.collection_slug}`;
  return (
    <Link to={itemUrl} className="tape__item">
      <span className="tape__art">
        {a.token_id
          ? <TokenArt collection={col} token={{ token_id: a.token_id, image_url: a.token_image, attributes: a.token_attributes }} />
          : <CollectionAvatar collection={col} />}
      </span>
      <span className="tape__text">
        <span className="tape__name">{tokenLabel(a.token_name, a.token_id)}</span>
        <span className="tape__meta">{short(a.to_addr || '')} · {timeAgo(a.created_at, lang)}</span>
      </span>
      <span className="tape__price mono-num">{fromWei(a.price_wei)} {NATIVE}</span>
    </Link>
  );
}

/** The latest sales as a tape that drifts across the page; it pauses under the pointer or keyboard focus. */
function LatestSales() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ['activity', 'home-sales'],
    queryFn: () => api.get<{ activity: Activity[] }>('/activity', { types: 'sale', limit: 12 }),
    refetchInterval: 30_000,
  });
  const list = q.data?.activity ?? [];
  return (
    <section className="section">
      <div className="section__head">
        <div className="section__title">
          <h2 className="h2">{t('home.latestSales')}</h2>
          <p className="small muted">{t('home.salesSub')}</p>
        </div>
        <Link to="/activity" className="btn btn--outline btn--sm">{t('common.viewAll')}</Link>
      </div>
      {q.isLoading ? (
        <Skeleton h={76} r={22} />
      ) : list.length === 0 ? (
        <EmptyState title={t('home.noSales')} action={<Link className="btn btn--outline" to="/explore">{t('home.explore')}</Link>} />
      ) : (
        <div className="tape" style={{ ['--dur' as any]: `${Math.max(30, list.length * 6)}s` }}>
          <div className="tape__track">
            <div className="tape__group">{list.map((a) => <SaleChip key={a.id} a={a} />)}</div>
            <div className="tape__group" aria-hidden="true">{list.map((a) => <SaleChip key={`b${a.id}`} a={a} />)}</div>
          </div>
        </div>
      )}
    </section>
  );
}

/** Top collections as a two-column leaderboard; the bar under each name shows its volume against the leader. */
function Leaderboard() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState<'24h' | 'all'>('24h');
  const { data, isLoading } = useQuery({
    queryKey: ['collections', range],
    queryFn: () => api.get<{ collections: Collection[] }>('/collections', { sort: range === '24h' ? 'volume_24h' : 'volume', limit: 10 }),
  });
  const list = data?.collections ?? [];
  const vol = (c: Collection) => Number(BigInt((range === '24h' ? c.volume_24h_wei : c.volume_wei) || 0) / 10n ** 12n);
  const top = Math.max(1, ...list.map(vol));
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="h2">{t('home.trending')}</h2>
        <div className="row">
          <div className="segmented">
            <button aria-pressed={range === '24h'} onClick={() => setRange('24h')}>{t('home.tab24h')}</button>
            <button aria-pressed={range === 'all'} onClick={() => setRange('all')}>{t('home.tabAll')}</button>
          </div>
          <Link to="/explore" className="btn btn--outline btn--sm hide-sm">{t('common.viewAll')}</Link>
        </div>
      </div>
      {isLoading ? (
        <div className="lb">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={84} r={24} />)}</div>
      ) : list.length === 0 ? (
        <EmptyState title={t('explore.empty')} />
      ) : (
        <ol className="lb" key={range}>
          {list.map((c, i) => (
            <li key={c.address} style={{ ['--i' as any]: i }}>
              <Link to={`/collection/${c.slug}`} className="lb__row">
                <span className="lb__rank mono-num">{i + 1}</span>
                <span className="lb__avatar"><CollectionAvatar collection={c} /></span>
                <span className="lb__main">
                  <span className="lb__name">{c.name}<Badge official={c.is_official} verified={c.verified} /></span>
                  <span className="lb__bar" aria-hidden="true"><span style={{ width: `${Math.max(3, (vol(c) / top) * 100)}%` }} /></span>
                </span>
                <span className="lb__num"><span className="tiny muted">{t('common.floor')}</span><strong className="mono-num">{c.floor_wei ? `${fromWei(c.floor_wei)} ${NATIVE}` : '—'}</strong></span>
                <span className="lb__num"><span className="tiny muted">{range === '24h' ? t('common.volume24h') : t('common.volume')}</span><strong className="mono-num">{fromWei(range === '24h' ? c.volume_24h_wei : c.volume_wei)} {NATIVE}</strong></span>
                <span className="lb__num hide-md"><span className="tiny muted">{t('common.owners')}</span><strong className="mono-num">{num(c.owners_count, lang)}</strong></span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** The marketplace banner behind the first screen. If neither link loads, the violet stage shows on its own. */
function HeroBackdrop() {
  const links = [BRAND.banner, BRAND.bannerAlt].filter(Boolean);
  const [at, setAt] = useState(0);
  if (at >= links.length) return null;
  return <img className="hb__img" src={links[at]} alt="" decoding="async" onError={() => setAt((i) => i + 1)} />;
}

export default function Home() {
  const { t } = useI18n();
  const { data: drops, isLoading } = useQuery({ queryKey: ['drops', 'all'], queryFn: () => api.get<{ drops: DropListItem[] }>('/drops') });
  const list = drops?.drops ?? [];
  const officialDrop = list.find((d) => d.collection.slug === OFFICIAL.slug);

  return (
    <>
      <section className="hb">
        <div className="hb__stage">
          <HeroBackdrop />
          <div className="hb__shade" aria-hidden="true" />
          <div className="hb__inner">
            <Link to="/launchpad" className="hb__chip"><span className="live-dot" />{t('home.kicker', { chain: activeChain.name })}<IconArrowRight size={14} /></Link>
            {BRAND.bannerHeadline ? (
              <h1 className="hb__title">
                <span className="hb__name">{BRAND.name}</span>
                <span className="hb__tag">{t('home.tagline')}</span>
              </h1>
            ) : (
              <h1 className="hb__title hb__title--quiet">{BRAND.name}: {t('home.tagline')}</h1>
            )}
            <p className="hb__lead">{t('home.sub')}</p>
            <div className="hb__ctas">
              <Link to="/explore" className="btn btn--lg btn--white">{t('home.explore')}</Link>
              <Link to="/create" className="btn btn--lg btn--glass">{t('home.launch')}</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <Launchpad drops={list} loading={isLoading} />
        <Leaderboard />
        <Spotlight drop={officialDrop} />
        <FeaturedCollections />
        <LatestSales />
        <FaqSection only={['marketplace', 'launchpad']} />
      </div>
    </>
  );
}
